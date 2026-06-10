"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  applyCommand,
  createInitialState,
  findBrittleInBeam,
  parseLevelGrid,
} from "@/lib/maze/engine";
import { playMazeIntro, type MazeIntroPhase } from "@/lib/maze/intro";
import { MAZE_LEVELS, MAZE_WIN_THANKS_SPEECH } from "@/lib/maze/levels";
import {
  getMazeExitChallenge,
  MAZE_EXIT_MODAL_DELAY_MS,
  MAZE_EXIT_SPEECH,
} from "@/lib/maze/mazeExitChallenges";
import { isWallBumpBlock, playWallBumpFeedback } from "@/lib/maze/wallBump";
import { commandDelayMs, expandMazeCommands, MAZE_EXPLOSION_MS, sleep } from "@/lib/maze/animation";
import {
  createPoopEventFlags,
  handlePoopInteractions,
} from "@/lib/maze/level3Poop";
import {
  isMoveCommand,
  LEVEL3_STORY_MOVE_TRIGGER,
  playLevel3Story,
  type Level3DevilState,
} from "@/lib/maze/level3Story";
import {
  createLevel4EventFlags,
  handleLevel4Interactions,
} from "@/lib/maze/level4Events";
import { revealFromPosition } from "@/lib/maze/vision";
import {
  isMazeLevelUnlocked,
  markMazeLevelComplete,
  readMazeProgress,
  resetMazeProgress,
  writeMazeProgress,
  type MazeProgress,
} from "@/lib/maze/progress";
import { submitMazeHighscore } from "@/lib/maze/highscoreClient";
import { runMazePython } from "@/lib/maze/python";
import type { MazeLevelDef, MazeRobot, MazeRuntimeState } from "@/lib/maze/types";
import { LASER_FIRE_TICKS } from "@/lib/maze/types";
import { loadPyodideRuntime } from "@/lib/pyodide";
import { getMazeMedalIcon, getMazeMedalTitle } from "@/lib/achievements";
import AchievementBadge from "@/components/AchievementBadge";
import { scheduleLearnerBoardSync } from "@/lib/learnerSync";
import { PROGRESS_UPDATED_EVENT } from "@/lib/visitorProgress";
import MazeCodeBar from "./MazeCodeBar";
import MazeGrid from "./MazeGrid";
import MazeCelebration from "./MazeCelebration";
import MazeExitChallengeModal from "./MazeExitChallengeModal";
import MazeWelcome from "./MazeWelcome";

const CODE_STORAGE_KEY = "pcep-maze-code";
const CODE_PREVIEW_STORAGE_KEY = "pcep-maze-code-preview";

type RunPhase = "idle" | "loading" | "animating" | "story" | "done";
type GamePhase = "welcome" | "playing";

function getCodeKey(levelId: number, adminPreview: boolean): string {
  const prefix = adminPreview ? CODE_PREVIEW_STORAGE_KEY : CODE_STORAGE_KEY;
  return `${prefix}-${levelId}`;
}

function notifyMazeProgressUpdated(): void {
  scheduleLearnerBoardSync();
  window.dispatchEvent(new Event(PROGRESS_UPDATED_EVENT));
}

interface MazeGameProps {
  adminPreview?: boolean;
}

