"use client";

import type { Direction, MazeRobot } from "@/lib/maze/types";

const DIR_OFFSET: Record<Direction, { dx: number; dy: number }> = {
  0: { dx: 0, dy: -1 },
  1: { dx: 1, dy: 0 },
  2: { dx: 0, dy: 1 },
  3: { dx: -1, dy: 0 },
};

interface MazeDevilLayerProps {
  robot: MazeRobot;
  gridWidth: number;
  gridHeight: number;
  speech?: string | null;
  visible: boolean;
  shaking?: boolean;
}

export default function MazeDevilLayer({
  robot,
  gridWidth,
  gridHeight,
  speech = null,
  visible,
  shaking = false,
}: MazeDevilLayerProps) {
  if (!visible) return null;

  const cellWidth = 100 / gridWidth;
  const cellHeight = 100 / gridHeight;
  const offset = DIR_OFFSET[robot.dir];
  const left = (robot.x + offset.dx * 0.72) * cellWidth;
  const top = (robot.y + offset.dy * 0.72) * cellHeight;

  return (
    <div className="maze-devil-layer" aria-hidden={false}>
      <div
        className="maze-devil-float maze-devil-float--appear"
        style={{
          left: `${left}%`,
          top: `${top}%`,
          width: `${cellWidth * 1.35}%`,
          height: `${cellHeight * 1.35}%`,
        }}
      >
        {speech && (
          <div className="maze-speech-bubble maze-speech-bubble--devil" role="status">
            {speech}
          </div>
        )}
        <span
          className={`maze-devil-sprite${shaking ? " maze-devil-sprite--shake" : ""}`}
          role="img"
          aria-label="Teufel"
        >
          😈
        </span>
      </div>
    </div>
  );
}
