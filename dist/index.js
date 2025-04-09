import "dotenv/config";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { prettyJSON } from "hono/pretty-json";
import { serve } from "@hono/node-server";
import * as cron from "node-cron";
import { fetchVanillaVersions, fetchPaperVersions, fetchPurpurVersions, fetchFabricVersions, fetchForgeVersions, fetchNeoForgeVersions, fetchQuiltVersions, } from "./minecraft/minecraft.js";
import { fetchDockerNodeVersions } from "./docker.js";
// Initialize Hono app
const app = new Hono();
// Middleware
app.use("*", logger());
app.use("*", secureHeaders());
app.use("*", prettyJSON());
const setupCacheUpdaters = () => {
    cron.schedule("0 0 * * *", () => {
        fetchVanillaVersions();
    });
    // Update Paper at 1 AM
    cron.schedule("0 1 * * *", () => {
        fetchPaperVersions();
    });
    // Update Purpur at 2 AM
    cron.schedule("0 2 * * *", () => {
        fetchPurpurVersions();
    });
    // Update Fabric at 3 AM
    cron.schedule("0 3 * * *", () => {
        fetchFabricVersions();
    });
    // Update Forge at 4 AM
    cron.schedule("0 4 * * *", () => {
        fetchForgeVersions();
    });
    // Update NeoForge at 5 AM
    cron.schedule("0 5 * * *", () => {
        fetchNeoForgeVersions();
    });
    // Update Quilt at 6 AM
    cron.schedule("0 6 * * *", () => {
        fetchQuiltVersions();
    });
    // Update Docker Node versions at 7 AM
    cron.schedule("0 7 * * *", () => {
        fetchDockerNodeVersions();
    });
};
// API Endpoints
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
// Docker Node.js versions endpoint with API key protection
app.get("/api/v1/docker/node", async (c) => {
    const versions = await fetchDockerNodeVersions();
    return c.json(versions);
});
// Health check endpoint
app.get("/health", (c) => {
    return c.json({ status: "ok" });
});
// Initialize data on startup
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
        console.log("Initial data fetch complete");
    }
    catch (error) {
        console.error("Error initializing data:", error);
    }
};
// Set up scheduled cache updates
setupCacheUpdaters();
// Start the server
const PORT = process.env.PORT || 3000;
serve({
    fetch: app.fetch,
    port: Number(PORT),
}, async () => {
    console.log(`Server running on port ${PORT}`);
    await initializeData();
});
