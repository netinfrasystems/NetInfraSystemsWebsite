# netinfrasystems.com

The Net Infra Systems website is a static, single-page site. nginx serves it from a Docker container, and Pangolin publishes it.

<p>
  <img src="docs/preview-desktop.jpg" alt="Desktop preview" width="560">
  &nbsp;
  <img src="docs/preview-mobile.jpg" alt="Mobile preview" width="220">
</p>

The page has these sections, top to bottom (anchor in brackets):

- Hero
- What we do / services `#services`
- Why us `#why`
- Our story `#story`
- Productions `#work`
- Behind the scenes `#bts`
- Contact with the consultation form `#contact`

## Deploy with Docker Compose

The site runs behind Pangolin through a Newt tunnel, so the compose file publishes no host ports. `docker-compose.yml` in the repo root is the template for the compose file on the server:

```yaml
name: netinfrasystemswebsite
services:
  netinfrasystemswebsite:
    image: ghcr.io/netinfrasystems/netinfrasystemswebsite:latest
    container_name: netinfrasystemswebsite
    restart: unless-stopped

  netinfrasystemswebsite-newt:
    image: fosrl/newt
    container_name: netinfrasystemswebsite-newt
    restart: always
    environment:
      - PANGOLIN_ENDPOINT=https://your-pangolin-server.example.com
      - NEWT_ID=
      - NEWT_SECRET=
    extra_hosts:
      - "docker-host:host-gateway"

networks:
  default:
    name: netinfrasystemswebsite
```

1. On the server, copy that template. Set `PANGOLIN_ENDPOINT` to your Pangolin server. The repo keeps the placeholder `https://your-pangolin-server.example.com`. Fill in `NEWT_ID` and `NEWT_SECRET` from the site you create in Pangolin. Leave both blank in the repo copy.
2. Lock down the compose file on the server with `sudo chmod 600`. It holds the Newt secret.
3. The image `ghcr.io/netinfrasystems/netinfrasystemswebsite` is public, so no `docker login` is needed to pull it. If a pull says `unauthorized`, run `docker logout ghcr.io` to clear a stale login.
4. In the folder that holds your compose file on the server, start it:

   ```bash
   sudo docker compose up -d
   ```

5. In Pangolin, add a resource for `netinfrasystems.com` (and `www`) pointing at `http://netinfrasystemswebsite:80` on this site. Pangolin handles HTTPS.

The site is stateless, so there are no volumes to back up.

### Updating

Every push to `main` publishes a new image. In the folder that holds your compose file on the server, run:

```bash
sudo docker compose pull && sudo docker compose up -d
```

When you want a full restart, stop the stack first, then pull and start it again:

```bash
sudo docker compose down
sudo docker compose pull && sudo docker compose up -d
```

Confirm the containers are up, and that `/healthz` answers:

```bash
sudo docker compose ps
sudo docker compose exec netinfrasystemswebsite wget -q -O - http://127.0.0.1/healthz
```

Visitors see the update right away. Pages, CSS and JS are served with `Cache-Control: no-cache`: browsers revalidate on each visit and get a `304` when nothing changed. Images and fonts are cached for 30 days, so **if you replace an image, give the file a new name** (and update the reference) rather than overwriting it.

### Testing locally without Pangolin

The compose file publishes no ports. For a quick local test, run the image directly and open http://localhost:8080:

```bash
docker run --rm -p 8080:80 ghcr.io/netinfrasystems/netinfrasystemswebsite:latest
```

## Image and CI

`.github/workflows/docker-image.yml` builds on every push to `main`, on `v*` tags, and on pull requests. Pull requests only build; they do not publish.

The repo is under the `netinfrasystems` GitHub account. The workflow pushes to `ghcr.io/${{ github.repository_owner }}/netinfrasystemswebsite`, which is `ghcr.io/netinfrasystems/netinfrasystemswebsite`. The package is public.

The workflow does three things:

- Builds a multi-arch image (`linux/amd64`, `linux/arm64`).
- Publishes it to `ghcr.io/netinfrasystems/netinfrasystemswebsite`.
- Smoke-tests the published image: `/healthz` must answer and the page must load.

