---
title: "Tunnelto Woes"
date: 2023-06-02T16:15:46-07:00
---

There's a service <https://tunnelto.dev/> which I've used in the past.  It's an [ngrok](https://ngrok.com/) alternative for exposing local services publically for things like demos, testing, etc.

I heard about tunnelto.dev when it was announced [on hackernews](https://news.ycombinator.com/item?id=23618456) and gave it a try along with several others on my team at [Osmos](https://osmos.io).  It looked fresh, was written Rust, and was at least partially [open source](https://github.com/agrinman/tunnelto) - all great.  I even signed up for the (very cheap) paid plan which gives custom subdomains and some other stuff.

## Issues

I really wanted to like this service and use it, but it's been a source of constant issues.  It's a highly unreliable service as far as I can tell, and that hasn't really improved over the past ~3 years we've been using it.  I kind of feel bad writing this, but I think it's important to say at this point:

> If you're having issues with tunnelto.dev (incredibly slow responses, networking issues, weird jank, etc.) it's probably not you, and tunnelto (or one of tunnelto's hosts) is to blame.

I've emailed the dev behind tunnelto multiple times in the past when I was encountering issues with their service.  I did get a response, saying that they were related to an upstream provider issue.

I know that tunnelto.dev is deployed on [fly.io](https://fly.io/), and fly.io has been experiencing some [bad growing pains](https://community.fly.io/t/reliability-its-not-great/11253) and having a lot of difficulty scaling their service.  I think there's a very good chance a lot of the issues tunnelto is experiencing can be attributed to fly.io, but I have no way of being sure.

Anyway, the point of this post wasn't to flame tunnelto or fly.io or anything, but more to put some written record that these issues with tunnelto do exist for anyone else that might be running into them.

---

I've not used tunnelto myself in over a year, and with this latest round of issues I've been helping my coworkers debug I think they're all going to be switching off as well.

As an alternative, I'm self-hosting an instance of [frp] on my personal VPS and using that for all my tunneling needs.  It's pretty simple to set up, but definitely more work than an off-the-shelf solution like ngrok or tunnelto.

Maybe I'll write something up about my setup for that in the future.