export default function MazeGame({ adminPreview = false }: MazeGameProps) {
  const [progress, setProgress] = useState<MazeProgress>({ completedLevels: [], lastLevel: 1 });
  const [levelId, setLevelId] = useState(1);
  const [code, setCode] = useState("");
  const [state, setState] = useState<MazeRuntimeState | null>(null);
  const [gamePhase, setGamePhase] = useState<GamePhase>("welcome");
  const [runPhase, setRunPhase] = useState<RunPhase>("idle");
  const [runtimeReady, setRuntimeReady] = useState(false);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [introPhase, setIntroPhase] = useState<MazeIntroPhase>("idle");
  const [entranceOpen, setEntranceOpen] = useState(false);
  const [introRobot, setIntroRobot] = useState<MazeRobot | null>(null);
  const [introSpeech, setIntroSpeech] = useState(false);
  const [celebrationActive, setCelebrationActive] = useState(false);
  const introAbortRef = useRef<AbortController | null>(null);
  const storyAbortRef = useRef<AbortController | null>(null);
  const winTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moveCellsRef = useRef(0);
  const wallHitCountRef = useRef(0);
  const sessionExecuteCountRef = useRef(0);
  const [sessionExecuteCount, setSessionExecuteCount] = useState(0);
  const storyPlayedLevelsRef = useRef<Set<number>>(new Set());
  const [storyShaking, setStoryShaking] = useState(false);
  const [storyPytoSpeech, setStoryPytoSpeech] = useState<string | null>(null);
  const [storyDevil, setStoryDevil] = useState<Level3DevilState>({
    visible: false,
    speech: null,
  });
  const [storyRobot, setStoryRobot] = useState<MazeRobot | null>(null);
  const [laserFx, setLaserFx] = useState<{
    target: { x: number; y: number };
    progress: number;
  } | null>(null);
  const [explodingCell, setExplodingCell] = useState<{ x: number; y: number } | null>(null);
  const [poopSpeech, setPoopSpeech] = useState<string | null>(null);
  const poopFlagsRef = useRef(createPoopEventFlags());
  const [level4Speech, setLevel4Speech] = useState<string | null>(null);
  const level4FlagsRef = useRef(createLevel4EventFlags());
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [exitChallengeSpeech, setExitChallengeSpeech] = useState<string | null>(null);
  const [wallBumpSpeech, setWallBumpSpeech] = useState<string | null>(null);
  const [wallBumping, setWallBumping] = useState(false);

  const level = useMemo(
    () => MAZE_LEVELS.find((item) => item.id === levelId) ?? MAZE_LEVELS[0],
    [levelId],
  );

  const prepareLevel = useCallback((targetLevel: MazeLevelDef) => {
    introAbortRef.current?.abort();
    setIntroPhase("idle");
    setEntranceOpen(false);
    setIntroRobot(null);
    setIntroSpeech(false);
    setState(createInitialState(targetLevel));
    setRunPhase("idle");
    setRunError(null);
    setCelebrationActive(false);
    setGamePhase("welcome");
    moveCellsRef.current = 0;
    wallHitCountRef.current = 0;
    sessionExecuteCountRef.current = 0;
    setSessionExecuteCount(0);
    storyPlayedLevelsRef.current = new Set();
    storyAbortRef.current?.abort();
    setStoryShaking(false);
    setStoryPytoSpeech(null);
    setStoryDevil({ visible: false, speech: null });
    setStoryRobot(null);
    setLaserFx(null);
    setExplodingCell(null);
    setPoopSpeech(null);
    poopFlagsRef.current = createPoopEventFlags();
    setLevel4Speech(null);
    level4FlagsRef.current = createLevel4EventFlags();
    setExitModalOpen(false);
    setExitChallengeSpeech(null);
    setWallBumpSpeech(null);
    setWallBumping(false);
    if (winTimerRef.current) clearTimeout(winTimerRef.current);
  }, []);

  const exitChallenge = useMemo(
    () => getMazeExitChallenge(level.id),
    [level.id],
  );

  const submitLevelScore = useCallback(
    async (executeCount: number) => {
      if (adminPreview || executeCount < 1) return;
      try {
        await submitMazeHighscore(level.id, executeCount);
      } catch {
        // Highscore optional
      }
    },
    [adminPreview, level.id],
  );

  const startIntro = useCallback((targetLevel: MazeLevelDef) => {
    introAbortRef.current?.abort();
    const controller = new AbortController();
    introAbortRef.current = controller;

    setIntroPhase("idle");
    setEntranceOpen(false);
    setIntroRobot(null);
    setIntroSpeech(false);

    void playMazeIntro(
      targetLevel,
      {
        onPhase: setIntroPhase,
        onEntranceOpen: setEntranceOpen,
        onRobot: (robot) => {
          setIntroRobot(robot);
          if (robot) {
            setState((prev) => {
              if (!prev) return prev;
              const { width, height, entrance } = parseLevelGrid(targetLevel);
              return {
                ...prev,
                revealed: revealFromPosition(
                  targetLevel,
                  prev.revealed,
                  robot.x,
                  robot.y,
                  {
                    activatedLevers: prev.activatedLevers,
                    destroyedCells: prev.destroyedCells,
                    entranceClosed: prev.entranceClosed,
                    bugCaught: prev.bugCaught,
                    entrance,
                    width,
                    height,
                  },
                ),
              };
            });
          }
        },
        onSpeech: setIntroSpeech,
      },
      controller.signal,
    ).catch(() => {});
  }, []);

  const handleStartGame = useCallback(() => {
    if (level.comingSoon && !adminPreview) return;
    sessionExecuteCountRef.current = 0;
    setSessionExecuteCount(0);
    setGamePhase("playing");
    const initial = createInitialState(level);
    setState(initial);
    startIntro(level);
  }, [level, adminPreview, startIntro]);

  useEffect(() => {
    const stored = readMazeProgress(adminPreview);
    setProgress(stored);
    setLevelId(stored.lastLevel);
  }, [adminPreview]);

  useEffect(() => {
    const saved = localStorage.getItem(getCodeKey(level.id, adminPreview));
    setCode(saved ?? level.starterCode);
    prepareLevel(level);

    return () => {
      introAbortRef.current?.abort();
    };
  }, [level, prepareLevel, adminPreview]);

  useEffect(() => {
    localStorage.setItem(getCodeKey(level.id, adminPreview), code);
  }, [code, level.id, adminPreview]);

  useEffect(() => {
    loadPyodideRuntime()
      .then(() => {
        setRuntimeReady(true);
        setRuntimeError(null);
      })
      .catch((err) => {
        setRuntimeError(
          err instanceof Error ? err.message : "Python konnte nicht geladen werden.",
        );
      });
  }, []);

  const isLevelSelectable = (target: MazeLevelDef) =>
    !target.comingSoon || adminPreview;

  const introComplete = introPhase === "done";
  const isPlaying = gamePhase === "playing";

  const handleSelectLevel = (id: number) => {
    const target = MAZE_LEVELS.find((item) => item.id === id);
    if (!target || !isLevelSelectable(target)) return;
    if (!isMazeLevelUnlocked(id, progress, adminPreview)) return;
    const next = { ...progress, lastLevel: id };
    setProgress(next);
    writeMazeProgress(next, adminPreview);
    setLevelId(id);
  };

  const handleResetLevel = () => {
    prepareLevel(level);
  };

  const handleResetAll = () => {
    if (
      !window.confirm(
        "Gesamten Labyrinth-Fortschritt zurücksetzen? Abgeschlossene Level werden wieder gesperrt.",
      )
    ) {
      return;
    }
    resetMazeProgress(adminPreview);
    const fresh = readMazeProgress(adminPreview);
    setProgress(fresh);
    setLevelId(1);
  };

  const runLevel3Story = useCallback(async (robot: MazeRobot) => {
    storyAbortRef.current?.abort();
    const controller = new AbortController();
    storyAbortRef.current = controller;
    setStoryRobot(robot);
    setRunPhase("story");

    try {
      await playLevel3Story(
        {
          onShake: setStoryShaking,
          onPytoSpeech: setStoryPytoSpeech,
          onDevil: setStoryDevil,
        },
        controller.signal,
      );
      storyPlayedLevelsRef.current.add(3);
    } catch {
      // abgebrochen
    } finally {
      setStoryShaking(false);
      setStoryPytoSpeech(null);
      setStoryDevil({ visible: false, speech: null });
      setStoryRobot(null);
      setRunPhase("done");
    }
  }, []);

  const handleExitChallengeSolved = useCallback(() => {
    setExitModalOpen(false);
    setState((prev) =>
      prev
        ? {
            ...prev,
            status: "won",
            message: "Geschafft! Pyto hat den Ausgang gefunden!",
          }
        : prev,
    );
    const nextProgress = markMazeLevelComplete(level.id, adminPreview);
    setProgress(nextProgress);
    notifyMazeProgressUpdated();
    void submitLevelScore(sessionExecuteCountRef.current);
    if (winTimerRef.current) clearTimeout(winTimerRef.current);
    winTimerRef.current = setTimeout(() => {
      setCelebrationActive(true);
    }, 3000);
  }, [level.id, adminPreview, submitLevelScore]);

  const handleRun = async () => {
    if (!state || (level.comingSoon && !adminPreview) || !introComplete || !isPlaying) return;
    if (state.status === "won" || state.status === "at_goal") return;
    if (runPhase === "story") return;
    if (exitModalOpen) return;

    sessionExecuteCountRef.current += 1;
    setSessionExecuteCount(sessionExecuteCountRef.current);

    setRunError(null);
    setRunPhase("loading");

    const runStart: MazeRuntimeState = {
      ...state,
      status: "running",
      message: null,
      blockKind: null,
    };

    const { commands, error } = await runMazePython(code);
    if (error) {
      setRunError(error);
      setRunPhase("done");
      return;
    }

    if (commands.length === 0) {
      setRunError("Dein Programm hat keine Befehle ausgeführt.");
      setRunPhase("done");
      return;
    }

    setRunPhase("animating");
    let current: MazeRuntimeState = runStart;
    let prev: MazeRuntimeState = runStart;

    const steps = expandMazeCommands(commands);

    for (const command of steps) {
      const destroyedBefore = current.destroyedCells.size;
      const laserAim =
        command.type === "laser" ? findBrittleInBeam(level, current) : null;

      current = applyCommand(level, current, command);
      setState({ ...current });

      if (command.type === "laser" && laserAim) {
        const wallDestroyed = current.destroyedCells.size > destroyedBefore;
        setLaserFx({
          target: laserAim,
          progress: wallDestroyed ? LASER_FIRE_TICKS : current.laserFireProgress,
        });
      } else if (command.type !== "laser") {
        setLaserFx(null);
      }

      if (isMoveCommand(command)) {
        moveCellsRef.current += 1;
      }

      await sleep(commandDelayMs(command));

      if (level.id === 3) {
        await handlePoopInteractions(
          level,
          prev,
          current,
          poopFlagsRef.current,
          setPoopSpeech,
        );
      }

      if (level.id === 4) {
        const { statePatch } = await handleLevel4Interactions(
          level,
          prev,
          current,
          level4FlagsRef.current,
          setLevel4Speech,
        );
        if (statePatch) {
          current = { ...current, ...statePatch };
          setState({ ...current });
        }
      }
      prev = current;

      if (command.type === "laser") {
        setLaserFx(null);
        const wallDestroyed = current.destroyedCells.size > destroyedBefore;
        if (wallDestroyed && laserAim) {
          setExplodingCell(laserAim);
          await sleep(MAZE_EXPLOSION_MS);
          setExplodingCell(null);
        }
      }

      const shouldTriggerLevel3Story =
        level.id === 3 &&
        !storyPlayedLevelsRef.current.has(3) &&
        moveCellsRef.current >= LEVEL3_STORY_MOVE_TRIGGER;

      if (shouldTriggerLevel3Story) {
        await runLevel3Story(current.robot);
        break;
      }

      if (
        isMoveCommand(command) &&
        current.status === "blocked" &&
        isWallBumpBlock(current.blockKind)
      ) {
        await playWallBumpFeedback(
          wallHitCountRef,
          setWallBumpSpeech,
          setWallBumping,
        );
      }

      if (
        current.status === "blocked" ||
        current.status === "at_goal" ||
        current.status === "won"
      ) {
        break;
      }
    }

    if (current.status === "at_goal" && exitChallenge) {
      setRunPhase("story");
      setExitChallengeSpeech(MAZE_EXIT_SPEECH);
      await sleep(MAZE_EXIT_MODAL_DELAY_MS);
      setExitChallengeSpeech(null);
      setExitModalOpen(true);
    } else if (current.status === "won") {
      const nextProgress = markMazeLevelComplete(level.id, adminPreview);
      setProgress(nextProgress);
      notifyMazeProgressUpdated();
      void submitLevelScore(sessionExecuteCountRef.current);
      if (winTimerRef.current) clearTimeout(winTimerRef.current);
      winTimerRef.current = setTimeout(() => {
        setCelebrationActive(true);
      }, 3000);
    }

    setRunPhase("done");
  };

  useEffect(() => {
    return () => {
      if (winTimerRef.current) clearTimeout(winTimerRef.current);
    };
  }, []);

  const handleCelebrationContinue = () => {
    prepareLevel(level);
  };

  const storyActive = runPhase === "story";

  const fieldSpeech = useMemo(() => {
    if (storyPytoSpeech) return storyPytoSpeech;
    if (exitChallengeSpeech) return exitChallengeSpeech;
    if (wallBumpSpeech) return wallBumpSpeech;
    if (level4Speech) return level4Speech;
    if (poopSpeech) return poopSpeech;
    if (celebrationActive) return MAZE_WIN_THANKS_SPEECH;
    if (introSpeech) return level.introSpeech;
    if (!introComplete) return null;
    if (state?.status === "won" && state.message && !celebrationActive) return state.message;
    if (state?.status === "running" && state.message) return state.message;
    if (state?.status === "blocked" && state.message) return state.message;
    if (runError) return runError;
    return null;
  }, [storyPytoSpeech, exitChallengeSpeech, wallBumpSpeech, level4Speech, poopSpeech, celebrationActive, introSpeech, introComplete, level.introSpeech, state, runError]);

  const robotAnimating =
    runPhase === "animating" ||
    storyActive ||
    (introPhase !== "idle" && introPhase !== "done");

  const codeDisabled =
    (level.comingSoon && !adminPreview) ||
    runPhase === "animating" ||
    storyActive ||
    !introComplete ||
    !isPlaying ||
    state?.status === "won" ||
    state?.status === "at_goal" ||
    exitModalOpen ||
    celebrationActive;

  if (!state) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href={adminPreview ? "/admin" : "/"}
            className="btn btn-ghost btn-sm mb-2"
          >
            {adminPreview ? "← Zurück zum Admin" : "← Zurück zur Startseite"}
          </Link>
          <h1 className="text-3xl font-bold">Pyto&apos;s Labyrinth</h1>
          {!isPlaying && (
            <p className="mt-1 text-sm opacity-80">Wähle ein Level und starte das Abenteuer.</p>
          )}
          {isPlaying && (
            <p className="mt-1 text-sm opacity-80">{level.description}</p>
          )}
        </div>
        {isPlaying && (
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-outline btn-sm" onClick={handleResetLevel}>
              Level zurücksetzen
            </button>
            <button type="button" className="btn btn-outline btn-error btn-sm" onClick={handleResetAll}>
              Alles zurücksetzen
            </button>
          </div>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2 items-center">
        {MAZE_LEVELS.map((item) => {
          const unlocked = isMazeLevelUnlocked(item.id, progress, adminPreview);
          const selectable = isLevelSelectable(item);
          const completed = progress.completedLevels.includes(item.id);
          const active = item.id === levelId;

          return (
            <span key={item.id} className="inline-flex items-center gap-1">
              {completed && selectable && (
                <AchievementBadge
                  icon={getMazeMedalIcon(item.id)}
                  title={getMazeMedalTitle(item.id)}
                  size="sm"
                />
              )}
              <button
                type="button"
                className={`btn btn-sm ${active ? "btn-primary" : "btn-outline"} ${
                  !unlocked || !selectable ? "btn-disabled" : ""
                }`}
                onClick={() => handleSelectLevel(item.id)}
                disabled={!unlocked || !selectable}
              >
                {item.comingSoon
                  ? adminPreview
                    ? `Level ${item.id} (Vorschau)`
                    : `Level ${item.id} (bald)`
                  : `Level ${item.id}`}
                {completed && selectable ? " ✓" : ""}
                {!unlocked && selectable ? " 🔒" : ""}
              </button>
            </span>
          );
        })}
        <button type="button" className="btn btn-sm btn-outline btn-disabled" disabled>
          Level 5 · Coming Soon
        </button>
      </div>

      {gamePhase === "welcome" ? (
        <MazeWelcome
          level={level}
          onStart={handleStartGame}
          disabled={(level.comingSoon && !adminPreview) || !runtimeReady}
        />
      ) : (
        <section className="maze-panel rounded-2xl border-2 border-base-300 p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-bold">{level.title}</h2>

          <MazeCodeBar
            code={code}
            onCodeChange={setCode}
            onRun={handleRun}
            disabled={!runtimeReady || codeDisabled}
            running={runPhase === "animating" || storyActive}
            loading={runPhase === "loading"}
          />

          <p className="mt-2 text-sm opacity-80">
            Ausführen in diesem Versuch: <strong>{sessionExecuteCount}</strong>
          </p>

          {(runtimeError || runError) && (
            <p className="mt-2 text-error text-sm">{runtimeError ?? runError}</p>
          )}
          {!runtimeReady && !runtimeError && (
            <p className="mt-2 text-sm opacity-70">Python wird geladen …</p>
          )}
          {!introComplete && (
            <p className="mt-2 text-sm opacity-70">Intro läuft …</p>
          )}

          <div className="maze-shake-stage">
            <div className="mt-4 maze-board-wrap maze-board-wrap--relative">
              <MazeGrid
                level={level}
                state={state}
                entranceOpen={entranceOpen}
                robotOverride={introRobot}
                fieldSpeech={fieldSpeech}
                robotAnimate={robotAnimating}
                storyRobot={storyRobot}
                devilVisible={storyDevil.visible}
                devilSpeech={storyDevil.speech}
                laserFx={laserFx}
                explodingCell={explodingCell}
                shaking={storyShaking}
                wallBumping={wallBumping}
              />
              {celebrationActive && (
                <MazeCelebration
                  onContinue={handleCelebrationContinue}
                  levelId={level.id}
                  executeCount={sessionExecuteCount}
                  adminPreview={adminPreview}
                />
              )}
            </div>
          </div>

          {exitChallenge && (
            <MazeExitChallengeModal
              open={exitModalOpen}
              challenge={exitChallenge}
              onSolved={handleExitChallengeSolved}
            />
          )}
        </section>
      )}
    </div>
  );
}