Tags:

| Tag | When |
|---|---|
| `latest` | every push to `main` |
| `sha-<commit>` | every build |
| `X.Y.Z` | when you push a `vX.Y.Z` git tag |

The container serves on port 80, runs `nginx:1.28-alpine`, and has a Docker health check on `/healthz`.

To build locally instead:

```bash
docker build -t ghcr.io/netinfrasystems/netinfrasystemswebsite:latest .
```

## Consultation form (Google Forms)

The contact section embeds the **Free Consultation Request** Google Form in an iframe (`#consultation-form` in `site/index.html`). Responses land in Google Forms and its linked Sheet. Editing questions in Google Forms updates the site automatically, with no deploy needed.

Settings the form relies on, so both sides get an email:

| Where in Google Forms | Setting | Why |
|---|---|---|
| Settings → Responses | **Collect email addresses: Responder input** | adds Google's own Email field (no sign-in required) |
| Settings → Responses | **Send responders a copy of their response: Always** | the client gets a confirmation email |
| Responses → ⋮ | **Get email notifications for new responses** | you get an email for each request |

Things to know:

- **Height:** the iframe cannot size itself, because the form is on Google's domain. Its height is set per screen width in `site/css/styles.css` (`.form-embed iframe`: 1960px, or 2080/2120/2230px on narrow phones), measured so the form never scrolls inside its frame. If you add or remove several questions, adjust these numbers.
- **Security policy:** the Content-Security-Policy allows frames from `docs.google.com` and `*.google.com`. The second is needed because Google routes signed-in visitors through `accounts.google.com`. Without it they see "This content is blocked".
- **Styling:** the form cannot be restyled from this site (browsers block styling another site's page). Its theme colour is set in Google Forms to `#434BE7`, the site's indigo.
- **After submitting:** `site/js/main.js` replaces the form with the site's own "Request received" card and scrolls it into view. "Submit another request" brings back a fresh form. The script cannot see inside Google's frame, so it relies on the frame loading a new page after the visitor has used the form. That is safe because every link in Google's form opens in a new tab, so only a submission reloads the frame. Loads before anyone touches the form are ignored. Google's own confirmation message (Settings → Presentation) only shows if the form is opened in a new tab.
- **Fallback:** an "Open it in a new tab" link under the form covers browsers that block embedded content.

## Editing the site

Everything is plain HTML, CSS and JS in `site/`. There is no build step.

| To change | Edit |
|---|---|
| Text, services, sections | `site/index.html` |
| Production videos | the `data-yt="<YouTube video ID>"` attribute on each card in `site/index.html` |
| Gallery photos | `site/img/bts-NN.webp` (WebP, about 1400px on the long side) and the matching `<a>`/`<img>` in the `#bts` gallery |
| Colours, spacing, layout | `site/css/styles.css`; colours are variables at the top (`--accent: #434be7`, `--bg: #0e131b`) |
| Mobile menu, video players, lightbox | `site/js/main.js` |

Videos load from `youtube-nocookie.com` only when a visitor clicks play. Fonts (Big Shoulders Display, Inter) are self-hosted in `site/fonts/`. The site makes no other third-party requests and has no analytics or trackers.

## Server configuration

`docker/nginx.conf` sets up:

- gzip
- the caching rules above
- security headers: `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`
- the `/healthz` endpoint

The CSP only allows the site's own files, plus frames from YouTube (no-cookie) and Google (the form). Adding any other outside service, such as analytics, a chat widget or another embed, means adding its domain to that policy, or the browser will block it.

## Repository layout

```
site/                           the website: index.html, css/, js/, fonts/ (self-hosted), img/ (WebP + logos)
docker/nginx.conf               nginx config: caching, security headers, /healthz
Dockerfile                      nginx:1.28-alpine image with the site baked in
docker-compose.yml              template: site + Newt tunnel to Pangolin
.github/workflows/              build, publish and smoke-test the image
docs/                           README preview screenshots
```
