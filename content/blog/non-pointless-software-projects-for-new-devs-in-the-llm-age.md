---
title: 'Non-Pointless Software Projects for New Devs in the LLM Age'
date: '2025-05-26'
---

I, like many other devs, learned most of my coding by building projects.  I've never been one to read textbooks or tutorials through chapter by chapter - I prefer to start something and then look stuff up along the way and trial-and-error my way to the end.

Building a portfolio of projects to show off your skills is still highly recommended to college-age devs trying to land their first job, judging by the posts on subreddits like /r/csMajors that show up on my Reddit homepage.

<div class="note padded">The issue is that it's often really hard to find an idea for a project to work on that feels worth doing.</div>

I've heard this multiple times from friends learning software development, seen it echoed online, and experienced it myself.  It's easy to look up "software project ideas" online or ask ChatGPT to recommend something, but the many of those suggestions just seem so _pointless_.

Sure, building a snake game clone or writing your own tiny scripting language interpreter can be very educational and worthwhile.  But at the end of the project, the code's going to sit on Github and never get run by anyone again.  If you're lucky, some recruiter or dev assigned to be your interviewer will glance through the readme.

It's always been hard for me to find motivation to work on projects like that.  They felt like homework assignments without even the benefit of getting a good grade at the end if it turns out well.

In the age of AI coding, it's even worse.  Even if you don't use any LLM assistance, the knowledge that some LLM could generate the whole thing given a 50-word prompt is very demoralizing to say the least.

## Non-Pointless Projects

I'll get straight to my point.

<div class="good padded">My solution for making projects feel like they matter is to build stuff that you use yourself</div>

I've been programming and building software for over 10 years now.  Over that time, I've built many projects that I still use frequently.  The fact that they're real, living applications that actually serve a purpose automatically elevates them to be more meaningful that some artificial coding challenge.

Here are some of the things I've built over the years and use to this day:

### Screenshot Hosting + Sharing App

One of the earliest projects I built was a webserver that I could upload screenshots to.  If you spend a lot of time online like me, then you probably post a lot of screenshots to apps like Discord or Slack.  For me at least, I still find it really cool to be able to post a link to a domain that's my username with a super-short URL.

You can make this as simple or complicated as you want.  Pretty much any tech stack in the world works for this.  You could do serverless, host it for free or virtually free, or drop it on a small VPS that you use as a base for all your other projects.  If you're in college, you can get the [Github Student Developer Pack](https://education.github.com/pack) which comes with enough Digital Ocean credits to host a decent little VPS completely free.

