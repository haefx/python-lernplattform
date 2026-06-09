"use client";

import { useEffect, useRef } from "react";
import { PYTO_LESSON_COMPLETE_VIDEO } from "@/lib/pyto";

interface LessonCompleteModalProps {
  open: boolean;
  lessonTitle: string;
  onClose: () => void;
}

export default function LessonCompleteModal({
  open,
  lessonTitle,
  onClose,
}: LessonCompleteModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      void video.play().catch(() => {});
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
      video?.pause();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="lesson-complete-modal fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lesson-complete-title"
    >
      <button
        type="button"
        className="lesson-complete-backdrop absolute inset-0 bg-black/55 backdrop-blur-sm"
        aria-label="Schließen"
        onClick={onClose}
      />

      <div className="lesson-complete-panel relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border-2 border-base-300 bg-base-100 shadow-2xl">
        <div className="bg-primary/10 px-6 py-5 text-center border-b border-base-300">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Geschafft!
          </p>
          <h2 id="lesson-complete-title" className="text-2xl font-bold mt-1">
            {lessonTitle} abgeschlossen
          </h2>
          <p className="text-sm opacity-70 mt-2">
            Pyto feiert deinen Erfolg mit dir!
          </p>
        </div>

        <div className="bg-base-200 p-4 sm:p-6">
          <div className="lesson-complete-video-wrap mx-auto w-full max-h-[min(50vh,360px)] overflow-hidden rounded-2xl bg-black">
            <video
              ref={videoRef}
              className="lesson-complete-video"
              playsInline
              autoPlay
              muted
            >
              <source src={PYTO_LESSON_COMPLETE_VIDEO} type="video/mp4" />
            </video>
          </div>
        </div>

        <div className="flex justify-center px-6 py-5 border-t border-base-300">
          <button type="button" className="btn btn-primary btn-lg" onClick={onClose}>
            Weiter
          </button>
        </div>
      </div>
    </div>
  );
}
