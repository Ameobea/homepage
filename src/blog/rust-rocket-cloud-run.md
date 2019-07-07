---
title: 'Deploying a REST API with Rust, Diesel, Rocket, and MySQL on Google Cloud Run'
date: '2019-04-23'
---

Google has recently released a beta of their new [Cloud Run](https://cloud.google.com/run/) service, a platform for running stateless webservers via containers in the cloud. It combines the best aspects of both serverless architecures and hosted container solutions such as Amazon's EKS, making the process of deploying stateless web applications to the cloud easier than ever before.

In addition, it's extremely flexible with regard to the actual implementation of the webserver, only requiring that it listens on a port provided by the `PORT` environment variable and responds to HTTP requests. Since the underlying platform doesn't care what actually goes on inside the server, running a Rust application is arguably the simplest option of all since it compiles into a single binary.

## Overview

Here, we're going to set up a demo application that exposes a dead-simple CRUD interface to an underlying MySQL database. You can swap out the database very easily for others such as Postgres by just changing a few lines of code and dependencies.

I've created a repo containing all of the code from this tutorial here: [https://github.com/Ameobea/rust-cloud-run-demo](https://github.com/Ameobea/rust-cloud-run-demo)

If you're already familiar with Rust/Rocket/Diesel, you may want to skip ahead to the **Deploying** section which walks through buliding + deploying the app on cloud run.

## Initial Setup

### Diesel

[Diesel](https://diesel.rs/) is a database ORM for Rust that abstracts away the details of SQL and allows you to interact with databases in a generic and abstracted way. It integrates beautifully with Rocket, `serde`, and the rest of our software stack.

You'll need to install the `diesel-cli` program in order to facilitate automated database setup and migration generation. All you have to do is run:

```sh
cargo install diesel_cli --no-default-features --features mysql
```

If you're using Postgres, just replace `mysql` with `postgres`.

### Database

Since Cloud Run is only for stateless web applications, you'll need to set up the database separately. You can either just use any old VPS and install it on there (there are hundreds of tutorials for that around the internet) or use a hosted option from Google Cloud or AWS or elsewhere. In my case, I'm just going to re-use an existing one I have that serves several of my personal applications and sites.

Create a database for the demo application. For this demo, I'm going to call it `rocket_app`. We'll also need a user with full permissions to that database, which I'll name `rocket. It's good practice to only give the created user account access to the database for the application and to create new users for each app. That way, if there is some security breach and someone gains access to the user, they can only read data from that application and not all of the others that share the database.

You can create the user, create the database, and set up permissions by running these three simple SQL queries:

```sql
CREATE USER 'rocket'@'%' IDENTIFIED BY 'password';

CREATE DATABASE rocket_app;

GRANT ALL PRIVILEGES ON rocket_app.* TO rocket;
```

The Postgres version of this would be equivalent or very similar.

## Project

Once your database is set up, we'll need to create the Rust project:

`cargo init --bin rocket-app`

Inside the created `rocket-app` directory, we'll add some dependencies to `Cargo.toml`. Here's what it should look like:

```toml
[package]
name = "rocket-app"
version = "0.1.0"
authors = ["Casey Primozic <me@ameo.link>"]
edition = "2018"

[dependencies]
# Powerful date and time functionality
chrono = { version = "0.4.6", features = ["serde"] }

# For connecting with the MySQL database
diesel = { version = "1.4.2", features = ["chrono"] }

# Lazy static initialization
lazy_static = "1.3.0"

# Rocket Webserver
rocket = "0.4.0"
rocket_contrib = { version = "0.4.0", features = ["json", "diesel_mysql_pool"] }

# Serialization/Deserialization
serde_json = "1.0.39"
serde = "1.0.90"
serde_derive = "1.0.90"
```

## Database Schema + Migrations

For our application, we're going to be creating an API for recording visits to websites - kind of like a mini Google Analytics without the tracking. We're not going to worry about anything like authentication or permissions; those can be added in on top later. Instead, we're just going to create API endpoints for creating and listing pageview events.

In order to define our database's schema, we need to set up **migrations**. Migrations are just small SQL scripts that are run in order to set up or tear down the database and alter its schema later down the line. Diesel handles a lot of the process of setting up and running these.

The first thing to do is create the file `diesel.toml` in the project root. This holds config used by the `diesel` application. Create it with this content:

```toml
# For documentation on how to configure this file,
# see diesel.rs/guides/configuring-diesel-cli

[print_schema]
file = "src/schema.rs"
```

We need to first tell diesel how to connect to our database. To do this, export the `DATABASE_URL` environment variable with values changed to reflect your database:

```sh
export DATABASE_URL="mysql://rocket:password@example.com/rocket_app"
```

To get started on creating the migrations themselves, just run the following from your project's root directory:

```sh
diesel setup # Creates `migrations` directory + `src/schema.rs` file
diesel migration generate initialize
```

It will create some files in the `migrations` directory which we now have to populate. Fill them with the following:

```sql
# up.sql

CREATE TABLE `rocket_app`.`pageviews` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `view_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `url` VARCHAR(2083) NOT NULL,
  `user_agent` VARCHAR(2083) NOT NULL,
  `referrer` VARCHAR(2083) NOT NULL,
  `device_type` TINYINT NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
);
```

```sql
# down.sql

DROP TABLE `rocket_app`.`pageviews`;
```

These queries will be executed automatically by the `diesel` CLI program when running migrations. To actually go ahead and run them, just execute:

```sh
diesel migration run
```

This, if successful, will execute the `up.sql` query and create the `pageviews` table in your database. If `diesel` reports an error, check that you copied the query correctly, that your database credentials are correct, and that your database is accessible from the computer you're running the migrations from.

To test the `down` stage of the migrations, you can tear it down and re-run it by running:

```sh
diesel migration redo
```

This will also create the `src/schema.rs` file automatically while defines the database's schema to Rust. It should look like this:

```rs
table! {
    pageviews (id) {
        id -> Bigint,
        view_time -> Datetime,
        url -> Varchar,
        user_agent -> Varchar,
        referrer -> Varchar,
        device_type -> Tinyint,
    }
}
```

## Rocket

The webserver we're going to use is called [Rocket](https://rocket.rs/). Rocket is a fast and simple Rust web framework and my favorite among all the Rust web frameworks I've tried. Although it doesn't do some of the fancy asynchronous requests/responses that others offer, it is still incredibly performant and dead simple to use. Rocket requires rust nightly in order to run.

I created files named `models.rs`, `routes.rs`, and `cors.rs` in the `src` directory; we'll get to those later. I also added the following to the `main.rs` file to set up a skeleton Rocket application:

```rs
#![feature(proc_macro_hygiene, decl_macro)]

extern crate chrono;
#[macro_use]
extern crate diesel;
#[macro_use]
extern crate rocket;
#[macro_use]
extern crate rocket_contrib;
extern crate serde;
extern crate serde_json;
#[macro_use]
extern crate serde_derive;

pub mod cors;
pub mod models;
pub mod routes;
pub mod schema; // Ignore errors from this for now; it doesn't get created unti later

// This registers your database with Rocket, returning a `Fairing` that can be `.attach`'d to your
// Rocket application to set up a connection pool for it and automatically manage it for you.
#[database("rocket_app")]
pub struct DbConn(diesel::MysqlConnection);

fn main() {
    rocket::ignite()
        .mount("/", routes![/* TODO */])
        .attach(DbConn::fairing())
        .launch();
}
```

This will set up a connection pool for your database and automatically manage it as state on the Rocket server. It also contains the basic code for starting up the webserver and registering routes, although we don't have any of those yet.

### Models

**Models** are just Rust structs that map to the tables in the database. Diesel uses them to allow abstracted access to the underlying data, automatically converting to/from MySQL data types and Rust data types and handling converting queries to SQL.

We only have one model for our application which is based off of the `pageviews` table. Here's what it looks like:

```rs
use chrono::NaiveDateTime;

use crate::schema::pageviews;

/// This represents a page view pulled from the database, including the auto-generated fields
#[derive(Serialize, Deserialize, Queryable)]
pub struct PageView {
    pub id: i64,
    pub view_time: NaiveDateTime,
    pub url: String,
    pub user_agent: String,
    pub referrer: String,
    pub device_type: i8,
}

/// This represents a page view being inserted into the database, without the auto-generated fields
#[derive(Deserialize, Insertable)]
#[table_name = "pageviews"]
pub struct InsertablePageView {
    pub url: String,
    pub user_agent: String,
    pub referrer: String,
    pub device_type: i8,
}
```

Each one of the structs' fields line up to a column in the `page_views` column with the types matching the SQL types we used when defining the table via the migrations. That's all we have to do for now, but we can easily add functionality to these models by just `impl`'ing them. They're just normal Rust structs and can be created and interacted with normally.

### Routes

**Routes** define the API endpoints for the application. Rocket provides some powerful macros that make defining routes very simple. Here, we'll set up some routes for recording new page views and listing all recorded page views.

Fill `src/routes.rs` with this content:

```rs
use diesel::{self, prelude::*};

use rocket_contrib::json::Json;

use crate::models::{InsertablePageView, PageView};
use crate::schema;
use crate::DbConn;

#[get("/")]
pub fn index() -> &'static str {
    "Application successfully started!"
}

