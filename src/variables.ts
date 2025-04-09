import { Redis } from "@upstash/redis";

// Cache TTL in seconds (24 hours)
export const CACHE_TTL = 86400;

// Initialize Upstash Redis client
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL || "",
  token: process.env.UPSTASH_REDIS_TOKEN || "",
});
