import ky from "ky";
import { CACHE_TTL, redis } from "../variables.js";
// Helper function to determine Java versions and data pack support based on the provided Rust logic
function determineJavaAndDatapack(versionId) {
    let recommendedJava = 21; // Default to latest LTS as of 2025
    let supportsDatapacks = true;
    // Implementing the Rust logic
    switch (versionId) {
        case "1.20.4":
            recommendedJava = 17;
            break;
        case "1.16.5":
            recommendedJava = 8;
            break;
    }
    // check if under 1.12.2
    if (versionId < "1.12.2") {
        supportsDatapacks = false;
    }
    // For versions below 1.12, data packs are not supported
    const versionNum = parseFloat(versionId.split(".").slice(0, 2).join("."));
    if (versionNum <= 1.12) {
        supportsDatapacks = false;
    }
    return { recommendedJava, supportsDatapacks };
}
// Fetch version data functions
async function fetchVanillaVersions() {
    try {
        const cachedData = await redis.get("minecraft:vanilla");
        if (cachedData) {
            return cachedData;
        }
        const manifest = await ky
            .get("https://launchermeta.mojang.com/mc/game/version_manifest.json")
            .json();
        const versions = [];
        // Filter for release versions only and process them according to the Rust logic
        let index = 0;
        for (const version of manifest.versions) {
            if (version.type === "release") {
                const { recommendedJava, supportsDatapacks } = determineJavaAndDatapack(version.id);
                versions.push({
                    id: version.id,
                    type: "release",
                    baseVersion: version.id,
                    isStable: true,
                    javaVersions: {
                        minimum: recommendedJava >= 17 ? "17" : "8",
                        maximum: "21",
                        recommended: recommendedJava.toString(),
                    },
                    supportsDatapacks,
                    isSnapshot: false,
                });
                // Break if we hit 1.7.10 as in the Rust code
                if (version.id === "1.7.10") {
                    break;
                }
                index++;
            }
        }
        await redis.set("minecraft:vanilla", versions, { ex: CACHE_TTL });
        console.log("Vanilla versions updated in Redis");
        return versions;
    }
    catch (error) {
        console.error("Error fetching Vanilla versions:", error);
        const cachedData = await redis.get("minecraft:vanilla");
        return cachedData || [];
    }
}
async function fetchPaperVersions() {
    try {
        const cachedData = await redis.get("minecraft:paper");
        if (cachedData) {
            return cachedData;
        }
        const paperVersionsResponse = await ky
            .get("https://api.papermc.io/v2/projects/paper")
            .json();
        const versions = [];
        for (const versionId of paperVersionsResponse.versions) {
            try {
                const buildsResponse = await ky
                    .get(`https://api.papermc.io/v2/projects/paper/versions/${versionId}/builds`)
                    .json();
                const builds = buildsResponse.builds;
                if (builds && builds.length > 0) {
                    const minBuild = builds[0].build;
                    const maxBuild = builds[builds.length - 1].build;
                    const { recommendedJava, supportsDatapacks } = determineJavaAndDatapack(versionId);
                    versions.push({
                        id: versionId,
                        type: versionId.includes("snapshot") ? "snapshot" : "release",
                        baseVersion: versionId,
                        isStable: !versionId.includes("snapshot"),
                        javaVersions: {
                            minimum: recommendedJava >= 17 ? "17" : "8",
                            maximum: "21",
                            recommended: recommendedJava.toString(),
                        },
                        supportsDatapacks,
                        buildNumbers: {
                            min: minBuild.toString(),
                            max: maxBuild.toString(),
                        },
                        isSnapshot: versionId.includes("snapshot"),
                    });
                }
            }
            catch (error) {
                console.error(`Error fetching Paper builds for version ${versionId}:`, error);
            }
        }
        await redis.set("minecraft:paper", versions, { ex: CACHE_TTL });
        console.log("Paper versions updated in Redis");
        return versions;
    }
    catch (error) {
        console.error("Error fetching Paper versions:", error);
        const cachedData = await redis.get("minecraft:paper");
        return cachedData || [];
    }
}
async function fetchPurpurVersions() {
    try {
        const cachedData = await redis.get("minecraft:purpur");
        if (cachedData) {
            return cachedData;
        }
        const purpurVersionsResponse = await ky
            .get("https://api.purpurmc.org/v2/purpur")
            .json();
        const versions = [];
        for (const versionId of purpurVersionsResponse.versions) {
            try {
                const buildsResponse = await ky
                    .get(`https://api.purpurmc.org/v2/purpur/${versionId}`)
                    .json();
                const builds = buildsResponse.builds;
                if (builds && builds.all && builds.all.length > 0) {
                    const minBuild = builds.all[0];
                    const maxBuild = builds.all[builds.all.length - 1];
                    const { recommendedJava, supportsDatapacks } = determineJavaAndDatapack(versionId);
                    versions.push({
                        id: versionId,
                        type: versionId.includes("snapshot") ? "snapshot" : "release",
                        baseVersion: versionId,
                        isStable: !versionId.includes("snapshot"),
                        javaVersions: {
                            minimum: recommendedJava >= 17 ? "17" : "8",
                            maximum: "21",
                            recommended: recommendedJava.toString(),
                        },
                        supportsDatapacks,
                        buildNumbers: {
                            min: minBuild,
                            max: maxBuild,
                        },
                        isSnapshot: versionId.includes("snapshot"),
                    });
                }
            }
            catch (error) {
                console.error(`Error fetching Purpur builds for version ${versionId}:`, error);
            }
        }
        await redis.set("minecraft:purpur", versions, { ex: CACHE_TTL });
        console.log("Purpur versions updated in Redis");
        return versions;
    }
    catch (error) {
        console.error("Error fetching Purpur versions:", error);
        const cachedData = await redis.get("minecraft:purpur");
        return cachedData || [];
    }
}
async function fetchFabricVersions() {
    try {
        const cachedData = await redis.get("minecraft:fabric");
        if (cachedData) {
            return cachedData;
        }
        // Get Fabric loader versions
        const loaders = await ky
            .get("https://meta.fabricmc.net/v2/versions/loader")
            .json();
        // Get game versions
        const gameVersions = await ky
            .get("https://meta.fabricmc.net/v2/versions/game")
            .json();
        const versions = [];
        for (const version of gameVersions) {
            if (version.stable) {
                const { recommendedJava, supportsDatapacks } = determineJavaAndDatapack(version.version);
                versions.push({
                    id: version.version,
                    type: "release",
                    baseVersion: version.version,
                    isStable: true,
                    javaVersions: {
                        minimum: recommendedJava >= 17 ? "17" : "8",
                        maximum: "21",
                        recommended: recommendedJava.toString(),
                    },
                    supportsDatapacks,
                    loaderVersions: {
                        min: loaders[loaders.length - 1].version,
                        max: loaders[0].version,
                    },
                    isSnapshot: false,
                });
                // Break if we hit 1.7.10 as in the Rust code
                if (version.version === "1.7.10") {
                    break;
                }
            }
        }
        await redis.set("minecraft:fabric", versions, { ex: CACHE_TTL });
        console.log("Fabric versions updated in Redis");
        return versions;
    }
    catch (error) {
        console.error("Error fetching Fabric versions:", error);
        const cachedData = await redis.get("minecraft:fabric");
        return cachedData || [];
    }
}
async function fetchForgeVersions() {
    try {
        const cachedData = await redis.get("minecraft:forge");
        if (cachedData) {
            return cachedData;
        }
        // Note: This is a simplified approach as the Forge API is more complex
        const forgeData = await ky
            .get("https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json")
            .json();
        const versions = [];
        // Process recommended and latest versions
        for (const key in forgeData.promos) {
            if (key.includes("recommended") || key.includes("latest")) {
                const mcVersion = key.split("-")[0];
                const forgeVersion = forgeData.promos[key];
                const { recommendedJava, supportsDatapacks } = determineJavaAndDatapack(mcVersion);
                versions.push({
                    id: `${mcVersion}-${forgeVersion}`,
                    type: "release",
                    baseVersion: mcVersion,
                    isStable: key.includes("recommended"),
                    javaVersions: {
                        minimum: recommendedJava >= 17 ? "17" : "8",
                        maximum: "21",
                        recommended: recommendedJava.toString(),
                    },
                    supportsDatapacks,
                    buildNumbers: {
                        min: forgeVersion,
                        max: forgeVersion,
                    },
                    isSnapshot: false,
                });
            }
        }
        await redis.set("minecraft:forge", versions, { ex: CACHE_TTL });
        console.log("Forge versions updated in Redis");
        return versions;
    }
    catch (error) {
        console.error("Error fetching Forge versions:", error);
        const cachedData = await redis.get("minecraft:forge");
        return cachedData || [];
    }
}
async function fetchNeoForgeVersions() {
    try {
        const cachedData = await redis.get("minecraft:neoforge");
        if (cachedData) {
            return cachedData;
        }
        // NeoForge versions API
        const neoForgeData = await ky
            .get("https://maven.neoforged.net/api/maven/versions/releases/net/neoforged/neoforge")
            .json();
        const versions = neoForgeData.versions;
        const neoForgeVersions = [];
        for (const version of versions) {
            // Extract MC version from NeoForge version (this is an approximation)
            const mcVersionMatch = version.match(/(\d+\.\d+(?:\.\d+)?)/);
            if (mcVersionMatch) {
                const mcVersion = mcVersionMatch[1];
                const { recommendedJava, supportsDatapacks } = determineJavaAndDatapack(mcVersion);
                neoForgeVersions.push({
                    id: version,
                    type: "release",
                    baseVersion: mcVersion,
                    isStable: true,
                    javaVersions: {
                        minimum: recommendedJava >= 17 ? "17" : "8",
                        maximum: "21",
                        recommended: recommendedJava.toString(),
                    },
                    supportsDatapacks,
                    buildNumbers: {
                        min: version,
                        max: version,
                    },
                    isSnapshot: false,
                });
            }
        }
        await redis.set("minecraft:neoforge", neoForgeVersions, { ex: CACHE_TTL });
        console.log("NeoForge versions updated in Redis");
        return neoForgeVersions;
    }
    catch (error) {
        console.error("Error fetching NeoForge versions:", error);
        const cachedData = await redis.get("minecraft:neoforge");
        return cachedData || [];
    }
}
async function fetchQuiltVersions() {
    try {
        const cachedData = await redis.get("minecraft:quilt");
        if (cachedData) {
            return cachedData;
        }
        // Get Quilt loader versions
        const loaders = await ky
            .get("https://meta.quiltmc.org/v3/versions/loader")
            .json();
        // Get game versions
        const gameVersions = await ky
            .get("https://meta.quiltmc.org/v3/versions/game")
            .json();
        const versions = [];
        for (const version of gameVersions) {
            if (version.stable) {
                const { recommendedJava, supportsDatapacks } = determineJavaAndDatapack(version.version);
                versions.push({
                    id: version.version,
                    type: "release",
                    baseVersion: version.version,
                    isStable: true,
                    javaVersions: {
                        minimum: recommendedJava >= 17 ? "17" : "8",
                        maximum: "21",
                        recommended: recommendedJava.toString(),
                    },
                    supportsDatapacks,
                    loaderVersions: {
                        min: loaders[loaders.length - 1].version,
                        max: loaders[0].version,
                    },
                    isSnapshot: false,
                });
                // Break if we hit 1.7.10 as in the Rust code
                if (version.version === "1.7.10") {
                    break;
                }
            }
        }
        await redis.set("minecraft:quilt", versions, { ex: CACHE_TTL });
        console.log("Quilt versions updated in Redis");
        return versions;
    }
    catch (error) {
        console.error("Error fetching Quilt versions:", error);
        const cachedData = await redis.get("minecraft:quilt");
        return cachedData || [];
    }
}
export { fetchVanillaVersions, fetchPaperVersions, fetchPurpurVersions, fetchFabricVersions, fetchForgeVersions, fetchNeoForgeVersions, fetchQuiltVersions, };
