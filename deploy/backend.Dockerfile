# Multi-stage Rust release build.
# Final image: ~25MB alpine + statically-linked binary.

FROM rust:1.85-alpine AS builder
RUN apk add --no-cache musl-dev openssl-dev openssl-libs-static pkgconfig
WORKDIR /app
COPY server/Cargo.toml server/Cargo.lock ./
# Dummy main to cache deps
RUN mkdir src && echo 'fn main() {}' > src/main.rs && cargo build --release && rm -rf src

COPY server/src ./src
COPY server/migrations ./migrations
RUN touch src/main.rs && cargo build --release

# --- Runtime ---
FROM alpine:3.20
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=builder /app/target/release/llm-tycoon-server ./
COPY --from=builder /app/migrations ./migrations

ENV RUST_LOG=info
EXPOSE 4000
CMD ["./llm-tycoon-server"]
