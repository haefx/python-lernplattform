"use client";

import type { CSSProperties } from "react";
import { getCellSymbol, parseLevelGrid } from "@/lib/maze/engine";
import {
  getFloorBackgroundStyle,
  getWallBackgroundStyle,
} from "@/lib/maze/floorTextures";
import type { MazeLevelDef, MazeRobot, MazeRuntimeState } from "@/lib/maze/types";
import { CHARGE_TICKS, LASER_FIRE_TICKS, LEVER_HOLD_TICKS } from "@/lib/maze/types";
import MazeDevilLayer from "./MazeDevilLayer";
import MazeFogLayer from "./MazeFogLayer";
import MazeLaserFxLayer from "./MazeLaserFxLayer";
import MazeRobotLayer from "./MazeRobotLayer";

interface MazeGridProps {
  level: MazeLevelDef;
  state: MazeRuntimeState;
  entranceOpen?: boolean;
  robotOverride?: MazeRobot | null;
  fieldSpeech?: string | null;
  robotAnimate?: boolean;
  storyRobot?: MazeRobot | null;
  devilVisible?: boolean;
  devilSpeech?: string | null;
  laserFx?: {
    target: { x: number; y: number };
    progress: number;
  } | null;
  explodingCell?: { x: number; y: number } | null;
  shaking?: boolean;
  wallBumping?: boolean;
}

