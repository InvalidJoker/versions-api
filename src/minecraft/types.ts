interface JavaVersion {
  minimum: number;
  maximum: number;
  recommended: number; // Always an LTS version
}

interface MinecraftVersion {
  id: string; // Version identifier
  type: "release" | "snapshot";
  baseVersion: string; // Minecraft base version (e.g., "1.19.2")
  isStable: boolean;
  javaVersions: JavaVersion;
  supportsDatapacks: boolean;
  buildNumbers?: {
    min?: number;
    max?: number;
  };
  loaderVersions?: {
    min?: number;
    max?: number;
  };
  isSnapshot: boolean;
}

interface MojangVersion {
  id: string;
  type: string;
  url: string;
  time: string;
  releaseTime: string;
}

interface MojangVersionManifest {
  latest: {
    release: string;
    snapshot: string;
  };
  versions: MojangVersion[];
}

export type { MinecraftVersion, MojangVersion, MojangVersionManifest };
