+++
title = "Trying Out `sea-orm`"
date = "2024-01-09T16:26:15-08:00"
draft = true
+++

For a new project at my dayjob, I've had the opportunity to try out [`sea-orm`](https://www.sea-ql.org/SeaORM/) for the database layer. In the past, I've tried out other Rust SQL solutions including [`diesel`](https://diesel.rs/) and [`sqlx`](https://github.com/jmoiron/sqlx), so I have some context to compare this one to.

At a high level, `sea-orm` provides a fully-featured solution for managing your database setup in Rust. It provides a framework and CLI for setting up and maintaining migrations, code-gen'ing entities and relations, and writing + running queries. Like most other Rust DB options, it is fully typed and integration into Rust's type system.

`sea-orm` is built on top of several other `sea-*` crates that make up the ecosystem. They include crates like `sea-query`, `sea-schema`, `sea-orm-cli`, and some internal crates like `sea-orm-migration`.

**Note**: At the time of writing this (Jan. 2024), I don't have extensive experience with or knowledge about `sea-orm`; this is more of a "first impressions" writeup than a detailed review. Also, `sea-orm` and the rest of the `sea-query` ecosystem is under active development, so things may change significantly over time.

## Setup

For this project, we started with a fresh Postgres database with nothing in it. This is the best case for frameworks like these since they like to have full ownership + control over everything.

I opted to go for the full setup with migrations, code-generated entities, and managed DB connections.

One thing I noticed right away is that `sea-orm` is pretty prescriptive/opinionated about the crate layout and setup of the different components. It expects you to create separate crates for both the migrations and entities and join them together into a workspace.

For one thing, it's set up to pull in `async-std` by default for the migration crate. We (and pretty much everything else in the modern Rust ecosystem) use `tokio` which isn't compatible with `async-std` for some things. I was able to manually change it to use `tokio` without seeming to breaking anything, though.

Having to split up the database functionality into multiple crates is a bit awkward for our setup. We have a very large workspace with several dozen different crates at the top level. The project we're adding this database to has a crate of its own, so that means adding two additional crates to manage the database stuff and then importing them.

Compare this to something like `diesel`. It has a single `schema.rs` file which is generated based on the schema detected from the database. It contains a bunch of macros which define the various tables available and DSL for constructing queries. Since this all uses procedural macros, that definitely contributes to much of Diesel's reputation for slow compile times, though.

It might be possible to set `sea-orm` up to avoid these extra crates, but the docs I read definitely don't have any info on that. `sea-orm-cli` seems to require that at least the migrations are in their own crate, since it compiles it as a binary and runs it to run migrations.

## Migrations

The reason for this is that migrations themselves are defined using `sea-orm`'s builder syntax rather than as raw SQL files like other libraries. So the migrations you write look something like this:

```rs
 manager
  .create_table(
    Table::create()
      .table(Session::Table)
      .if_not_exists()
      .col(ColumnDef::new(Session::Id).uuid().not_null().primary_key())
      .col(ColumnDef::new(Session::UserId).string())
      .col(ColumnDef::new(Session::UserEmail).string())
      .col(
        ColumnDef::new(Session::CreationTimestamp)
          .timestamp()
          .not_null(),
      )
      .to_owned(),
  )
  .await?;
```

The main benefit of this, according to the `sea-orm` docs, is that it allows migrations to be independent of the backend database used - so you can theoretically re-use your migrations across Postgres, MySQL, Sqlite, and any other backends supported by `sea-query`.

Personally, I'm not a big fan of this. I find the builder syntax very verbose and hard to work with. `sea-orm` does have support for running migration queries as raw SQL, but you have to write them as Rust strings in the code anyway, so you don't get syntax highlighting in your editor, have to deal with annoying escaping issues, etc.

In addition, I'm not sure just how "backend-independent" these migrations are. I tried to set up an index by calling the [`.index()`](https://docs.rs/sea-query/latest/sea_query/table/struct.TableCreateStatement.html#method.index) method on a `TableCreateStatement`. This caused my migrations to start failing with a very unhelpful error:

```txt
syntax error at or near "("
```

I eventually figured out that there's a `--verbose` flag on the migration binary which prints out the raw queries being run, which helped.

It turns out that `.index()` function is actually only supported for the MySQL backend. For other databases, you have to create indexes using `SchemaManager::create_index()`.

It was annoying having to spend the time to figure this all out when I could have done it in 15 seconds if I was using raw SQL.

To `sea-orm`'s credit, though, pretty much every feature you could want _is_ available through the Rust interface itself. Even exotic types, postgres-specific built-in functions, typed JSON/array columns and operators, and more are all there.

## Entities

As I mentioned before, `sea-orm` handles auto-generating models/entities based on the schema detected from the database.

After you run your migrations, you run `sea-orm-cli generate entity` to codegen a bunch of rust files that are dumped into your entities crate.

TODO: Put info about actually working with entities

## `sea-*` Crate Organization

One other pain point I kept running into came from the fact that there are so many different `sea-*` crates across which the functionality I need is split across.

It was quite difficult to figure out where to import things from. There are even some cases where there are structs of the same name exist in different crates making it even harder to figure things out.

I also ran into problems like this when trying to set up an enum type + field for one of my tables. My goal was to create a single Postgres enum type and use it for a field on one of my tables.

In raw SQL, it would look something like this:

```sql
CREATE TYPE customer_status AS ENUM ('inactive', 'pending', 'active');

CREATE TABLE customers (
  -- ...
  cur_status customer_status
);
```

`sea-orm` certainly has support for generating custom types including enum types, and they have two docs pages about it: [Generating Entities -> Enumerations](https://www.sea-ql.org/SeaORM/docs/generate-entity/enumeration/) and [Schema Statement -> Create Enum](https://www.sea-ql.org/SeaORM/docs/schema-statement/create-enum/).

However, there's an issue. Both of those docs pages start from entities. They expect you to be manually defining these entities and then reference the entity in the code that performs the `CREATE TABLE`. This poses a chicken and egg problem for actually creating and referencing custom enum types within migrations.

It's extremely unclear to me how to actually set up an enum type and reference it in a table I'm creating from within a migration. I really feel like it's possible, but there's so much complexity involved.

There are several different derivable traits on things. The migration examples show you creating a different enum for each table and deriving `DeriveIden` on it so you can refer to the table and its fields in queries. Then, for the codegen'd entities, there's `DeriveEntityModel` which 'is the ‘almighty’ macro which automatically generates Entity, Column, and PrimaryKey'. Then there's an `ActiveEnum` which is the Rust type which corresponds to a custom enum type living in the DB. However, to define a table, you reference fields on that enum which are `Iden`s.

I tried a bunch of things, but yeah I couldn't figure it out. Diesel has a [third-party solution](https://github.com/adwhit/diesel-derive-enum) for this which I'm not particularly a fan of, but at least it works and is comparatively easy to set up.

## Programmatic Query Generation

TODO: Talk about how `sea-query` is great for programmatically constructing and manipulating SQL queries
