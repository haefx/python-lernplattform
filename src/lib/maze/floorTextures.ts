import type { CSSProperties } from "react";
import { assetUrl } from "@/lib/assetUrl";

export const WALL_TEXTURE = assetUrl("/images/boden/wallTexture.jpg");

export function getLevelFloorTexture(levelId: number): string {
  const index = Math.min(Math.max(levelId, 1), 4);
  return assetUrl(`/images/boden/kachel_boden${index}.jpg`);
}

function tilePosition(
  x: number,
  y: number,
  gridWidth: number,
  gridHeight: number,
): Pick<CSSProperties, "backgroundSize" | "backgroundPosition"> {
  const xDenom = Math.max(gridWidth - 1, 1);
  const yDenom = Math.max(gridHeight - 1, 1);

  return {
    backgroundSize: `${gridWidth * 100}% ${gridHeight * 100}%`,
    backgroundPosition: `${(x / xDenom) * 100}% ${(y / yDenom) * 100}%`,
  };
}

export function getFloorBackgroundStyle(
  levelId: number,
  x: number,
  y: number,
  gridWidth: number,
  gridHeight: number,
): CSSProperties {
  return {
    backgroundImage: `url(${getLevelFloorTexture(levelId)})`,
    ...tilePosition(x, y, gridWidth, gridHeight),
  };
}

export function getWallBackgroundStyle(
  x: number,
  y: number,
  gridWidth: number,
  gridHeight: number,
): CSSProperties {
  return {
    backgroundImage: `url(${WALL_TEXTURE})`,
    ...tilePosition(x, y, gridWidth, gridHeight),
  };
}
