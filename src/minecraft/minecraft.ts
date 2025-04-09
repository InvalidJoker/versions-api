import ky from "ky";
import { CACHE_TTL, redis } from "../variables.js";
import type { MinecraftVersion, MojangVersionManifest } from "./types.js";

function determineJavaAndDatapack(versionId: string): {
  recommendedJava: number;
  supportsDatapacks: boolean;
} {
  let recommendedJava = 21;
  let supportsDatapacks = true;

  if (versionId.startsWith("1.20")) {
    recommendedJava = 17;
  } else if (versionId.startsWith("1.16") || parseFloat(versionId) <= 1.16) {
    recommendedJava = 8;
  }

  const versionNum = parseFloat(versionId.split(".").slice(0, 2).join("."));
  if (versionNum <= 1.12 || versionId === "1.9.4" || versionId === "1.8.8") {
    supportsDatapacks = false;
  }

  return { recommendedJava, supportsDatapacks };
}

/**
 * Generic function to fetch and cache Minecraft versions
 */
async function fetchVersions<T>(
  cacheKey: string,
  fetcher: () => Promise<MinecraftVersion[]>
): Promise<MinecraftVersion[]> {
  try {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return cachedData as MinecraftVersion[];
    }

    const versions = await fetcher();

    if (versions.length > 0) {
      await redis.set(cacheKey, versions, { ex: CACHE_TTL });
      console.log(`${cacheKey} versions updated in Redis`);
    }

    return versions;
  } catch (error) {
    console.error(`Error fetching ${cacheKey} versions:`, error);
    const cachedData = await redis.get(cacheKey);
    return (cachedData as MinecraftVersion[]) || [];
  }
}

/**
 * Create a Minecraft version object with common properties
 */
function createVersionObject(
  id: string,
  baseVersion: string,
  type: string,
  isStable: boolean,
  additionalProps: Partial<MinecraftVersion> = {}
): MinecraftVersion {
  const { recommendedJava, supportsDatapacks } =
    determineJavaAndDatapack(baseVersion);

  return {
    id,
    type: type as "release" | "snapshot",
    baseVersion,
    isStable,
    javaVersions: {
      minimum: recommendedJava >= 17 ? "17" : "8",
      maximum: "21",
      recommended: recommendedJava.toString(),
    },
    supportsDatapacks,
    isSnapshot: type === "snapshot",
    ...additionalProps,
  };
}

/**
 * Fetch Vanilla Minecraft versions from Mojang API
 */
async function fetchVanillaVersions(): Promise<MinecraftVersion[]> {
  return fetchVersions("minecraft:vanilla", async () => {
    const manifest: MojangVersionManifest = await ky
      .get("https://launchermeta.mojang.com/mc/game/version_manifest.json")
      .json();

    const versions: MinecraftVersion[] = [];

    for (const version of manifest.versions) {
      if (version.type === "release") {
        versions.push(
          createVersionObject(version.id, version.id, "release", true)
        );

        if (version.id === "1.7.10") break;
      }
    }

    return versions;
  });
}

/**
 * Fetch Paper versions from PaperMC API
 */
async function fetchPaperVersions(): Promise<MinecraftVersion[]> {
  return fetchVersions("minecraft:paper", async () => {
    const paperVersionsResponse = await ky
      .get("https://api.papermc.io/v2/projects/paper")
      .json<{ versions: string[] }>();

    const versions: MinecraftVersion[] = [];

    for (const versionId of paperVersionsResponse.versions) {
      try {
        const buildsResponse = await ky
          .get(
            `https://api.papermc.io/v2/projects/paper/versions/${versionId}/builds`
          )
          .json<{ builds: { build: number }[] }>();

        if (buildsResponse.builds?.length > 0) {
          const minBuild = buildsResponse.builds[0].build;
          const maxBuild =
            buildsResponse.builds[buildsResponse.builds.length - 1].build;

          versions.push(
            createVersionObject(
              versionId,
              versionId,
              versionId.includes("snapshot") ? "snapshot" : "release",
              !versionId.includes("snapshot"),
              {
                buildNumbers: {
                  min: minBuild.toString(),
                  max: maxBuild.toString(),
                },
              }
            )
          );

          if (versionId === "1.7.10") break;
        }
      } catch (error) {
        console.error(
          `Error fetching Paper builds for version ${versionId}:`,
          error
        );
      }
    }

    return versions;
  });
}

/**
 * Fetch Purpur versions from PurpurMC API
 */
