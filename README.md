# 🧩 Versions API

A Node.js-based service for fetching and caching the latest Minecraft versions from various upstream sources including Vanilla, Paper, Purpur, Fabric, Quilt, Forge, and NeoForge.

Provides a clean, consistent API interface with optional bearer token authentication and Redis-based caching (Upstash-compatible).

---

## 🚀 Features

- Fetches and caches Minecraft versions across major platforms
- Supports build and loader version info
- Optional Bearer token authentication
- Built-in Redis caching (Upstash compatible)
- Ready-to-deploy via Docker

---

## 📦 Docker Deployment

Use the following `docker-compose.yml` to get started:

```yaml
version: "3.8"

services:
  versions-api:
    image: ghcr.io/invalidjoker/versions-api:latest
    ports:
      - "8080:8080"
    environment:
      - UPSTASH_REDIS_URL=your_upstash_redis_url
      - UPSTASH_REDIS_TOKEN=your_upstash_redis_token
      # Optional for auth:
      - AUTH_TOKEN=your_secret_token
    restart: unless-stopped
```

---

## 💾 Redis Caching

Each version type is cached individually in Redis using sensible TTL values. Uses [Upstash](https://upstash.com/) but is compatible with any Redis-compatible service.

---

## 📄 License

GNU GPLv3 - see [LICENSE](LICENSE) for details.
