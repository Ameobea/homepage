---
title: 'Writing a Hashmap-to-Struct Procedural Macro in Rust'
date: '2017-01-13'
---

In one of my projects, I recently had the need to take a HashMap filled with settings and configuration options and use it to populate the fields of a struct. If a certain setting wasn't in the hashmap, then the default value for the struct was used.

My first approach was to write a manual switch statement checking for the presence of each of the struct's fields in the hashmap and, if it was there, convert it to the proper type and insert it into the struct. However, as my work progressed and I began to add more and more values to the struct, I soon ended up with a whole lot of code looking like this:

```rust
let settings = SimbrokerSettings::default();

for (k, v) in hm.iter() {
  match k {
    "starting_balance" => {
      settings.starting_balance = try!(parse_val(v));
    },
    "ping_ns" => {
      settings.ping_ns_balance = try!(parse_val(v));
    },
    ...
  }
}
```

The whole processes seemed really redundant; I was basically running the same code over and over with one small change. However, since it's impossible to dynamically index structs with a string, this was the only way I could make it work.

Then I read about Rust's new procedural macros. They provide a way to generate new code at compile-time, making it possible to do things like automatically derive the `Serialize` and `Deserialize` in [serde](https://serde.rs/). I decided to create a `FromHashmap` trait backed by a procedural macro which would allow me to automatically generate all of that repetitive code from above.

In order to create the macro, I made use of two very useful Rust crates: [syn](https://github.com/dtolnay/syn) and [quote](https://github.com/dtolnay/quote). Syn is a Rust code parser built on top of [nom](https://github.com/Geal/nom) which can generate an AST from a string of Rust source code. Quote provides a macro that makes it very easy to create strings of Rust code from within Rust. It's far better than just putting it inside double-quotes because the macro maintains editor syntax coloring as well as automatically interpolating variables from the rest of your code.

Here's what the `FromHashmap` trait looks like:

```rust
pub trait FromHashmap<T> : Default {
    fn from_hashmap(hm: HashMap<String, String>) -> T;
}
```

It requires that structs that implement it also implement the `std::default::Default` trait so that defaults can be used if the provided HashMap doesn't contain all the necessary values.

Since procedural macros must reside in their own special crate, I created a new one inside my crate's root directory (at the same level as src). The main function that is exported must have a `#[proc_macro_derive(_)]` directive which lets the compiler know that we're going to use this as a procedural macro. As input, it takes a `proc_macro::TokenStream` which contains the source of the struct on which the trait is being derived and returns another `proc_macro::TokenStream` containing the generated code.

To start out, we first parse the provided `TokenStream` into an AST using `syn`:

```rust
#[proc_macro_derive(FromHashmap)]
pub fn from_hashmap(input: TokenStream) -> TokenStream {
    let source = input.to_string();
    // Parse the string representation into a syntax tree
    let ast = syn::parse_macro_input(&source).unwrap();
```

The next step is to get get a list of all the fields of the provided struct. These are represented as _Idents_ and can be found deep within the AST. This code unpacks the AST, makes sure that what we're given is actually a standard, non-tuple struct, and puts all of the field names into a vector:

```rust
// create a vector containing the names of all fields on the struct
let idents: Vec<Ident> = match ast.body {
    syn::Body::Struct(vdata) => {
        match vdata {
            VariantData::Struct(fields) => {
                let mut idents = Vec::new();
                for ref field in fields.iter() {
                    match &field.ident {
                        &Some(ref ident) => idents.push(ident.clone()),
                        &None => panic!("Your struct is missing a field identity!"),
                    }
                }
                idents
            },
            VariantData::Tuple(_) | VariantData::Unit => {
                panic!("You can only derive this for normal structs!");
            },
        }
    },
    syn::Body::Enum(_) => panic!("You can only derive this on structs!"),
};
```

Then, a second vector is created which contains the names of the struct fields as Strings. This is done since interpolating an `Ident` with Quote doesn't include quotation marks which we need when doing lookups on the HashMap:

```rust
// contains quoted strings containing the struct fields in the same order as
// the vector of idents.
let mut keys = Vec::new();
for ident in idents.iter() {
    keys.push(String::from(ident.as_ref()));
}
```

Now we're ready to start doing the code generation. The name of the input struct is pulled out of the AST along with some data about generics and constraints. Then, it's as simple as using the `quote!{}` macro to generate a `TokenString` containing the `impl FromHashmap` code and a helper function to turn get the proper value out of the String in the HashMap:

```rust
let name = &ast.ident;
let (impl_generics, ty_generics, where_clause) = ast.generics.split_for_impl();

let tokens = quote! {
    /// Attempts to convert the given &str into a T, panicing if it's not successful
    fn parse_pair<T>(v: &str) -> T where T : ::std::str::FromStr {
        let res = v.parse::<T>();
        match res {
            Ok(val) => val,
            Err(_) => panic!(format!("Unable to convert given input into required type: {}", v)),
        }
    }

    impl #impl_generics FromHashmap<#name> for #name #ty_generics #where_clause {
        fn from_hashmap(mut hm: ::std::collections::HashMap<String, String>) -> #name {
            // start with the default implementation
            let mut settings = #name::default();
            #(
                match hm.entry(String::from(#keys)) {
                    ::std::collections::hash_map::Entry::Occupied(occ_ent) => {
                        // set the corresponding struct field to the value in
                        // the corresponding hashmap if it contains it
                        settings.#idents = parse_pair(occ_ent.get().as_str());
                    },
                    ::std::collections::hash_map::Entry::Vacant(_) => (),
                }
            )*

            // return the modified struct
            settings
        }
    }
};

tokens.parse().unwrap()
```

Most of this code is pretty simple; the complicated bit is with in `#()` block. Quote treats the `#()` block much like Rust's standard macros treat `$()`: they use it to repeat code. It took me a while to understand how that repetition operator worked (it's quite different from traditional loops and iterators), but one of the tests in the Quote library really helped me understand it:

```rust
#[test]
fn test_fancy_repetition() {
    let foo = vec!["a", "b"];
    let bar = vec![true, false];

    let tokens = quote! {
        #(#foo: #bar),*
    };

    let expected = r#""a" : true , "b" : false"#;
    assert_eq!(expected, tokens.as_str());
}
```

For each of the elements of the vectors interpolated inside the repetition block, the entire inner part of the repetition block is inserted into the code. In the test, the `,*` at the end tells Quote to insert a comma as a separator, very similar to `.join()`.

So now we have code that parses the input struct into an AST, pulls out all the field names, and generates code to automatically assign values to it from the fields of the input HashMap. The full macro crate looks like this:

```rust
#![recursion_limit = "128"]

extern crate proc_macro;
extern crate syn;
#[macro_use]
extern crate quote;

use proc_macro::TokenStream;
use syn::{Ident, VariantData};

#[proc_macro_derive(FromHashmap)]
pub fn from_hashmap(input: TokenStream) -> TokenStream {
    let source = input.to_string();
    // Parse the string representation into a syntax tree
    let ast = syn::parse_macro_input(&source).unwrap();

    // create a vector containing the names of all fields on the struct
    let idents: Vec<Ident> = match ast.body {
        syn::Body::Struct(vdata) => {
            match vdata {
                VariantData::Struct(fields) => {
                    let mut idents = Vec::new();
                    for ref field in fields.iter() {
                        match &field.ident {
                            &Some(ref ident) => idents.push(ident.clone()),
                            &None => panic!("Your struct is missing a field identity!"),
                        }
                    }
                    idents
                },
                VariantData::Tuple(_) | VariantData::Unit => {
                    panic!("You can only derive this for normal structs!");
                },
            }
        },
        syn::Body::Enum(_) => panic!("You can only derive this on structs!"),
    };

    // contains quoted strings containing the struct fields in the same order as
    // the vector of idents.
    let mut keys = Vec::new();
    for ident in idents.iter() {
        keys.push(String::from(ident.as_ref()));
    }

    let name = &ast.ident;
    let (impl_generics, ty_generics, where_clause) = ast.generics.split_for_impl();

    let tokens = quote! {
        /// Attempts to convert the given &str into a T, panicing if it's not successful
        fn parse_pair<T>(v: &str) -> T where T : ::std::str::FromStr {
            let res = v.parse::<T>();
            match res {
                Ok(val) => val,
                Err(_) => panic!(format!("Unable to convert given input into required type: {}", v)),
            }
        }

        impl #impl_generics FromHashmap<#name> for #name #ty_generics #where_clause {
            fn from_hashmap(mut hm: ::std::collections::HashMap<String, String>) -> #name {
                // start with the default implementation
                let mut settings = #name::default();
                #(
                    match hm.entry(String::from(#keys)) {
                        ::std::collections::hash_map::Entry::Occupied(occ_ent) => {
                            // set the corresponding struct field to the value in
                            // the corresponding hashmap if it contains it
                            settings.#idents = parse_pair(occ_ent.get().as_str());
                        },
                        ::std::collections::hash_map::Entry::Vacant(_) => (),
                    }
                )*

                // return the modified struct
                settings
            }
        }
    };

    tokens.parse().unwrap()
}
```