#[post("/page_view", data = "<page_view>")]
pub fn create_page_view(
    conn: DbConn,
    page_view: Json<InsertablePageView>,
) -> Result<String, String> {
    let inserted_rows = diesel::insert_into(schema::pageviews::table)
        .values(&page_view.0)
        .execute(&conn.0)
        .map_err(|err| -> String {
            println!("Error inserting row: {:?}", err);
            "Error inserting row into database".into()
        })?;

    Ok(format!("Inserted {} row(s).", inserted_rows))
}

#[get("/page_view")]
pub fn list_page_views(conn: DbConn) -> Result<Json<Vec<PageView>>, String> {
    use crate::schema::pageviews::dsl::*;

    pageviews.load(&conn.0).map_err(|err| -> String {
        println!("Error querying page views: {:?}", err);
        "Error querying page views from the database".into()
    }).map(Json)
}

```

You'll also need to register these routes in `main.rs`:

```rs
fn main() {
    rocket::ignite()
        .mount("/", routes![
            routes::index,
            routes::create_page_view,
            routes::list_page_views,
        ])
        .attach(DbConn::fairing())
        .launch();
}
```

The `create_page_view` function accepts a `POST` request with a JSON payload defining a new page view and inserts it into the database. Its arguments include `conn` (an instance of a database connection managed by Rocket) and `page_view` (an `InsertablePageView` struct automatically deserialized from the request body that is wrapped in a Rocket `Json` helper struct).

Inside, we use `diesel` to create a query that inserts the `PageView` into the `page_views` table and executes it on the supplied connection, handling errors by returning a `Result` that, in the case of an `Err()`, will automatically set the status code to 500 and return the provided error message to the user (logging the actual error that occured to `stdout`).

The `list_page_views` function works by executing a very basic query via `diesel` that loads all page views out of the `page_views` table into `PageView` structs. Rocket automatically handles serializing them into JSON and returning the result via the `Json` helper struct again.

Diesel has support for pretty much every kind of query you could want to make for any use case. Check out their [guides](http://diesel.rs/guides/) for more information.

### CORS

One thing that we need to do if we want this API to be consumable from a web browser is to add CORS headers to our responses. CORS headers are used by web browsers to enforce security on fetched web content. They prevent, for example, a malicious website from making a request to your banking website and reading your private information without your permission.

APIs that are meant to be readable from different domains than the one the user is currently on (cross-domain) must add headers to their responses to indicate what resources are allowed to be fetched and under what conditions.

We're going to set up a very simple CORS implementation that just allows everyone to access everything from anywhere. You can tweak this to have a more fine-tuned setup by including any of the [supported headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) in responses instead of or in addition to the one we add here.

Our CORS implementation is going to make use of Rocket's [Fairings](https://rocket.rs/v0.4/guide/fairings/#fairings), which are like light-weight middlewares that can alter requests and responses in between them getting received/sent back.

In the `src/cors.rs` file, put the following code:

```rs
use rocket::fairing::{Fairing, Info, Kind};
use rocket::{http::Method, http::Status, Request, Response};

