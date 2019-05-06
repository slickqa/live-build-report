FROM golang:1-stretch as gobuild
RUN mkdir /live-build-report
WORKDIR /live-build-report
COPY *go* /live-build-report/
RUN GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -a -ldflags '-extldflags "-static"'

FROM node:lts-stretch as webbuild
COPY web /web
WORKDIR /web
RUN npm install; npm run build

FROM scratch
WORKDIR /
COPY --from=gobuild /live-build-report/live-build-report /live-build-report
COPY --from=webbuild /web/build /web
ENV CONFIG_PORT 9111
ENV CONFIG_APP_PATH /web
ENV CONFIG_BASE_URL /
ENV CONFIG_MONGO mongodb://localhost/slick
ENV CONFIG_SLICK_URL http://localhost
ENV CONFIG_POLL_INTERVAL 3000
VOLUME /data

CMD ["./live-build-report"]
