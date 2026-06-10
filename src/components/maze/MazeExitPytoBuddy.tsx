"use client";

import Image from "next/image";
import { useState } from "react";
import { PYTO_IMAGES, type PytoVariant } from "@/lib/pyto";
import type { MazeExitChallenge } from "@/lib/maze/mazeExitChallenges";
import RichContent from "../RichContent";

export type ExitChallengeFeedback = "idle" | "checking" | "success" | "error";

interface MazeExitPytoBuddyProps {
  challenge: MazeExitChallenge;
  feedback: ExitChallengeFeedback;
}

export default function MazeExitPytoBuddy({
  challenge,
  feedback,
}: MazeExitPytoBuddyProps) {
  const [tipIndex, setTipIndex] = useState(0);

  function getVariant(): PytoVariant {
    if (feedback === "success") return "erfolg";
    if (feedback === "error") return "verwirrt";
    if (feedback === "checking") return "nachdenklich";
    return "froehlich";
  }

  function getMessage(): string {
    if (feedback === "success") {
      return "**Perfekt!** Der Code passt – die Tür geht auf!";
    }
    if (feedback === "error") {
      return "Hmm, die Ausgabe stimmt noch nicht ganz. **Klick mich** für einen Tipp oder prüfe deinen Code nochmal!";
    }
    if (feedback === "checking") {
      return "Ich lasse den **Python-Interpreter** laufen …";
    }
    if (tipIndex > 0) {
      return challenge.tips[Math.min(tipIndex - 1, challenge.tips.length - 1)];
    }
    return "Klick mich, wenn du einen **Tipp** brauchst – gemeinsam kriegen wir das Schloss auf!";
  }

  function handleClick() {
    if (feedback === "checking" || feedback === "success") return;
    setTipIndex((prev) => Math.min(prev + 1, challenge.tips.length));
  }

  const bubbleClass =
    feedback === "success"
      ? "border-success/40 bg-success/5"
      : feedback === "error"
        ? "border-error/40 bg-error/5"
        : feedback === "checking"
          ? "border-primary/30 bg-primary/5"
          : "border-base-300 bg-base-100";

  const canTip = feedback !== "checking" && feedback !== "success";

  return (
    <div className="maze-exit-buddy flex flex-col items-center gap-3 shrink-0 md:w-52">
      <button
        type="button"
        className={`transition-transform ${canTip ? "cursor-pointer hover:scale-105" : "cursor-default"}`}
        onClick={handleClick}
        disabled={!canTip}
        aria-label={canTip ? "Tipp von Pyto" : "Pyto"}
      >
        <Image
          src={PYTO_IMAGES[getVariant()]}
          alt="Pyto"
          width={120}
          height={120}
          className="drop-shadow-lg object-contain"
        />
      </button>
      <div className={`w-full border-2 rounded-2xl rounded-tl-sm px-4 py-3 shadow-md ${bubbleClass}`}>
        <p className="text-xs font-semibold text-primary mb-1">Pyto</p>
        <RichContent content={getMessage()} size="sm" />
        {canTip && tipIndex < challenge.tips.length && tipIndex === 0 && (
          <p className="text-xs opacity-60 mt-2">Tipp {tipIndex}/{challenge.tips.length} · Klicken!</p>
        )}
        {canTip && tipIndex > 0 && tipIndex < challenge.tips.length && (
          <p className="text-xs opacity-60 mt-2">
            Tipp {tipIndex}/{challenge.tips.length}
          </p>
        )}
      </div>
    </div>
  );
}
