"use client";

import Image from "next/image";
import { PYTO_TOP_VIEW } from "@/lib/pyto";
import type { Direction, MazeRobot } from "@/lib/maze/types";

const DIR_ROTATION: Record<Direction, number> = {
  0: 0,
  1: 90,
  2: 180,
  3: 270,
};

interface MazeRobotLayerProps {
  robot: MazeRobot;
  gridWidth: number;
  gridHeight: number;
  fieldSpeech?: string | null;
  laserReady?: boolean;
  animate?: boolean;
  shaking?: boolean;
  wallBumping?: boolean;
}

export default function MazeRobotLayer({
  robot,
  gridWidth,
  gridHeight,
  fieldSpeech = null,
  laserReady = false,
  animate = true,
  shaking = false,
  wallBumping = false,
}: MazeRobotLayerProps) {
  const cellWidth = 100 / gridWidth;
  const cellHeight = 100 / gridHeight;

  return (
    <div className="maze-robot-layer" aria-hidden={false}>
      <div
        className={`maze-robot-slot${animate ? " maze-robot-slot--animate" : ""}`}
        style={{
          left: `${robot.x * cellWidth}%`,
          top: `${robot.y * cellHeight}%`,
          width: `${cellWidth}%`,
          height: `${cellHeight}%`,
        }}
      >
        <div
          key={wallBumping ? "wall-bump" : "idle"}
          className={`maze-robot-wrap${wallBumping ? " maze-robot-wrap--wall-bump" : ""}`}
        >
          {fieldSpeech && (
            <div className="maze-speech-bubble" role="status">
              {fieldSpeech}
            </div>
          )}
          {laserReady && (
            <span className="maze-laser-ready-badge" aria-label="Laser aufgeladen">
              🔋
            </span>
          )}
          <div
            className={`maze-robot-sprite${animate ? " maze-robot-sprite--animate" : ""}${
              shaking ? " maze-robot-sprite--shake" : ""
            }`}
            style={{ transform: `rotate(${DIR_ROTATION[robot.dir]}deg)` }}
            aria-label="Pyto"
          >
            <span className="maze-robot-glow" aria-hidden />
            <Image
              src={PYTO_TOP_VIEW}
              alt=""
              width={44}
              height={44}
              className="maze-robot-image"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
}
