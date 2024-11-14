+++
title = "Notes on Self Hosting a Bluesky PDS Alongside Other Services"
date = "2024-11-13T19:03:37-08:00"
+++

I've recently set up a Bluesky Personal Data Server (PDS) to store the data for my Bluesky account. I wanted to host it on my server alongside the many other web apps, databases, and many other services. I additionally wanted to use my top-level domain as my handle.

I started out following the install guide on the official [PDS repo](https://github.com/bluesky-social/pds) and it initially started out pretty well. However, I pretty quickly ran into some issues where the default config didn't work for me.

I eventually managed to solve all of the issues and get it running smoothly, and I figured I'd record my experience here for anyone else struggling with similar problems.

## Manual Container Management

As I mentioned previously, I started out by running the default `installer.sh` script which worked most of the way, but some of the Docker containers it spawned failed to start. Additionally, when I tried to set up an account through that script after the main services were initialized, I got 400/500 server errors and it failed.

The default install script for the PDS (as of November 2024 anyway) sets up the following services launched as Docker containers managed by docker-compose:

- The PDS itself
- A Caddy reverse proxy
- `containrrr/watchtower` which seems to facilitate zero-downtime upgrades

It has code to auto-install Docker and some other packages, pull images, and launch containers. The `compose.yml` file that it uses can be found here: <https://github.com/bluesky-social/pds/blob/main/compose.yaml>

For my server, I already had a NGINX reverse proxy set up which I use as the front door for all my services. The default setup that `installer.sh` uses launches the Caddy container on the host network and has it try to listen on port 80/443, so that conflicted with NGINX and caused Caddy to fail to start.

To work around these issues, I tore down and deleted all of the auto-launched containers and created a custom `compose.yml` file that skips the Caddy reverse proxy and watchtower containers entirely, only launching the PDS. It also sets up the PDS to expose itself on a different port than 3000 since I was already using that for a different service.

Here's what my `compose.yml` file looks like:

```yml
version: '3.9'
services:
  pds:
    container_name: pds
    image: ghcr.io/bluesky-social/pds:0.4
    restart: unless-stopped
    volumes:
      - type: bind
        source: /opt/pds
        target: /pds
    ports:
      - '6010:3000'
    env_file:
      - /opt/pds/pds.env
```

One other thing to note is that by default, the install script creates the data directory on the host at `/pds`. This is where all of the state for your PDS lives (and is probably a good thing to set up automated backups for).

I moved it to `/opt/pds` to fit better with the rest of my server setup and updated the volume mount to match, but you can skip that if you prefer.

**NOTE**: If you do change the location of this directory, _do not_ update the paths in your `pds.env` file accordingly. These paths are read from inside the container where it is mapped to `/pds` no matter where the directory is located on the host, so leave it as is.

I put the `compose.yml` file in a `bsky` directory and can launch it by running `docker compose up -d`.

## NGINX Reverse Proxy

Once I had the manual `compose.yml` file set up, I had the PDS container up and healthy and exposed on port 6010. Now, I needed to configure my NGINX reverse proxy to expose that to the internet.

One caveat was that I had other things available on the domain I wanted to use (ameo.dev) and couldn't just let the PDS take over the whole domain - which is the behavior that the install script expects.

I did some research and discovered that luckily, the PDS only needs to control a few paths - so I could leave all my other sites + services on the domain intact and just map a few paths through.

The paths that it needs are:

- `/xrpc/`: This is the main path under which all of the APIs/RPCs that the PDS exposes are available
- `/.well-known/atproto-did`: This is used to verify domain ownership in addition to DNS methods
  - Note: You may not need this if you use DNS to verify your domain ownership. However, I was having issues with verifying my domain/handle and set up both methods.

Here's the NGINX config I ended up with to expose these two paths and route them through to the PDS:

```txt
server {
    server_name ameo.dev www.ameo.dev;

    # ... rest of your server config ...

    location /xrpc {
        proxy_pass http://localhost:6010;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header Host            $host;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
    }

    location /.well-known/atproto-did {
        proxy_pass http://localhost:6010/.well-known/atproto-did;
        proxy_set_header Host            $host;
    }

    # ...
}
```

It's pretty straightforward, but there are a few pieces that are important.

For the `well-known/atproto-did` path, the `Host` header _needs_ to be forwarded through in order for it to work. The handler for that path in the PDS looks at the `Host` header to figure out which DID to return, so if it's not set the path will return an error/not found response.

I also added this line to my `pds.env` file to try to make the `/.well-known/atproto-did` route work:

```sh
PDS_SERVICE_HANDLE_DOMAINS=.ameo.dev
```

(replace with your domain of course)

I'm not sure if this was actually necessary, but if you are still having issues with that route even after forwarding the Host header correctly then maybe give it a try.

Additionally, the `Upgrade` and `Connection` headers _need_ to be set in order for the PDS to function. These support websocket proxying - and you might need to set some other config in your reverse proxy in order to get websocket proxying to work.

I initially figured that it was a similar situation to Mastodon and the websocket functionality was optional and only used for things like realtime notifications and live feeds.

**However, I learned that having a working websocket feed to your PDS is 100% necessary in order for it to work correctly and interface with the rest of the Bluesky network**.

To make sure this was working, I used an [online websocket tester](https://piehost.com/websocket-tester) and put this URL in (modify to your domain if you use it): `wss://ameo.dev/xrpc/com.atproto.sync.subscribeRepos?cursor=0`

If your proxy is set up correctly, it should report that the connection is successfully established when you test it.

## Issues with Top-Level Domain Handles

Once I had everything up and running and proxied out to the public internet, I was able to set up an account using the `pdsadmin` command on the server - mostly following the official docs in the PDS repo's guide.

I made it as far as logging in through the main bsky.app Web UI and saw that requests were successfully going to and getting answered by my PDS on my custom domain. However, there were issues with my account that quickly became apparent.

On my profile page, my handle was showing up as "Invalid Handle ⚠`. I had already performed the steps to set up my domain's DNS to verify the domain, but it didn't seem to be working. I tried changing my handle between my main domain and subdomain to no avail.

For me, the cause turned out to be that I didn't have the websocket proxying working properly. As I mentioned in the previous section, a working websocket connections is necessary for a PDS to work. Once I set that up, I ran this command on my server to trigger the network to re-scrape my PDS:

`pdsadmin request-crawl bsky.network`

Once I did all that, my "Invalid Handle" issue went away after less than a minute and my handle was successfully set to `ameo.dev` - just what I wanted.

### Other Debugging Resources

While trying to figure out this issue, I came across some resources that might be useful to you if you're having similar issues verifying your handle or domain.

The first is an official debugging app to help check your domain verification and handle status:

<https://bsky-debug.app/>

The second is a semi-official Discord server with a community of people to help debug issues with self-hosted Bluesky PDSes:

<https://discord.gg/NDATMNx2>

I didn't end up chatting there myself, but there seems to be a pretty active group who are eager to help out fellow PDS admins with their issues.

## Top-Level Domain Handle Issues

One other thing to note is that **it seems to currently be impossible to start off with a top-level domain as your handle for the initial account created on a self-hosted PDS**.

As I understand it, it's just a limitation of the current setup and not something inherent with the AT Protocol or Bluesky.

To work around this, I started off by using a subdomain as a handle (I used casey.ameo.dev) and then later switching it to my top-level domain (ameo.dev) via the settings in the main bsky.app web UI. Once I got my websocket proxying and DNS set up, it worked just fine.

## SMTP Server

One last thing to note is that I needed to set up a custom SMTP server to make email verification work. To be honest, I'm not 100% sure if email verification is even required or not since this is a self-hosted PDS and I'm the only user. However, I did end up setting it up to make the message in the UI go away if nothing else.

I initially tried setting up a free account through [Resend](https://resend.com/) as suggested in the official PDS repo docs. However, I already have MX records set for my domain since I used it for my own email, so I didn't want to mess with them in order to verify my domain through Resend.

For my specific case, I manage email for my domain through Google Workspace. Because of this, I was able to use Google's SMTP relay to send emails and it worked fine.

I added these lines to my `pds.env` file to make that happen:

```sh
PDS_EMAIL_SMTP_URL=smtp://smtp-relay.gmail.com/
PDS_EMAIL_FROM_ADDRESS=casey@ameo.dev
```

Once that was set, my verification email was delivered successfully and I was able to verify it.

## Conclusion

That's all I have to note. It was a bit tricky but now that I've figured it all out, my PDS has been running smoothly for over a day and I'm interacting with Bluesky completely normally.

I hope this writeup helps save you some effort if you're having these or similar issues yourself!

Feel free to tag or message me on Bluesky (@ameo.dev) if you have any questions as well :)
