"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isLabyrinthUnlocked } from "@/lib/maze/progress";
import { getLessonProgressList } from "@/lib/visitorProgress";

interface LabyrinthGateProps {
  children: React.ReactNode;
}

export default function LabyrinthGate({ children }: LabyrinthGateProps) {
  const [unlocked, setUnlocked] = useState<boolean | null>(null);

  useEffect(() => {
    setUnlocked(isLabyrinthUnlocked(getLessonProgressList()));
  }, []);

  if (unlocked === null) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-5xl mb-4" aria-hidden>
          🔒
        </p>
        <h1 className="text-2xl font-bold mb-3">Labyrinth noch gesperrt</h1>
        <p className="opacity-80 mb-6">
          Schließe zuerst <strong>Lektion 2</strong> ab. Dann kannst du Pyto durch das
          Labyrinth programmieren.
        </p>
        <Link href="/" className="btn btn-primary">
          Zur Startseite
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
