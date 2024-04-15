+++
title = "Investigating Bogus Plausible Analytics Traffic"
date = "2024-03-20T10:42:24-07:00"
+++

I run self-hosted [Plausible analytics](https://plausible.io/) to keep track of how many people are visiting my various websites and web apps. I'm largely very happy with it - it gives me all of the info I need with only a miniscule JS payload, no cookies or other invasive tracking, and full control over the data.

However, recently I've been running into an issue with fake/bogus traffic getting submitted for my personal homepage. Usually, I'm more than happy to see a bump in traffic to one of my sites, but something was off about it this time.

First, all of this traffic seemed to be limited to the homepage of my site. Traffic spikes usually correspond to some blog post I've written getting posted to Reddit or similar, so having everything limited to just the homepage was quite strange.

Next, all of the traffic had no set referrer/source. This is strange for the same reason: usually people are coming to my sites from somewhere else rather than just typing in the URL manually.

I've seen some spam analytics events in the past with their referrer header set to spam domains. The intention seemed to be to advertise to me in my analytics dashboard or something along those lines. That's not the case here, though.

When filtering my site's traffic to only include events that match that criteria, it's clear to see when this started happening in early March:

![A screenshot of my Plausible analytics web UI showing traffic for my homepage website.  It's filtered to show only traffic to the root of the website (path of "/").  It shows a large increase in traffic to this page starting around March 6 with daily hits going from less than 20 to over 100 on multiple days.  It also shows that the top source for this traffic is "Direct / None".](https://i.ameo.link/byk.png)

This was a very strange pattern that I hadn't seen before, so I dug in deeper.

Since I host my homepage myself, I have direct access to the raw server logs for the NGINX webserver that serves it. Plausible submits all of its events to a single URL (`/api/event`), so it was pretty easy to filter down the logs to find the Plausible requests.

Since there were so many of these events coming in to the point where it was a large portion of my site's total traffic, it was pretty easy to match the requests on the server to the traffic displayed in the Plausible UI. I identified several of these no-referrer homepage requests and quickly identified some other interesting patterns with those requests:

- They were all coming from different IP addresses.

This does make sense since Plausible suggested a wide spread of different countries that these requests were originating from. However, this is pretty surprising if this is automated traffic; it would require the perpetrator to have control over dozens-hundreds of unique IPs.

- They all had similar user agents.

Here's a random sampling of some of the user agents that I saw from these requests:

```
Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.1392.1086 Mobile Safari/537.36
Mozilla/5.0 (Linux; Android 8.0; Pixel 2 Build/OPD3.170816.012) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.1010.1725 Mobile Safari/537.36
Mozilla/5.0 (Linux; Android 8.0; Pixel 2 Build/OPD3.170816.012) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.5871.1821 Mobile Safari/537.36
Mozilla/5.0 (Linux; Android 8.0; Pixel 2 Build/OPD3.170816.012) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.4338.1594 Mobile Safari/537.36
Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2734.1416 Mobile Safari/537.36
```

There are some clear similarities between them, but also some randomized parts as well. This makes it clear that whatever is sending these events is at the minimum more sophisticated than some simple script.

I searched my server logs for the string `Mobile Safari/537.36`. There were a lot of results there other than the plausible requests. Although there were some that looked like legitimate user-originating traffic, it looked like the majority of these requests were coming from bots like `Googlebot` or `PetalBot`.

Although `Mobile Safari/537.36` seems to be something that can come up in real user traffic, it also seems to be a very common thing to include in bot/scraper user agents. This lends even more credence to the idea that these events are fake and don't represent real user traffic.

- All of the IPs I checked originate from residential/non-datacenter sources

I ran a collection of the IP addresses sending these requests through the [Maxmind GeoIP service](https://www.maxmind.com/en/geoip-demo), and here are the results:

![A screenshot of geo-IP search results for a subset of IPs submitting bogus events to my Plausible analytics.  It shows that the IPs trace back to a variety of locations across Europe and the rest of the world, a variety of different internet providers, and have connection types of "Cable/DSL" and "Corporate"](https://i.ameo.link/byj.png)

As far as I can tell, these look like legitimate residential IPs that could belong to real users. I would have guessed that they would have belonged to public clouds or datacenters given the apparent automated source of the traffic, so this was pretty surprising to me.

I know that there are available residential IP proxies that people use for scraping and similar use cases. It's also possible that this traffic is coming from devices compromised by a virus or malicious browser extension. Both of these seem pretty extreme and unlikely to me, though, for something such at this.

I did some basic googling of some of these IPs looking for entries in abuse blocklists or similar, but nothing came up. They looked entirely like real user IPs in every way I could see.

- All of the IPs I checked only make requests to the Plausible event submission URL (`/api/event`) without making _any_ other requests to my webserver

This was the smoking gun for me that indicated that this traffic was almost certainly not real. When I searched through the server logs, there would always be a single request from that IP. They didn't even download the `plausible.js` script that is used to kick off these requests!

I checked multiple IP addresses and this was the case for all of them. I double-checked the logs of the CDN I use for some of the static assets on my site (it's not used for the `index.html` nor the `plausible.js` script though) and there was no trace of those IPs there either.

It's probably technically possible that these requests came from users that had my entire homepage cached from like a week ago, but that's extremely unlikely and doesn't seem remotely realistic.

The most likely explanation for these requests I can think of is intentionally submitted artificial traffic from a relatively sophisticated source.

## Conclusion

So to summarize:

- I'm seeing a lot of fake traffic getting submitted to my Plausible analytics for one of my websites
- All of the requests are to the homepage, bounce immediately, and have no referrer/source listed
- The requests all come from unique residential-looking IPs
- The requests all have similar but randomized user agents
- There's no other requests or traffic to other pages or content from any of these IPs whatsoever; they all just hit the Plausible event submission endpoint a single time each

Very strange indeed! This leaves the one big question remaining: Why?

I have no idea! This is my personal website that I mainly use as a portfolio and blog. I have no ads on the site at all, don't sell anything on it, and have no paywalls or login system of any kind. It's all static content, and the site itself is [open source](https://github.com/ameobea/homepage).

If someone out there is trying to inflate my ego by making it look like hundreds of people are coming every day to stare at my homepage before leaving, I appreciate the thought! But now that I'm almost positive it's fake, it's much more annoying than anything else; I'd prefer to have an accurate as possible view of real traffic on my sites.

Given how little of a reason for this traffic I can see, I still feel like there's probably some explanation for this other than someone setting it up intentionally to give my website fake hits. Someone hotlinking or duping my site maybe, or perhaps some web cache or internet archive-like site acting in a weird way? Some kind of ad fraud bot that got lost or mis-targeted?

In any case, I'm thoroughly intrigued and would love to know the truth. In my experience, these kinds of mysterious web traffic events tend to clear up on their own after a while, so I wouldn't be surprised if this fake traffic just vanishes in a few days or weeks.

If anyone has seen something similar or has any ideas, I'd be very curious to hear!
