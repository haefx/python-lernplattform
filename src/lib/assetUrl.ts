const ASSET_VERSION = process.env.NEXT_PUBLIC_ASSET_VERSION ?? "2026061020";

/** Hängt eine Versionsnummer an, damit Browser/Next.js überarbeitete Dateien neu laden. */
export function assetUrl(path: string): string {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}v=${ASSET_VERSION}`;
}

export function getAssetVersion(): string {
  return ASSET_VERSION;
}
