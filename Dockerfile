FROM golang as builder
RUN mkdir -p /go/src/agent-config-service
ADD . /go/src/agent-config-service/
WORKDIR /go/src/agent-config-service
RUN go get .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags '-extldflags "-static"' -o agent-config-service .
FROM scratch
WORKDIR /
COPY --from=builder /go/src/agent-config-service /
ENV CONFIG_PORT 9042
ENV CONFIG_STORAGE /data
VOLUME /data

CMD ["./agent-config-service"]
