+++
title = "Investigating Fidget Spinner Bot"
date = "2023-11-06T11:50:37-08:00"
+++

While watching some logs for my webserver recently, I've noticed a significant amount of requests coming from a bot I didn't recognize with the user agent of `fidget-spinner-bot`. It seems to be pretty aggressively crawling my personal network of sites that I maintain, following links and downloading page contents. There's also a bot with user agent `my-tiny-bot` which seems to be related. I usually recognize most of the user agents of bots making significant amounts of requests to my server, so these stood out to me.

I first noticed this bot around the beginning of November 2023, but it's possible it started earlier than that. I looked around online to see if other people were noticing traffic from this bot, and there are a few discussions but not many. There's a [forum thread](https://www.webmasterworld.com/search_engine_spiders/5096715.htm) on a webmaster forum where people were noticing traffic from these bots as well, but that's pretty much all I could find.

As mentioned on that thread, these bots are both hosted on AWS IP space. Requests are spread out over multiple IP addresses which would indicate that there are multiple coordinated instances of these bots doing this crawling rather than just some little project someone set up on a VPS.

They don't seem to be doing anything that seems malicious as far as I can tell. Their request counts are high but very much reasonable - at least for my server. They only seem to be requesting the HTML body of pages and not downloading any CSS, images, scripts, etc. There was some speculation on that webmasterworld thread that they might gathering training data for AI, but most people just go with commoncrawl for that rather than doing the collection themselves.

These bots follow 301 redirects and seem to spider links pretty naively. I have some densely linked doc pages for a browser-based synthesizer I built with a lot of densely inter-linked pages, and it's spending a lot of time crawling those pages in circles. I'm not 100% sure it's re-crawling the same pages, but it does seem to be.

All of its requests are made via HTTP 1.1. Individual requests are spaced 30 seconds to 2 minutes apart from what I can see, and that's across all of my different domains. It's made requests to at least 3 of my domains so far which makes sense since many of them are linked to from this website.

Anyway, it's an interesting bot and I'd be very curious to know what it's doing, who runs it, etc. If someone knows, feel free to [get in contact](https://cprimozic.net/contact/) and I'll update this page with anything people find out.