async function fetchPurpurVersions(): Promise<MinecraftVersion[]> {
  return fetchVersions("minecraft:purpur", async () => {
    const purpurVersionsResponse = await ky
      .get("https://api.purpurmc.org/v2/purpur")
      .json<{ versions: string[] }>();

    const versions: MinecraftVersion[] = [];

    for (const versionId of purpurVersionsResponse.versions) {
      try {
        const buildsResponse = await ky
          .get(`https://api.purpurmc.org/v2/purpur/${versionId}`)
          .json<{ builds: { all: string[] } }>();

        if (buildsResponse.builds?.all?.length > 0) {
          const minBuild = buildsResponse.builds.all[0];
          const maxBuild =
            buildsResponse.builds.all[buildsResponse.builds.all.length - 1];

          versions.push(
            createVersionObject(
              versionId,
              versionId,
              versionId.includes("snapshot") ? "snapshot" : "release",
              !versionId.includes("snapshot"),
              {
                buildNumbers: {
                  min: minBuild,
                  max: maxBuild,
                },
              }
            )
          );

          if (versionId === "1.7.10") break;
        }
      } catch (error) {
        console.error(
          `Error fetching Purpur builds for version ${versionId}:`,
          error
        );
      }
    }

    return versions;
  });
}

/**
 * Generic function to fetch versions from a loader API (Fabric or Quilt)
 */
async function fetchLoaderVersions(
  cacheKey: string,
  loaderMetaUrl: string,
  gameVersionsUrl: string
): Promise<MinecraftVersion[]> {
  return fetchVersions(cacheKey, async () => {
    const loaders = await ky.get(loaderMetaUrl).json<any[]>();
    const gameVersions = await ky.get(gameVersionsUrl).json<any[]>();

    const versions: MinecraftVersion[] = [];

    for (const version of gameVersions) {
      if (version.stable) {
        versions.push(
          createVersionObject(
            version.version,
            version.version,
            "release",
            true,
            {
              loaderVersions: {
                min: loaders[loaders.length - 1].version,
                max: loaders[0].version,
              },
            }
          )
        );

        if (version.version === "1.7.10") break;
      }
    }

    return versions;
  });
}

/**
 * Fetch Fabric versions
 */
async function fetchFabricVersions(): Promise<MinecraftVersion[]> {
  return fetchLoaderVersions(
    "minecraft:fabric",
    "https://meta.fabricmc.net/v2/versions/loader",
    "https://meta.fabricmc.net/v2/versions/game"
  );
}

/**
 * Fetch Quilt versions
 */
async function fetchQuiltVersions(): Promise<MinecraftVersion[]> {
  return fetchLoaderVersions(
    "minecraft:quilt",
    "https://meta.quiltmc.org/v3/versions/loader",
    "https://meta.quiltmc.org/v3/versions/game"
  );
}

/**
 * Fetch Forge versions from Forge API
 */
async function fetchForgeVersions(): Promise<MinecraftVersion[]> {
  return fetchVersions("minecraft:forge", async () => {
    const forgeData = await ky
      .get(
        "https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json"
      )
      .json<{ promos: Record<string, string> }>();

    const versions: MinecraftVersion[] = [];

    for (const key in forgeData.promos) {
      if (key.includes("recommended") || key.includes("latest")) {
        const mcVersion = key.split("-")[0];
        const forgeVersion = forgeData.promos[key];

        versions.push(
          createVersionObject(
            `${mcVersion}-${forgeVersion}`,
            mcVersion,
            "release",
            key.includes("recommended"),
            {
              buildNumbers: {
                min: forgeVersion,
                max: forgeVersion,
              },
            }
          )
        );

        if (mcVersion === "1.7.10") break;
      }
    }

    return versions;
  });
}

/**
 * Fetch NeoForge versions from NeoForge API
 */
async function fetchNeoForgeVersions(): Promise<MinecraftVersion[]> {
  return fetchVersions("minecraft:neoforge", async () => {
    const neoForgeData = await ky
      .get(
        "https://maven.neoforged.net/api/maven/versions/releases/net/neoforged/neoforge"
      )
      .json<{ versions: string[] }>();

    const versions: MinecraftVersion[] = [];

    for (const version of neoForgeData.versions) {
      const mcVersionMatch = version.match(/(\d+\.\d+(?:\.\d+)?)/);
      if (mcVersionMatch) {
        const mcVersion = mcVersionMatch[1];

        versions.push(
          createVersionObject(version, mcVersion, "release", true, {
            buildNumbers: {
              min: version,
              max: version,
            },
          })
        );

        if (mcVersion === "1.7.10") break;
      }
    }

    return versions;
  });
}

export {
  fetchVanillaVersions,
  fetchPaperVersions,
  fetchPurpurVersions,
  fetchFabricVersions,
  fetchForgeVersions,
  fetchNeoForgeVersions,
  fetchQuiltVersions,
};
