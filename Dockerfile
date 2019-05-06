FROM scratch
WORKDIR /
COPY live-build-report /live-build-report
COPY web/build /web
ENV CONFIG_PORT 9111
ENV CONFIG_APP_PATH /web
ENV CONFIG_BASE_URL /
ENV CONFIG_MONGO mongodb://localhost/slick
ENV CONFIG_SLICK_URL http://localhost
ENV CONFIG_POLL_INTERVAL 3000
VOLUME /data

CMD ["./live-build-report"]
