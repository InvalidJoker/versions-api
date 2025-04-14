import ky from "ky";
import { CACHE_TTL, redis } from "./variables.js";
import { UniqueOrderedSet } from "./set.js";
import * as Sentry from "@sentry/node";
import { debug, error, info } from "./utils.js";

interface DockerImageTagsResponse {
  next: string | null;
  results: DockerImageTag[];
}

interface DockerImageTag {
  name: string;
}

function versionCompare(
  a: [number, number, number],
  b: [number, number, number]
): number {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) {
      return a[i] - b[i];
    }
  }
  return 0;
}

async function listDockerTags(image: string): Promise<string[]> {
  const client = ky.create({
    retry: {
      limit: 3,
      methods: ["GET"],
      statusCodes: [408, 413, 429, 500, 502, 503, 504],
    },
    timeout: 30000,
  });

  const url = `https://hub.docker.com/v2/repositories/library/${image}/tags?page_size=100`;
  let nextUrl: string | null = url;
  const result = new Set<string>();

  let page = 1;
  const maxPages = 25;

  try {
    while (nextUrl) {
      const response: DockerImageTagsResponse = await client
        .get(nextUrl)
        .json();

      for (const tag of response.results) {
        result.add(tag.name);
      }

      nextUrl = response.next;
      page++;
      if (page > maxPages) {
        break;
      }
    }

    debug(`Found ${result.size} tags`);

    return Array.from(result);
  } catch (e) {
    error(`Error fetching Docker tags for ${image}:`, e);
    Sentry.captureException(e);
    return [];
  }
}

interface NodeVersion {
  major: number;
  minor: number;
  patch: number;
}

async function updateNodeVersionCache(): Promise<NodeVersion[]> {
  try {
    const tags = await listDockerTags("node");
    const versions = new UniqueOrderedSet<NodeVersion>();

    for (const tag of tags) {
      const parts = tag.split(".").slice(0, 3);

      if (parts.length === 3) {
        const major = parseInt(parts[0], 10);
        const minor = parseInt(parts[1], 10);
        const patch = parseInt(parts[2], 10);

        if (!isNaN(major) && !isNaN(minor) && !isNaN(patch) && major >= 12) {
          versions.add(`${major}.${minor}.${patch}`, { major, minor, patch });
        }
      }
    }

    const sortedVersions = versions.sort((a, b) =>
      versionCompare([a.major, a.minor, a.patch], [b.major, b.minor, b.patch])
    );

    return sortedVersions;
  } catch (e) {
    error("Error updating Node.js version cache:", e);
    Sentry.captureException(e);
    return [];
  }
}

async function fetchDockerNodeVersions() {
  try {
    const cachedData = await redis.get("docker:node");
    if (cachedData) {
      return cachedData as NodeVersion[];
    }

    const nodeVersions = await updateNodeVersionCache();

    await redis.set("docker:node", nodeVersions, { ex: CACHE_TTL });
    info("Docker Node versions updated in Redis");
    return nodeVersions;
  } catch (e) {
    error("Error fetching Docker Node versions:", e);
    Sentry.captureException(e);
    const cachedData = await redis.get("docker:node");
    return (cachedData as NodeVersion[]) || [];
  }
}

export { fetchDockerNodeVersions };
