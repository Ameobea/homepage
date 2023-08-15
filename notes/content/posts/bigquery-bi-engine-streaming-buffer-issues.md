+++
title = "Stale Queries When Hitting BigQuery Streaming Buffer When Using BI Engine"
date = "2023-07-06T16:12:49-05:00"
+++

> **UPDATE 2023-08-15**:
>
> Some engineers at Google reached out to me via e-mail after I submitted some feedback about this issue on the GCP console and linked to this blog post.
>
> After a few back and forth messages, they were able to diagnose the problem and put out a mitigation that completely fixed it for us!
>
> The issue seems to have stemmed from cursors tracking the position in the streaming buffer getting out of sync between the BI engine and base BigQuery.
>
> This was happening due to a complex self-join in the query we were running; half the query ran in BI engine, and the other half ran on backend BigQuery.
>
> I'm not 100% sure if the mitigation is deployed for all users at this time, but it should be soon if not.
>
> If you're still running into this issue, I suggest reaching out to Google via the feedback form in GCP that comes up when you disable BI engine.

## Background

We use BigQuery extensively at my job at [Osmos](https://osmos.io/). We use it for a variety of use cases and both read and write to it very often using complex dynamically generated queries.

To increase performance and reduce costs, we use [BI Engine](https://cloud.google.com/bigquery/docs/bi-engine-intro) for some of our tables. As described in the BI engine docs,

> BigQuery BI Engine is a fast, in-memory analysis service that accelerates many SQL queries in BigQuery by intelligently caching the data you use most frequently.

The table on which we ran into this issue uses [ingestion time partitioning](https://cloud.google.com/bigquery/docs/partitioned-tables#ingestion_time). It lumps data together in its storage backend based on the timestamp at which it was inserted.

When new data is inserted into ingestion time partitioned tables in BigQuery, it is added to a streaming insert buffer. Its `_PARTITIONTIME` field is set to null until a point in the future when it's asynchronously written to a partition and given a permanent `_PARTITIONTIME`.

We explicitly create our queries to include data in the streaming buffer like this:

```sql
SELECT ...
FROM ...
WHERE _PARTITIONTIME IS NULL
  OR _PARTITIONTIME >= TIMESTAMP_TRUNC(TIMESTAMP('2023-07-06 22:23:38'), HOUR);
```

This used to work just fine. Recently inserted data would show up in query results seconds after it was written. However, at some point recently, that stopped happening.

## The Problem

We were running into issues where some of our queries would fail to include data from recently inserted rows. We'd send the insert rows request to BigQuery, get a 200 response code, but then queries that look at that data would fail to include some of it until much later - sometimes up to an hour.

The only setup where we noticed this happening was when we had all of the following:

- BigQuery table set up using [ingestion time partitioning](https://cloud.google.com/bigquery/docs/partitioned-tables#ingestion_time)
- BI Engine enabled for the table
- Inserting data dynamically into the table and query that tries to read it from the streaming insert buffer (`_PARTITIONTIME IS NULL`)

## The Fix

... We shut of BI engine and the problem immediately stopped.

The thing is, this _definitely_ used to work for us in the past. We're almost certain we made no changes to our code or our infrastructure that would cause this change in behavior, so our only remaining explanation is that something changed on GCP's end.

I'm not sure if it can be considered a bug or not. Maybe the previous behavior was incorrect and this is just BI Engine's caching working as intended.

In any case, if you're running into strange issues with data not showing up and have a scenario like this with BI engine enabled, try shutting it off and seeing if it fixes the issue for you.
