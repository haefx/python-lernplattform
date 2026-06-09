"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Flashcard } from "@/lib/types";
import { PYTO_IMAGES, type PytoVariant } from "@/lib/pyto";
import {
  DEFAULT_TIP2_MESSAGES,
  DEFAULT_TIP3_MESSAGES,
  pickRandom,
} from "@/lib/pytoTips";
import RichContent from "./RichContent";

const THINK_MS = 750;
const SLEEP_AFTER_MS = 5000;
const MAX_TIPS = 3;

interface PytoTipBuddyProps {
  card: Flashcard;
  disabled?: boolean;
}

export default function PytoTipBuddy({ card, disabled = false }: PytoTipBuddyProps) {
  const [tipCount, setTipCount] = useState(0);
  const [sleeping, setSleeping] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showLink, setShowLink] = useState(false);
  const [waving, setWaving] = useState(false);
  const sleepTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSleepTimer = useCallback(() => {
    if (sleepTimer.current) {
      clearTimeout(sleepTimer.current);
      sleepTimer.current = null;
    }
  }, []);

  useEffect(() => {
    setTipCount(0);
    setSleeping(false);
    setThinking(false);
    setMessage(null);
    setShowLink(false);
    clearSleepTimer();
  }, [card.id, clearSleepTimer]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!sleeping && !thinking && !disabled) {
        setWaving(true);
        setTimeout(() => setWaving(false), 1200);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [sleeping, thinking, disabled]);

  useEffect(() => clearSleepTimer, [clearSleepTimer]);

  function getVariant(): PytoVariant {
    if (sleeping) return "schlafend";
    if (thinking) return "nachdenklich";
    if (waving) return "froehlich";
    return "froehlich";
  }

  function getIdleMessage(): string {
    if (sleeping) return "Zzz … ich bin im Energiesparmodus. Die nächste Karte weckt mich!";
    if (disabled) return "Dreh die Karte um – dann sehen wir die Lösung!";
    if (tipCount === 0) return "Brauchst du einen Tipp? Klick auf mich!";
    if (tipCount >= MAX_TIPS) return "Keine Tipps mehr – du schaffst das!";
    return "Noch ein Tipp? Klick mich …";
  }

  const displayMessage = message ?? getIdleMessage();

  function handleClick() {
    if (disabled || thinking || sleeping || tipCount >= MAX_TIPS) return;

    setThinking(true);
    setMessage(null);
    setShowLink(false);

    setTimeout(() => {
      const nextCount = tipCount + 1;
      let tipText = "";

      if (nextCount === 1) {
        tipText = card.tip || "Hmm, für diese Frage habe ich gerade keinen Tipp parat.";
      } else if (nextCount === 2) {
        const pool =
          card.tip2Messages && card.tip2Messages.length > 0
            ? card.tip2Messages
            : DEFAULT_TIP2_MESSAGES;
        tipText = pickRandom(pool);
        setShowLink(Boolean(card.learnMoreUrl));
      } else {
        const pool =
          card.tip3Messages && card.tip3Messages.length > 0
            ? card.tip3Messages
            : DEFAULT_TIP3_MESSAGES;
        tipText = pickRandom(pool);
        setShowLink(Boolean(card.learnMoreUrl));
      }

      setTipCount(nextCount);
      setMessage(tipText);
      setThinking(false);

      if (nextCount >= MAX_TIPS) {
        sleepTimer.current = setTimeout(() => {
          setSleeping(true);
          setMessage("Zzz … drei Tipps sind genug für heute. Bis zur nächsten Karte!");
        }, SLEEP_AFTER_MS);
      }
    }, THINK_MS);
  }

  const isClickable = !disabled && !thinking && !sleeping && tipCount < MAX_TIPS;

  return (
    <div className="pyto-buddy flex flex-col items-center gap-3 h-full">
      <button
        type="button"
        className={`pyto-buddy-btn relative transition-transform ${
          isClickable ? "cursor-pointer hover:scale-105" : "cursor-default opacity-90"
        } ${waving ? "pyto-wave" : ""}`}
        onClick={handleClick}
        disabled={!isClickable}
        aria-label={
          sleeping
            ? "Pyto schläft"
            : thinking
              ? "Pyto denkt nach"
              : "Tipp von Pyto anfordern"
        }
        title={isClickable ? "Tipp von Pyto" : undefined}
      >
        <Image
          src={PYTO_IMAGES[getVariant()]}
          alt="Pyto"
          width={140}
          height={140}
          className="drop-shadow-lg object-contain pointer-events-none"
          priority
        />
        {thinking && (
          <span className="absolute -top-1 -right-1 badge badge-neutral badge-sm animate-pulse">
            …
          </span>
        )}
      </button>

      <div className="pyto-bubble-side w-full">
        <div className="bg-base-100 border-2 border-base-300 rounded-2xl rounded-tl-sm px-4 py-3 shadow-md min-h-[5rem]">
          <p className="text-xs font-semibold text-primary mb-1">Pyto</p>
          <RichContent content={displayMessage} size="sm" />
          {showLink && card.learnMoreUrl && tipCount >= 2 && (
            <a
              href={card.learnMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-link btn-xs px-0 mt-2 h-auto min-h-0"
              onClick={(e) => e.stopPropagation()}
            >
              {card.learnMoreLabel ?? "Schau mal hier"} →
            </a>
          )}
          {tipCount > 0 && tipCount < MAX_TIPS && !sleeping && (
            <p className="text-xs opacity-50 mt-2">
              Tipp {tipCount}/{MAX_TIPS}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
