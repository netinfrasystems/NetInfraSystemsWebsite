# netinfrasystems.com

The Net Infra Systems website: a static site served by nginx in a Docker container.

![Desktop preview](docs/preview-desktop.png)

## Deploy with Docker Compose

The site is published behind Pangolin through a Newt tunnel, so no ports are exposed on the host.
`docker-compose.yml` in the repo root:

```yaml
name: netinfrasystemswebsite
services:
  netinfrasystemswebsite:
    image: ghcr.io/amurikurthy/netinfrasystemswebsite:latest
    container_name: netinfrasystemswebsite
    restart: unless-stopped

  netinfrasystemswebsite-newt:
    image: fosrl/newt
    container_name: netinfrasystemswebsite-newt
    restart: always
    environment:
      - PANGOLIN_ENDPOINT=https://pangolin.borderleaf.com
      - NEWT_ID=
      - NEWT_SECRET=
    extra_hosts:
      - "docker-host:host-gateway"

networks:
  default:
    name: netinfrasystemswebsite
```

1. Fill in `NEWT_ID` and `NEWT_SECRET` from the site you create in Pangolin.
2. Start it:

   ```bash
   docker compose up -d
   ```

3. In Pangolin, add a resource for `netinfrasystems.com` (and `www`) pointing at
   `http://netinfrasystemswebsite:80` on this site. Pangolin handles HTTPS.

Update to the latest build:

```bash
docker compose pull && docker compose up -d
```

The site is stateless, so there are no volumes to back up.

## Image

Every push to `main` builds a multi-arch image (amd64 + arm64) and publishes it to
`ghcr.io/amurikurthy/netinfrasystemswebsite`. Tags: `latest` (main), `sha-<commit>`, and `X.Y.Z` when you
push a `vX.Y.Z` git tag. The container listens on port 80 and has a health check at `/healthz`.

To build locally instead:

```bash
docker build -t ghcr.io/amurikurthy/netinfrasystemswebsite:latest .
```

## Contact form

The contact section currently shows an "Online requests coming soon" placeholder. To add a Google Form,
replace the contents of `<div id="consultation-form">` in `site/index.html` with the form's embed iframe
(in Google Forms: **Send > `<>`**). The server's Content-Security-Policy already allows `docs.google.com`.

## Layout

```
site/              HTML, CSS, JS, fonts (self-hosted), images (WebP)
docker/nginx.conf  nginx server config: gzip, caching, security headers, /healthz
Dockerfile         nginx:1.28-alpine
```

YouTube videos load from youtube-nocookie.com only after a visitor clicks play.
