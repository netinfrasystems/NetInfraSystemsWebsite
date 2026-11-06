FROM nginx:1.28-alpine

LABEL org.opencontainers.image.title="netinfrasystems.com" \
      org.opencontainers.image.description="Net Infra Systems website served by nginx" \
      org.opencontainers.image.source="https://github.com/amurikurthy/NetInfraSystemsWebsite"

RUN rm -f /etc/nginx/conf.d/default.conf /usr/share/nginx/html/*
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY site/ /usr/share/nginx/html/

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
