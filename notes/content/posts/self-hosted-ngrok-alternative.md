+++
title = "My Self-Hosted Ngrok Alternative"
date = "2023-06-03T15:03:59-07:00"
+++

I often need to expose some service running locally on my computer to the public internet for some reason or another.  Demoing a website, exposing an API, giving someone access to download some local files, stuff like that.

The popular solution for this is tools like [ngrok](https://ngrok.com).  You download their CLI application to your computer, specify a port, and your local service is available at a URL like `https://a78f837.ngrok.io/`.

The downside of this is that there are limits for the free versions of these services.  You'll get limits on session duration, get a random subdomain every time, have network speed limits, or other stuff.  You can pay for them as well to make most of these limits go away, of course, and that's what I used to do with an alternative service called <tunnelto.dev>.

However, I ended up encountering [many problems](https://cprimozic.net/notes/posts/tunnelto-woes/) with the quality of their service, and I ended up giving up on that as well.

## Self-Hosted Alternative

Since the core concept of these services seems so simple, I figured it wouldn't be too hard to self host my own.

My setup uses a tool called [`frp`](https://github.com/fatedier/frp).  `frp` described as:

> A fast reverse proxy to help you expose a local server behind a NAT or firewall to the internet.

Exactly what I was looking for.

### Server Configuration

Setting it up turned out to be pretty simple.  I have a dedicated server on which I host [all my websites and services](https://cprimozic.net/blog/my-selfhosted-websites-architecture/), and I set up an instance of frpc there via Docker:

```sh
docker run -d --name frps \
  --restart=always \
  -p 5100:7000 \
  -p 5101:7500 \
  -p 5102:6000 \
  -p 5103:9888 \
  -v /opt/conf/frp/frps.ini:/etc/frp/frps.ini \
  snowdreamtech/frps:0.37.1
```

The required config for that in `frps.ini` is very minimal:

```toml
[common]
bind_port = 7000
vhost_http_port = 9888
authentication_method = token
token = <secret token>
```

The only other part on the server I needed to set up was adding some config to my main NGINX instance to create a reverse proxy to the frps server's port:

```nginx
server {
    server_name subdomain-name.yoursite.com

    location / {
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_pass http://localhost:5103/;
    }

    # <letsencrypt, QUIC, and other common config>
}
```

### Client Configuration

Setting up the client was even easier.  All I had to do was download the [latest release](https://github.com/fatedier/frp/releases) of the client portion of `frp` called `frpc` and create another tiny config file for it:

```toml
[common]
server_addr = <address of server running `frps`>
server_port = 5100
authentication_method = token
token = <same secret token as the server>

[web]
type = http
local_port = 4298
custom_domains = localhost
```

Whenever I want to expose a local service, I edit that config file (which I put at `~/frpc.ini`) and set the `local_port` to whatever port the service is running on.

Then, I start `frpc` using this command:

```
frpc -c ~/frpc.ini
```

That's all there is to it!  The service will be proxied to the subdomain and available publicly.

Definitely a bit more complex than just paying ngrok or someone else to do it, but this way you get full control over the server, the subdomain, and the whole setup.
