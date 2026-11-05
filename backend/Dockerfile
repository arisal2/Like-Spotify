FROM golang:1.27.3-alpine AS build
WORKDIR /src
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /app ./cmd/server

FROM gcr.io/distroless/static-debian12:nonroot
WORKDIR /app
COPY --from=build /app /app/server
COPY assets/music /media/music
COPY assets/images/artwork /media/images/artwork
ENV HTTP_ADDR=:8081 MEDIA_DIR=/media
EXPOSE 8081
USER 65532:65532
ENTRYPOINT ["/app/server"]
