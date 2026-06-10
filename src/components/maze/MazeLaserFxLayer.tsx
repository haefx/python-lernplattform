"use client";

import type { Direction, MazeRobot } from "@/lib/maze/types";

const DIR_OFFSET: Record<Direction, { dx: number; dy: number }> = {
  0: { dx: 0, dy: -1 },
  1: { dx: 1, dy: 0 },
  2: { dx: 0, dy: 1 },
  3: { dx: -1, dy: 0 },
};

interface MazeLaserFxLayerProps {
  robot: MazeRobot;
  target: { x: number; y: number };
  gridWidth: number;
  gridHeight: number;
  progress: number;
  maxProgress: number;
}

export default function MazeLaserFxLayer({
  robot,
  target,
  gridWidth,
  gridHeight,
  progress,
  maxProgress,
}: MazeLaserFxLayerProps) {
  const cellWidth = 100 / gridWidth;
  const cellHeight = 100 / gridHeight;

  const fromX = (robot.x + 0.5) * cellWidth;
  const fromY = (robot.y + 0.5) * cellHeight;
  const toX = (target.x + 0.5) * cellWidth;
  const toY = (target.y + 0.5) * cellHeight;

  const dx = toX - fromX;
  const dy = toY - fromY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const intensity = Math.max(0.35, progress / maxProgress);

  return (
    <div className="maze-laser-fx-layer" aria-hidden>
      <div
        className="maze-laser-beam"
        style={{
          left: `${fromX}%`,
          top: `${fromY}%`,
          width: `${length}%`,
          transform: `rotate(${angle}deg)`,
          opacity: intensity,
        }}
      />
      <div
        className="maze-laser-impact"
        style={{
          left: `${toX}%`,
          top: `${toY}%`,
          opacity: intensity,
        }}
      />
    </div>
  );
}
