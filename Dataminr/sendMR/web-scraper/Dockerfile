FROM docker-reg.dataminr.com/dark-web/ubuntu-node:06.21.2024_16.59

# Environment Variables
ENV PORT=3000
ENV WEB_APP_DIR=/var/www/web-scraper
ENV DM_BASE_CFG_PATH="$WEB_APP_DIR/config"
ENV NODE_ENV="production"
ENV USE_PROXY="true"

WORKDIR $WEB_APP_DIR

COPY . $WEB_APP_DIR
COPY config/supervisord.conf /etc/supervisord.conf

HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 CMD curl -f http://localhost:3000/healthcheck || exit 1

EXPOSE $PORT

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