pub struct CorsFairing;

impl Fairing for CorsFairing {
    fn on_response(&self, request: &Request, response: &mut Response) {
        // Add CORS headers to allow all origins to all outgoing requests
        response.set_header(rocket::http::Header::new(
            "Access-Control-Allow-Origin",
            "*",
        ));

        // Respond to all `OPTIONS` requests with a `204` (no content) status
        if response.status() == Status::NotFound && request.method() == Method::Options {
            response.set_status(Status::NoContent);
        }
    }

    fn info(&self) -> Info {
        Info {
            name: "CORS Fairing",
            kind: Kind::Response,
        }
    }
}
```

We'll also have to make a few changes to `main.rs` to register this fairing with Rocket:

```rs
fn main() {
    rocket::ignite()
        .mount("/", routes![
            routes::index,
            routes::create_page_view,
            routes::list_page_views,
        ])
        .attach(DbConn::fairing())
        .attach(cors::CorsFairing) // Add this line
        .launch();
}
```

This will make every route accessible from any web page, which makes sense since we want users to be able to hit them from potentially many different websites.

### Lauching

At this point, we've got all the pieces we need to actually run the webserver! The only thing left to do is tell Rocket how to access your database by exporting one last environment variable:

```sh
export ROCKET_DATABASES="{ rocket_app = { url = \"$DATABASE_URL\" } }"
```

Then, just run `cargo run` and Rocket should launch your server on port 8000. You can test it out by visiting [http://localhost:8000/](http://localhost:8000/) in your browser, which should display the success message we added in the `index` route.

To create some sample page views, run the following `curl` command:

```sh
curl -X POST -H "Content-Type: application/json" -d '{"url": "https://example.com/", "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36", "referrer": "https://google.com/", "device_type": 0 }' http://localhost:8000/page_view
```

You should see "Inserted 1 row(s)" print to the console as the response. To see the inserted page view, run:

```sh
curl http://localhost:8000/page_view
```

---

That's it! We've created a bare-bones CRUD JSON REST API (well, the CR part at least) and verified that it works. Adding additional functionality on top of this is easy: just create new models, routes, and migrations as needed. There are several examples of adding authentication on top around such as [this one](https://github.com/marcocastignoli/rust_rocket_api_authentication) which uses JSON Web Tokens.

## Deploying

Now that we've got out application working, it's time to make it available to the world!

### Setting Up Google Cloud

In order to use cloud run, you'll need a Google Cloud account set up. It's free, and you get a bunch of free tier for cloud run by default. Create a project (Google has excellent tutorials for all of this) and [install the `gcloud` CLI application](https://cloud.google.com/sdk/install). For the purposes of this demo, we're going to assume that the project ID is `page-view-counter-01`.

### Creating the Dockerfile

The first step is creating a Docker container for our application. Luckly, this is extremely simple. Just create a `Dockerfile` in the project root with this content:

```sh
FROM debian:jessie AS builder

