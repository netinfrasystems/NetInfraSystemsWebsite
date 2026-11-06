FROM nginx:1.28-alpine

LABEL org.opencontainers.image.title="netinfrasystems.com" \
      org.opencontainers.image.description="Net Infra Systems marketing site served by nginx"

# Only substitute our own variable in the nginx template
ENV NGINX_ENVSUBST_FILTER="^FORM_ORIGIN$" \
    BOOKING_URL="" \
    CONTACT_EMAIL="" \
    FORM_ENDPOINT=""

RUN rm -f /etc/nginx/conf.d/default.conf /usr/share/nginx/html/*
COPY docker/default.conf.template /etc/nginx/templates/default.conf.template
COPY --chmod=755 docker/15-site-config.envsh /docker-entrypoint.d/15-site-config.envsh
COPY site/ /usr/share/nginx/html/
RUN touch /usr/share/nginx/html/config.js && chmod -R a+rX /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
