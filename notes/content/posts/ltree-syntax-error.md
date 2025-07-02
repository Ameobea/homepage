+++
title = "Fixing ltree syntax error in Postgres 15"
date = "2025-07-02T16:06:30-05:00"
+++

## The Problem

I was recently working with some Postgres tables that have an `ltree` column.  I had written tests for my new feature that made use of them and all the tests passed locally.

However, the tests were failing in CI with a vague error:

```txt
ERROR: ltree syntax error at character 9 (SQLSTATE 42601)
```

The query that was producing this error was quite simple as well:

```sql
INSERT INTO "my_table" ("path","value") VALUES ('22e8f4e1-437f-448b-a8fb-0d7fbed8de7a','foo')
```

In this case, the `path` column was of type `ltree`.  Running that exact query locally worked fine and I was confused as to why it wasn't working in CI.

## The Cause

It turns out that I was running a more modern version of Postgres locally (17.5) than what was being run in CI (15).

In older versions of Postgres including 15, there is a limitation that values inserted into `ltree` columns can't contain the `-` character.  This limitation was removed in more recent versions.

I was able to work around this issue by just stripping all non-alphanumeric characters out of my UUIDs before inserting them into the column.