# You'll need to change `libmysqlclient-dev` to `libpq-dev` if you're using Postgres
RUN apt-get update && apt-get install -y curl libmysqlclient-dev build-essential

# Install rust
RUN curl https://sh.rustup.rs/ -sSf | \
  sh -s -- -y --default-toolchain nightly-2019-04-23

ENV PATH="/root/.cargo/bin:${PATH}"

ADD . ./

RUN cargo build --release

FROM debian:jessie

RUN apt-get update && apt-get install -y libmysqlclient-dev

COPY --from=builder \
  /target/release/rocket-app \
  /usr/local/bin/

WORKDIR /root
CMD ROCKET_PORT=$PORT /usr/local/bin/rocket-app
```

This uses a two-stage build that first creates a container which compiles the Rust application and a second that copies the compiled binary in from the first one and executes it. That's really all there is; the only other thing to notice is how `ROCKET_PORT` is set to the existing `$PORT` environment variable in the entrypoint command declaration. Google Cloud Run exports the `PORT` environment variable and expects our application to listen for requests on it, and Rocket uses the `ROCKET_PORT` variable as its override control, so we just map the value between them manually to facilitate it.

Run `echo target >> .dockerignore` to speed up builds by keeping the `target` directory out of the build context.

### Buliding + Pushing the Image

To build the image, just run this command:

```sh
docker build -t gcr.io/page-view-counter-01/rocket-app .
```

If you haven't before, run this command to set up pushing to the Google Container Registry:

```sh
gcloud auth configure-docker
```

Once the build completes, push it to Google Container Registery with this command:

```sh
docker push gcr.io/page-view-counter-01/rocket-app
```

### Deploying to Cloud Run

Now, the only thing left to do is create a cloud run deployment with the image. There's no configuration for capacity or anything like that to do; cloud run automatically handles scaling your application based on demand and resource usage.

We need to provide one environment variable, `ROCKET_DATABASES`, to the container when it runs so it knows how to connect to our database. That can be applied with a flag to the `gcloud` command.

Run this command to create the deployment:

```sh
gcloud beta run deploy --set-env-vars="ROCKET_DATABASES=$ROCKET_DATABASES" gcr.io/page-view-counter-01/rocket-app:latest
```

When prompted if you want to allow unauthenticated traffic, say yes. Pick whatever region and name you want. If all goes well, you should see a success message with a URL for the deployment that looks something like this: https://rocket-app-mi7imxlw6a-uc.a.run.app

In the case that you get errors when launching the application, you may want to check the cloud run page on the cloud console. It will show your deployment in the services list and after clicking on it will give you the option of looking through logs and showing details about the deployment.

To test your deployment, just switch the URLs and `curl` commands from the **Launching** section to use the created deployment URL instead of localhost. The data will be the same since it's using the same MySQL database, so visiting [https://rocket-app-mi7imxlw6a-uc.a.run.app/page_view](https://rocket-app-mi7imxlw6a-uc.a.run.app/page_view) (using your own URL in place of this one) in your browser will show you the example page view you created earlier.

## Benchmarking + Stress Testing

As a fun activity, we can benchmark the created service using the [drill](https://github.com/fcsonline/drill) HTTP load testing application. Install drill by running:

```sh
cargo install drill
```

All you need to do is create a simple YAML file defining the benchmark in `benchmark.yml`:

```yml
---
threads: 4
base: 'https://rocket-app-mi7imxlw6a-uc.a.run.app' # Use your deployment URL here
iterations: 50
rampup: 2

