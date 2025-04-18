import "dotenv/config";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { prettyJSON } from "hono/pretty-json";
import { serve } from "@hono/node-server";
import * as cron from "node-cron";
import * as Sentry from "@sentry/node";
import {
  fetchVanillaVersions,
  fetchPaperVersions,
  fetchPurpurVersions,
  fetchFabricVersions,
  fetchForgeVersions,
  fetchNeoForgeVersions,
  fetchQuiltVersions,
} from "./minecraft/minecraft.js";
import { fetchDockerNodeVersions } from "./docker.js";
import { error, info } from "./utils.js";

const app = new Hono();

const token = process.env.AUTH_TOKEN;

app.use("*", secureHeaders());
app.use("*", prettyJSON());

if (process.env.NODE_ENV === "development") {
  app.use("*", logger());
}

if (token) {
  app.use("*", async (c, next) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader || authHeader !== "Bearer " + token) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    return next();
  });
}

const setupCacheUpdaters = () => {
  cron.schedule("0 0 * * *", () => {
    fetchVanillaVersions();
    fetchPaperVersions();
    fetchPurpurVersions();
    fetchFabricVersions();
    fetchForgeVersions();
    fetchNeoForgeVersions();
    fetchQuiltVersions();
    fetchDockerNodeVersions();
  });
};

app.get("/api/v1/minecraft/vanilla", async (c) => {
  const versions = await fetchVanillaVersions();
  return c.json(versions);
});

app.get("/api/v1/minecraft/paper", async (c) => {
  const versions = await fetchPaperVersions();
  return c.json(versions);
});

app.get("/api/v1/minecraft/purpur", async (c) => {
  const versions = await fetchPurpurVersions();
  return c.json(versions);
});

app.get("/api/v1/minecraft/fabric", async (c) => {
  const versions = await fetchFabricVersions();
  return c.json(versions);
});

app.get("/api/v1/minecraft/forge", async (c) => {
  const versions = await fetchForgeVersions();
  return c.json(versions);
});

app.get("/api/v1/minecraft/neoforge", async (c) => {
  const versions = await fetchNeoForgeVersions();
  return c.json(versions);
});

app.get("/api/v1/minecraft/quilt", async (c) => {
  const versions = await fetchQuiltVersions();
  return c.json(versions);
});

app.get("/api/v1/docker/node", async (c) => {
  const versions = await fetchDockerNodeVersions();
  return c.json(versions);
});

app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

app.get("/api/v1/endpoints", (c) => {
  return c.json({
    minecraft: {
      vanilla: "/api/v1/minecraft/vanilla",
      paper: "/api/v1/minecraft/paper",
      purpur: "/api/v1/minecraft/purpur",
      fabric: "/api/v1/minecraft/fabric",
      forge: "/api/v1/minecraft/forge",
      neoforge: "/api/v1/minecraft/neoforge",
      quilt: "/api/v1/minecraft/quilt",
    },
    docker: {
      node: "/api/v1/docker/node",
    },
  });
});

const initializeData = async () => {
  try {
    await Promise.all([
      fetchVanillaVersions(),
      fetchPaperVersions(),
      fetchPurpurVersions(),
      fetchFabricVersions(),
      fetchForgeVersions(),
      fetchNeoForgeVersions(),
      fetchQuiltVersions(),
      fetchDockerNodeVersions(),
    ]);

    info("Initial data fetch complete");
  } catch (e) {
    error("Error initializing data:", e);
    Sentry.captureException(e);
  }
};

setupCacheUpdaters();

Sentry.init({
  dsn: "https://c7a2c043fdc914f75b03612cd7ed87ea@o4507044844404736.ingest.us.sentry.io/4509124926963712",
});

const PORT = process.env.PORT || 8080;

serve(
  {
    fetch: app.fetch,
    port: Number(PORT),
  },
  async () => {
    info(`Server running on port ${PORT}`);
    await initializeData();
  }
);
