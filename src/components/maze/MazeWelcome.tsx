"use client";

import type { MazeLevelDef } from "@/lib/maze/types";
import PytoMascot from "../PytoMascot";

interface MazeWelcomeProps {
  level: MazeLevelDef;
  onStart: () => void;
  disabled?: boolean;
}

export default function MazeWelcome({ level, onStart, disabled = false }: MazeWelcomeProps) {
  return (
    <section className="maze-welcome rounded-2xl border-2 border-primary/30 bg-base-100 p-6 sm:p-10 text-center">
      <PytoMascot
        variant="froehlich"
        message={level.greeting}
        size="lg"
        className="mb-8"
      />

      <div className="max-w-md mx-auto mb-8">
        <h2 className="text-xl font-bold mb-2">{level.title}</h2>
        <p className="text-sm opacity-80">{level.description}</p>
      </div>

      <button
        type="button"
        className="btn btn-primary btn-lg"
        onClick={onStart}
        disabled={disabled}
      >
        Spiel starten
      </button>
    </section>
  );
}
