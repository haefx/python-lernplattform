"use client";

import type { Flashcard } from "@/lib/types";
import CodeBlock from "./CodeBlock";
import RichContent from "./RichContent";

interface FlipCardProps {
  card: Flashcard;
  flipped: boolean;
  onFlip: () => void;
}

function BulbIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V18a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-3.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm-1 17h2v1a1 1 0 0 1-2 0v-1zm1-15a5 5 0 0 1 5 5c0 1.86-1.01 3.5-2.5 4.38A1 1 0 0 0 14 15v2h-4v-2a1 1 0 0 0-.5-.87C8.01 13.5 7 11.86 7 10a5 5 0 0 1 5-5z" />
    </svg>
  );
}

export default function FlipCard({ card, flipped, onFlip }: FlipCardProps) {
  return (
    <div className="flip-scene w-full">
      <div className={`flip-card-inner ${flipped ? "is-flipped" : ""}`}>
        <div className="flip-card-face flip-card-front card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body justify-between min-h-[28rem]">
            <div>
              <span className="badge badge-outline mb-3">Frage</span>
              <RichContent content={card.question} size="lg" className="font-medium" />
            </div>

            <div className="flex flex-col items-center mt-6">
              <button
                type="button"
                className="btn btn-circle btn-lg btn-warning shadow-lg"
                onClick={onFlip}
                aria-label="Lösung anzeigen – Karte umdrehen"
                title="Lösung anzeigen"
              >
                <BulbIcon className="w-8 h-8" />
              </button>
              <p className="text-center text-xs opacity-50 mt-2">
                Glühbirne = Lösung · Pyto = Tipp
              </p>
            </div>
          </div>
        </div>

        <div className="flip-card-face flip-card-back card bg-base-100 shadow-xl border-2 border-primary">
          <div className="card-body min-h-[28rem] overflow-y-auto">
            <div className="flex items-start justify-between gap-2 mb-3">
              <span className="badge badge-primary">Lösung</span>
              <button
                type="button"
                className="btn btn-circle btn-sm btn-ghost"
                onClick={onFlip}
                aria-label="Zurück zur Frage"
                title="Zurück zur Frage"
              >
                <BulbIcon className="w-5 h-5" />
              </button>
            </div>

            <RichContent content={card.answer} size="lg" className="font-semibold" />

            {card.detail && (
              <RichContent
                content={card.detail}
                size="sm"
                className="mt-4 opacity-95"
              />
            )}

            {card.codeExample && <CodeBlock code={card.codeExample} />}

            {card.learnMoreUrl && (
              <a
                href={card.learnMoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-link btn-sm px-0 mt-4"
              >
                {card.learnMoreLabel ?? "Mehr erfahren"} →
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
