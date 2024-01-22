+++
title = "Trying Out `sea-orm`"
date = "2024-01-22T13:56:15-08:00"
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

That codegens a bunch of Rust that looks something like this:

```rs
//! `SeaORM` Entity. Generated by sea-orm-codegen 0.12.10

use sea_orm::entity::prelude::*;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq)]
#[sea_orm(table_name = "session")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub user_id: Option<String>,
    pub user_email: Option<String>,
    pub org_id: Uuid,
    pub creation_timestamp: DateTime,
    pub project_id: Uuid,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::active_session::Entity")]
    ActiveSession,
    #[sea_orm(has_many = "super::session_step::Entity")]
    SessionStep,
}

impl Related<super::active_session::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::ActiveSession.def()
    }
}

impl Related<super::session_step::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::SessionStep.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
```

This includes derives for a bunch of traits for getting/updating/inserting/deleting/joining these entities via `sea-orm`.

Overall, the entity system seems... OK. You can do all the usual ORM stuff like finding related entities, filtering with `.eq()`, and inserting new stuff. The APIs mostly seem pretty clean and make sense.

There's some of the familiar confusion due to the inclusion of `Active` variants of the models and entities. This system is designed to let you leave some portion of the model's fields unchanged/default when updating or inserting entities by wrapping them all in an [`ActiveValue`](https://docs.rs/sea-orm/latest/sea_orm/entity/enum.ActiveValue.html) enum. The API makes sense conceptually and does indeed work, but I find that it makes for a verbose and clunky developer experience.

My main grips with this are mostly rooted in the fact that I'm not really a big fan of heavy entity/model-based ORMs in general. I usually find it easier to write my queries by hand or using the more minimal query builder patterns from `diesel` or similar.

For most of the database stuff I end up building, it feels like the abstractions leak very quickly out of what the ORM is expecting. For some apps with simpler or more constrained database hierarchies, I feel like this kind of system would be a better fit. It's also very possible that I'm just doing something wrong or overlooking something.

In any case, there's not a ton here I have to complain about that could be blamed on `sea-orm` specifically.

## `sea-*` Crate Organization

One other pain point I kept running into came from the fact that there are so many different `sea-*` crates across which the functionality I need is split across.

It was quite difficult to figure out where to import things from. There are even some cases where there are structs of the same name exist in different crates making it even harder to figure things out.

I also ran into problems like this when trying to set up an enum type + field for one of my tables. My goal was to create a single Postgres enum type and use it for a field on one of my tables.

In raw SQL, it would look something like this:

```sql
CREATE TYPE customer_status AS ENUM ('inactive', 'pending', 'active');

CREATE TABLE customers (
  id uuid NOT NULL,
  cur_status customer_status
);
```

`sea-orm` certainly has support for generating custom types including enum types, and they have two docs pages about it: [Generating Entities -> Enumerations](https://www.sea-ql.org/SeaORM/docs/generate-entity/enumeration/) and [Schema Statement -> Create Enum](https://www.sea-ql.org/SeaORM/docs/schema-statement/create-enum/).

However, there's an issue. Both of those docs pages start from entities. They expect you to be manually defining these entities and then reference the entity in the code that performs the `CREATE TABLE`. This poses a chicken and egg problem for actually creating and referencing custom enum types within migrations.

It's extremely unclear to me how to actually set up an enum type and reference it in a table I'm creating from within a migration. I really feel like it's possible, but there's so much complexity involved.

There are several different derivable traits on things. The migration examples show you creating a different enum for each table and deriving `DeriveIden` on it so you can refer to the table and its fields in queries. Then, for the codegen'd entities, there's `DeriveEntityModel` which 'is the ‘almighty’ macro which automatically generates Entity, Column, and PrimaryKey'. Then there's an `ActiveEnum` which is the Rust type which corresponds to a custom enum type living in the DB. However, to define a table, you reference fields on that enum which are `Iden`s.

I tried a bunch of things, but yeah I couldn't figure it out. Diesel has a [third-party solution](https://github.com/adwhit/diesel-derive-enum) for this which I'm not particularly a fan of, but at least it works and is comparatively easy to set up.

## Programmatic Query Generation

Although not part of `sea-orm` itself, one thing I have to mention is how good `sea-query` is at doing programmatic query manipulation.

One project I built in the past year for my job at [Osmos](https://osmos.io/) is an interactive query builder web interface. It lets users design complicated with joins, filters, and complex aggregates. It does all of this in a sandboxed way, allowing us to make sure they can only query resources we give them access to.

Building this would have been _extremely_ difficult if it weren't for the powerful tools provided by `sea-query` and `sea-schema`. I strongly believe these libraries are the best tools available in the Rust ecosystem to perform advanced manipulation or generation of SQL queries. The amount of situations where something "just worked" after I found the right function was very high.

`sea-schema` is also a lovely gem of a crate. It's what `sea-orm` uses under the hood to do its codegen. `sea-schema` can connect to a live database and automatically discover the full schema for a given database. This includes all the details you would every need like data types, foreign keys, constraints, and all that kind of stuff. There are a few bugs and edge cases we've run into which honestly isn't surprising given how big that problem space is, but for the majority of cases it again "just works" and is very easy to work with code-wise.

## Conclusion

Overall, my impression of `sea-orm` is pretty lukewarm. The developer experience of setting up the crates, writing migrations, and making queries isn't my favorite compared to other alternatives. It's quite difficult for me to find the right way to do things due to a large number of magic traits required to do everything.

Again, a large part of this sentiment is personal preference. I think that a developer coming from the Rails/ActiveRecord world might enjoy an entity-based ORM like `sea-orm` much more than me. One of my co-workers advocated for us to try `sea-orm` in the first place which is why I ended up using it, so you might enjoy it as well.

I just want to say one more time that the underlying libraries like `sea-query`/`sea-schema` and the broader `sea-*` ecosystem really are excellent, though. Even if you don't go for the whole `sea-orm` experience, they're extremely useful on their own.
