# 📘 API Reference — Versions API

All endpoints are prefixed with `/api/v1` unless otherwise noted.

---

## ✅ Health Check

```http
GET /health
```
Returns a simple status payload.

---

## 🎮 Minecraft Versions

### Vanilla
```http
GET /api/v1/minecraft/vanilla
```

### Paper
```http
GET /api/v1/minecraft/paper
```

### Purpur
```http
GET /api/v1/minecraft/purpur
```

### Fabric
```http
GET /api/v1/minecraft/fabric
```

### Forge
```http
GET /api/v1/minecraft/forge
```

### NeoForge
```http
GET /api/v1/minecraft/neoforge
```

### Quilt
```http
GET /api/v1/minecraft/quilt
```

Each of the above returns an array of version objects, including metadata like base version, stability, Java compatibility, and more.

---

## 🐳 Docker Tags

### Node.js Versions (via Docker Hub)
```http
GET /api/v1/docker/node
```
Returns a sorted list of Node.js versions (12+), parsed from Docker Hub tags.

---

## 🔗 Endpoint Discovery

```http
GET /api/v1/endpoints
```
Returns a map of all available endpoint URLs:

```json
{
  "minecraft": {
    "vanilla": "/api/v1/minecraft/vanilla",
    "paper": "/api/v1/minecraft/paper",
    "purpur": "/api/v1/minecraft/purpur",
    "fabric": "/api/v1/minecraft/fabric",
    "forge": "/api/v1/minecraft/forge",
    "neoforge": "/api/v1/minecraft/neoforge",
    "quilt": "/api/v1/minecraft/quilt"
  },
  "docker": {
    "node": "/api/v1/docker/node"
  }
}
```

---

## 🔐 Auth Header (If enabled)

If `AUTH_TOKEN` is configured in the environment:

```http
Authorization: Bearer <your_token>
```

All endpoints require this header or will return `401 Unauthorized`.