Note the `#![recursion_limit = "128"]` directive at the top of the file. This is required in order to allow Quote to do the amount of recursive lookups and interpolations necessary to generate the output `TokenStream`; you can make this as large as you need to in order for your code to compile.

Back in the original code, using the procedural macro is as simple as adding a `from_hashmap = { path = "from_hashmap" }` line to the crate's Cargo.toml, importing it with

```rust
#[macro_use]
extern crate from_hashmap;
```

and adding a `#[derive(FromHashmap)]` to the struct's declaration.

To check out the generated code, give rustc the arguments `-Z unstable-options --pretty=expanded`. This will expand all the macros in the source and output it to the console. Running `cargo rustc -- -Z unstable-options --pretty=expanded > expanded.rs` This yields a file with over 12,000 lines of code (from my crate of 1.2 source lines). Searching through it, this code was generated:

```rust
...

impl FromHashmap<SimBrokerSettings> for SimBrokerSettings {
    fn from_hashmap(mut hm:
                        ::std::collections::HashMap<String, String>)
     -> SimBrokerSettings {
        let mut settings = SimBrokerSettings::default();
        match hm.entry(String::from("starting_balance")) {
            ::std::collections::hash_map::Entry::Occupied(occ_ent) =>
            {
                settings.starting_balance =
                    parse_pair(occ_ent.get().as_str());
            }
            ::std::collections::hash_map::Entry::Vacant(_) => (),
        }
        match hm.entry(String::from("ping_ns")) {
            ::std::collections::hash_map::Entry::Occupied(occ_ent) =>
            {
                settings.ping_ns = parse_pair(occ_ent.get().as_str());
            }
            ::std::collections::hash_map::Entry::Vacant(_) => (),
        }
        match hm.entry(String::from("execution_delay_us")) {
            ::std::collections::hash_map::Entry::Occupied(occ_ent) =>
            {
                settings.execution_delay_us =
                    parse_pair(occ_ent.get().as_str());
            }
            ::std::collections::hash_map::Entry::Vacant(_) => (),
        }

        ...

        settings
    }
}
```

Looks great! The entire block went on for over 70 lines including the parser function, all of which was automatically generated and kept out of my working codebase! The final step is to write a function to test it:

```rust
#[test]
fn simbroker_settings_hashmap_population() {
    let mut hm = HashMap::new();
    hm.insert(String::from("ping_ns"), String::from("2000"));
    let settings = SimBrokerSettings::from_hashmap(hm);
    assert_eq!(settings.ping_ns, 2000);
}
```

This creates a HashMap with one entry, and creates a new `SimbrokerSettings` struct from it. The test passes, everyone's happy, and we learned something new :)