export default function MazeGrid({
  level,
  state,
  entranceOpen = false,
  robotOverride = null,
  fieldSpeech = null,
  robotAnimate = true,
  storyRobot = null,
  devilVisible = false,
  devilSpeech = null,
  laserFx = null,
  explodingCell = null,
  shaking = false,
  wallBumping = false,
}: MazeGridProps) {
  const { width, height, entrance } = parseLevelGrid(level);
  const robot = robotOverride ?? state.robot;

  return (
    <div className="maze-grid-stack">
      <div
        className={`maze-grid maze-grid--level-${level.id}${shaking ? " maze-grid--shake" : ""}`}
        style={{
          gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${height}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: height }, (_, y) =>
          Array.from({ length: width }, (_, x) => {
            const key = `${x},${y}`;
            const revealed = state.revealed.has(key);
            const symbol = getCellSymbol(level, x, y, state);
            const isRobotCell = robot.x === x && robot.y === y;
            const isExploding =
              explodingCell?.x === x && explodingCell?.y === y;
            const showContent = revealed || isRobotCell || isExploding;

            let cellClass = "maze-cell";
            if (!showContent) cellClass += " maze-cell--fog";
            else if (symbol === "#") cellClass += " maze-cell--wall";
            else if (symbol === "B" || isExploding) {
              cellClass += isExploding
                ? " maze-cell--brittle maze-cell--brittle-explode"
                : " maze-cell--brittle";
            } else if (symbol === "C") cellClass += " maze-cell--charger";
            else if (symbol === "K") cellClass += " maze-cell--poop";
            else if (symbol === "E") cellClass += " maze-cell--entrance";
            else if (symbol === "F") cellClass += " maze-cell--fake-exit";
            else if (symbol === "G") cellClass += " maze-cell--exit";
            else if (symbol === "🐛") cellClass += " maze-cell--bug";
            else if (symbol === "H" || symbol === "h") cellClass += " maze-cell--lever";
            else if (symbol === "T") cellClass += " maze-cell--door";
            else cellClass += " maze-cell--floor";

            if (isRobotCell) cellClass += " maze-cell--robot";

            const laserTicks =
              state.laserTarget?.x === x && state.laserTarget?.y === y
                ? state.laserFireProgress
                : 0;

            let cellStyle: CSSProperties | undefined;
            if (showContent && !isExploding) {
              if (symbol === "#") {
                cellStyle = getWallBackgroundStyle(x, y, width, height);
              } else {
                cellStyle = getFloorBackgroundStyle(level.id, x, y, width, height);
              }
            }

            return (
              <div key={key} className={cellClass} style={cellStyle}>
                {!showContent ? null : isExploding ? (
                  <span className="maze-brittle-burst" aria-hidden>
                    💥
                  </span>
                ) : symbol === "E" ? (
                  <div
                    className={`maze-gate maze-gate--entrance ${
                      entranceOpen ? "maze-gate--open" : "maze-gate--closed"
                    }`}
                    aria-label={entranceOpen ? "Eingang offen" : "Eingang geschlossen"}
                  >
                    <span className="maze-gate-bars" aria-hidden />
                  </div>
                ) : symbol === "F" ? (
                  <div className="maze-gate maze-gate--exit maze-gate--fake" aria-label="Ausgang?">
                    <span className="maze-gate-arch" aria-hidden />
                    <span className="maze-gate-label">Ausgang?</span>
                  </div>
                ) : symbol === "G" ? (
                  <div className="maze-gate maze-gate--exit" aria-label="Ausgang">
                    <span className="maze-gate-arch" aria-hidden />
                    <span className="maze-gate-label">Ausgang</span>
                  </div>
                ) : symbol === "🐛" ? (
                  <span className="maze-bug-icon" aria-label="Bug">
                    🐛
                  </span>
                ) : symbol === "C" ? (
                  <>
                    <span className="maze-charger-icon" aria-hidden>
                      ⚡
                    </span>
                    {state.chargeProgress > 0 && !state.laserReady ? (
                      <span
                        className="maze-charger-progress"
                        aria-label={`${state.chargeProgress} von ${CHARGE_TICKS} geladen`}
                      >
                        {state.chargeProgress}/{CHARGE_TICKS}
                      </span>
                    ) : state.laserReady && isRobotCell ? (
                      <span className="maze-charger-ready" aria-hidden>
                        ✓
                      </span>
                    ) : null}
                  </>
                ) : symbol === "K" ? (
                  <span className="maze-poop-icon" aria-label="Häufchen">
                    💩
                  </span>
                ) : symbol === "B" ? (
                  <>
                    <span className="maze-brittle-icon" aria-label="Brüchige Mauer">
                      🧱
                    </span>
                    {laserTicks > 0 ? (
                      <span className="maze-laser-charge">{laserTicks}/{LASER_FIRE_TICKS}</span>
                    ) : null}
                  </>
                ) : symbol === "H" ? (
                  <>
                    <span className="maze-lever-icon" aria-hidden>
                      🎚️
                    </span>
                    {(() => {
                      const lever = level.levers?.find((item) => item.x === x && item.y === y);
                      const ticks = lever ? (state.leverHoldProgress[lever.id] ?? 0) : 0;
                      if (ticks <= 0) return null;
                      return (
                        <span
                          className="maze-lever-hold"
                          aria-label={`${ticks} von ${LEVER_HOLD_TICKS} Sekunden`}
                        >
                          {ticks}/{LEVER_HOLD_TICKS}
                        </span>
                      );
                    })()}
                  </>
                ) : symbol === "h" ? (
                  <span className="maze-lever-icon maze-lever-icon--on" aria-hidden>
                    ✅
                  </span>
                ) : symbol === "T" ? (
                  <span className="maze-door-icon" aria-hidden>
                    🚪
                  </span>
                ) : null}
              </div>
            );
          }),
        )}
      </div>

      <MazeFogLayer
        gridWidth={width}
        gridHeight={height}
        revealed={state.revealed}
        robot={robot}
        entrance={entrance}
        entranceOpen={entranceOpen}
        extraVisible={explodingCell}
      />

      {laserFx && (
        <MazeLaserFxLayer
          robot={robot}
          target={laserFx.target}
          gridWidth={width}
          gridHeight={height}
          progress={laserFx.progress}
          maxProgress={LASER_FIRE_TICKS}
        />
      )}

      <MazeRobotLayer
        robot={robot}
        gridWidth={width}
        gridHeight={height}
        fieldSpeech={fieldSpeech}
        laserReady={state.laserReady && !devilVisible}
        animate={robotAnimate}
        shaking={shaking}
        wallBumping={wallBumping}
      />

      {storyRobot && (
        <MazeDevilLayer
          robot={storyRobot}
          gridWidth={width}
          gridHeight={height}
          visible={devilVisible}
          speech={devilSpeech}
          shaking={shaking}
        />
      )}
    </div>
  );
}