plan:
  - name: Retrieve Page Views
    request:
      url: /page_view
```

Then, run `drill` to initiate the benchmark:

```sh
drill --benchmark benchmark.yml --stats
```

After the benchmark completes, you should see aggregate stats from the whole run:

```txt
Retrieve Page Views       Total requests            200
Retrieve Page Views       Successful requests       200
Retrieve Page Views       Failed requests           0
Retrieve Page Views       Median time per request   470ms
Retrieve Page Views       Average time per request  487ms
Retrieve Page Views       Sample standard deviation 95ms

Concurrency Level         4
Time taken for tests      24.8 seconds
Total requests            200
Successful requests       200
Failed requests           0
Requests per second       8.05 [#/sec]
Median time per request   470ms
Average time per request  487ms
Sample standard deviation 95ms
```

As you can see, the latency isn't perfect. Rocket is responding to these requests in 1-2ms according to my server logs, so cloud run is adding ~500ms of latency onto every request even after being warmed. This is a tradeoff that comes with using cloud run, and for applications that can't tolerate latencies like this other options may be better. However, it's important to note that the monetary cost of running this service is virtually zero. You could easily scale your application to thousands of users without ever even breaching the free tier threshold.

## Conclusion

Although there's a bit of legwork involved with getting Diesel set up and all of the supporting pieces (database schema and migrations, Dockerfile, etc.) in place, Cloud Run certainly presents a very compelling option for getting a web app from zero to deployed very quickly. When combined with a hosted database option, it allows full-fledged APIs and other extensive applications to be built without provisioning any virtual servers at all.

Rust is a great fit for cloud run as well because the blazingly fast web servers such as Rocket allow full advantage to be taken of the per-100-ms billing that cloud run uses, making it possible to deploy web applications at incredibly low price points.

Please feel free to leave questions and feedback on [Reddit](https://www.reddit.com/r/rust/comments/bgt267/deploying_a_rest_api_with_diesel_rocket_and_mysql/)!
