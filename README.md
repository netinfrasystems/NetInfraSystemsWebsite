# netinfrasystems.com

Static rebuild of the Net Infra Systems site, served by nginx in a Docker container.

![Desktop preview](docs/preview-desktop.png)

## Deploy with Docker Compose

The site is published behind Pangolin through a Newt tunnel, so no ports are exposed on the host.
Save this as `docker-compose.yml` (it's also in the repo root):

```yaml
name: netinfrasystems
services:
  netinfrasystems:
    image: ghcr.io/amurikurthy/netinfrasystemswebsite:latest
    container_name: netinfrasystems
    restart: unless-stopped
    environment:
      - CONTACT_EMAIL=                # shown on the page; form falls back to mailto: here
      - BOOKING_URL=                  # optional: Calendly / Cal.com link for "Pick a time"
      - FORM_ENDPOINT=                # optional: Formspree-style JSON endpoint for the form

  netinfrasystems-newt:
    image: fosrl/newt
    container_name: netinfrasystems-newt
    restart: always
    environment:
      - PANGOLIN_ENDPOINT=https://pangolin.borderleaf.com
      - NEWT_ID=
      - NEWT_SECRET=
    extra_hosts:
      - "docker-host:host-gateway"

networks:
  default:
    name: netinfrasystems
```

1. Fill in `NEWT_ID` and `NEWT_SECRET` from the site you create in Pangolin.
2. Set at least one of `CONTACT_EMAIL`, `BOOKING_URL` or `FORM_ENDPOINT` (see below).
3. Start it:

   ```bash
   docker compose up -d
   ```

4. In Pangolin, add a resource for `netinfrasystems.com` (and `www`) pointing at
   `http://netinfrasystems:80` on this site. Pangolin handles HTTPS.

Update to the latest build:

```bash
docker compose pull && docker compose up -d
```

There's no `volumes:` entry because the site is stateless: everything lives in the image.

## Image

Every push to `main` builds a multi-arch image (amd64 + arm64) and publishes it to
`ghcr.io/amurikurthy/netinfrasystemswebsite`. Tags: `latest` (main), `sha-<commit>`, and `X.Y.Z` when you
push a `vX.Y.Z` git tag. The container listens on port 80 and has a health check at `/healthz`.

To build locally instead:

```bash
docker build -t ghcr.io/amurikurthy/netinfrasystemswebsite:latest .
```

## Settings (environment variables, no rebuild needed)

| Variable        | What it does |
|-----------------|--------------|
| `CONTACT_EMAIL` | Shows "Prefer email?" on the page. If there's no `FORM_ENDPOINT`, the form opens the visitor's email app addressed here. |
| `BOOKING_URL`   | Shows a "Pick a time on our calendar" button (Calendly, Cal.com, Google appointment schedule, ...). |
| `FORM_ENDPOINT` | The form POSTs JSON here (Formspree, Basin, Getform or your own API). Its origin is added to the CSP automatically. |

If none are set, the form tells visitors that online requests aren't set up yet, so set at least one before going live.

## Layout

```
site/            HTML, CSS, JS, fonts (self-hosted), images (WebP)
docker/          nginx template + startup script that writes /config.js
Dockerfile       nginx:1.28-alpine; healthcheck on /healthz
```

The server sets gzip, cache headers, and a strict Content-Security-Policy. YouTube videos load from
youtube-nocookie.com only after a visitor clicks play.
