import { Redis } from "@upstash/redis";

export const CACHE_TTL = 86400;

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL || "",
  token: process.env.UPSTASH_REDIS_TOKEN || "",
});
