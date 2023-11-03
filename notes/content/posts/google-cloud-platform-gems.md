+++
title = "Google Cloud Platform Gems"
date = "2023-10-25T13:36:15-07:00"
+++

I was reading [a Hacker News thread](https://news.ycombinator.com/item?id=38016849) for an article comparing GCP to some alternatives like AWS. I've been a GCP user for a good while now, and it's definitely my go-to public cloud. We also use it at my dayjob at [Osmos](https://osmos.io/).

Reading the article and comments got me thinking about some of my favorite GCP features. GCP has a few excellent gems which are better than pretty much any competing cloud offering:

- [Cloud Run](https://cloud.google.com/run). Best way to deploy containers hands down. All of the benefits of a serverless/containerized workload with all the ease of a traditional VPS deployment. Extremely cheap (pay $0 for side projects with little traffic).

- [BigQuery](https://cloud.google.com/bigquery). Very easy to use with immense power without having to deal with the details yourself. Billing can be either extremely cheap or rather expensive depending on what you're doing, though.

- [GCS Archive Storage](https://cloud.google.com/storage/docs/storage-classes#archive). 1/3 the cost of glacier for storage ($0.0012/GB/Month lol), but more for retrieval. Has none of the annoyances of Glacier (you can download your files instantly, upload using normal APIs). Perfect for extremely cheap backups.

- [Cloud Spanner](https://cloud.google.com/spanner). I've not had a reason to use this yet myself, but there really aren't any comparable offerings that I know of.