If you use Windows, you can use the excellent [ShareX](https://getsharex.com/) desktop app to capture and upload screenshots with custom keyboard shortcuts.  I use Linux now which isn't supported, but back when I used ShareX I had multiple sets of shortcuts set up for different use cases.  One would upload a public image, one would be for one-time images that auto-delete after being viewed, one supported images that expired in a week, etc.

<div class="note">The other part of this which I only realized the value of later was the fact that I had a persistent, centralized collection of screenshots from all my computers going back years.</div>

I built a little management web UI and can go back and scan through screenshots I took in the past.  The amount of memories and casual moments which would have been otherwise lost + forgotten is stunning.  I saw a blog post shared on Hacker News a couple of years ago titled [You should take more screenshots](
https://alexwlchan.net/2022/screenshots/) which makes similar points to this and resonated with me deeply.

Anyway yeah I'm extremely glad I built this project, and it's one of the first things I'll recommend to people learning any kind of full stack or webdev stuff.

<div class="warn padded">If you do end up building this, make sure you set up some kind of backups!</div>

#### Screenshot Project Extensions + Additional Features

The core of this project really is quite simple.  You could implement it with an NodeJS Express webserver in like 100 lines of code.

But there's a lot of cool stuff you can do with an app like this once you have it built and actually deployed somewhere.  Especially if you choose to v*becode it, there are a ton of bells and whistles you can add on:

 * Add in pastebin support.  Mine has syntax highlighting and markdown to HTML rendering similar to Github Gist.
 * Build a command line app for uploading arbitrary files.  I use this all the time for sharing files with friends and similar
 * Integrate with a CDN for hosting the uploaded files.  This allows me to use my uploaded files as assets in my other projects + websites
 * Build a user account and auth system if you want to let your friends use it (assuming you're comfortable with those friends uploading arbitrary content and sharing links to it under a domain with your name on it).

If you're ambitious, you could even try building your own client-side screenshot app as well.  For me it was too hard to give up all the features that come with ShareX and alternatives, though.

### Reminder Email CLI

This one is as simple as it sounds: Just a little command line app that sends me an email reminder after a specified amount of time.  This is simple enough that it would be one of the first coding projects built by someone learning how to program.

For me, email is always something I'll check.  A Google Calendar reminder that I accidentally dismiss on my phone is less reliable (for me at least) than a tiny text email that sits in my inbox until I delete it.  That being said, you can definitely have it hook in to Google or any other service that has an API and do it that way if you'd prefer.

There are equally few restrictions on languages/technologies/deployment options for this one as the screenshot hoster.  Many email delivery providers offer generous always-free tiers (I use [Mailgun](https://www.mailgun.com/) personally) and have easy APIs to integrate with.  You can use an application-level scheduler if you're hosting on an always-on environment like a VPS, or a hosted solution like [Cloudflare Worker Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/).

I'm also a pretty sentimental person and will send myself reminders years in the future with a little note about when I sent it and what was going on.

### Discord Bot

Building a Discord Bot is already a very popular project for people learning software, and I think it's an extremely good one.  The options are virtually limitless and there's a ton of room to build something unique for you or your friend group.

There are great, well-documented Discord API wrapper libraries out there to build with and a huge selection of tutorials and guides to follow if you need help.  Deploying it can be very simple too. You can even run the bot directly off your PC if you want; there's no publicly accessible IP or domain required.

If you have no ideas for what your bot should do, try making a bot that lets users in a server set up custom commands with simple text responses.  It's great to be able to register commands to post images referencing some in-joke or meme-du-jour.  Another fun one is to have the bot store links to all media posted in the server and then add a command to have it post a random one.

One other idea is to add a `remind` command that people can use to get pinged in a specified amount of time (same idea as the reminder email CLI).  My friends use this all the time.

If you think about it, you'll almost surely come up with some kind of use case to add to the bot for your particular server or community.  It's also a great project to collaborate with others on since the bot can be a sort of community resource.

### Hosting a Game Server/Message Board/etc.

Even though it doesn't involve writing code or building software, it's still very worthwhile to host stuff for you and your friends to use.

There are all kinds of options with varying levels of complexity and requirements.  Many of them (like MineCraft servers) can be run directly on your PC, no server or domain required.

Before I got into programming, I was hosting MineCraft servers for my friends.  It starts with "download the .jar and double click" but quickly becomes port forwarding, downloading a _real_ text editor to edit config files, learning yaml syntax, googling Java errors, reading Github issue threads to figure out version incompatibilities...  Sounds a lot like coding, doesn't it?

<div class="good padded">The act of running and maintaining a software service is very valuable in and of itself and is an excellent way to get into software if you have no programming experience</div>

Even if you're not looking to learn about devops or Linux or anything in that vein, you'll gain so much experience about **actually building and maintaining software in the real world**.  I feel like you'll learn pretty quickly whether or not it's something you care about and have interest in doing in the future.

### Self-Hosted Web Analytics

This one is a good option if you're looking for something a bit more involved.  A lot of of my early projects revolved around some kind of data collection and charting, so this was a natural fit for me.  It's also a great add-on project if you already have existing websites or projects that you're hosting.

It used to be that everyone just used Google Analytics for tracking how many people visited their websites.  I did too until I realized that >50% of my visitors weren't showing up because ad blockers all block Google Analytics as well.  With the increasing privacy-consciousness of internet users and cookie laws, there's been a boom of light-weight analytics apps like [Plausible](https://plausible.io) (Ad blockers also like to block anything with "plausible" in the URL, by the way).

When it comes down to it, there's really not _that_ much involved in building a minimal version of something like this.  Some of the fancier features like bot detection or IP Geolocation might be out of reach, but with the amount of headless browsers and spoofing out there these days it probably doesn't matter.

What you build could be as simple as a visit counter similar to [FlagCounter](https://flagcounter.com/) that a lot of people use on userpages:

![An example image generated by FlagCounter showing the number of visitors from different countries that visit a webpage.  It shows that there have been 93 visitors from the United States.](./images/project-ideas/flag-counter.png)

There's a lot of possibilities on the frontend side here too, if that's something that interests you.  All kinds of neat charts and visualizations are possible.

## Webdev Slant

One thing I wanted to note is that there's a pretty heavy webdev slant to everything in this list.  The reason is that when I was picking stuff to work on myself early on, I realized something:

<div class="note padded">If you want to build software that people can actually try out and use themselves, a web app is by far the best option.</div>

Of course mobile apps and client-side native apps exist, but the barrier between that code getting written and it running on someone else's device is so much higher.  I was initially drawn to full-stack webdev because of this, and it's the reason that the focus of my work and projects remains rooted in the Internet and the browser.

For a self-taught dev, I still think that some kind of webdev is the best option for getting started.  Once you learn the basics and try out some projects, you can easily switch into some other specialization or subdomain if you want without having wasted any effort.

## Conclusion + Philosophical Thoughts

I, and I'm sure many others as well, have been grappling with the more "philosophical" aspects of programming and software dev now that LLMs and AI-empowered coding are mainstream.

I distinctly remember feeling uncomfortable and rather unhappy the first time I was forced to use a code auto-formatter at work.  I had previously derived satisfaction from formatting my code well, and I felt like I had sort of established a distinct "style" in the way I structured it.  It felt like the auto-formatter was taking away from the craftsmanship of what I was doing and removing some of the, dare I say, creative expression that was possible before.

Perhaps unsurprisingly, I was over that feeling within a few weeks.  From there, I was figuring out ways in which I could use the autoformatter to speed up my work and make things easier.

That being said, I do still feel like AI is a whole different ball game entirely.  Depending on how strong you're vibing, AI-assisted software development can get to the point where it doesn't really resemble "coding" at all.

The value of code itself has been trending towards zero for some time now, as many other articles and blog posts have catalogued.  Although it's depressing to hear that as someone who has derived a lot of their value through building things with code, that's a fair take; it's hard to give much value to anything that can be created out of thin air for free in 20 seconds.

Anyway, all of that is mainly background for the theme I've been trying to drive at throughout this post:

<div class="note padded">Try to aim for building things that you can actually use and deploy/host the things you build.</div>
