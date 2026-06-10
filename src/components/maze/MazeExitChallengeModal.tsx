"use client";

import { useCallback, useEffect, useState } from "react";
import { formatPythonError } from "@/lib/pythonErrors";
import { loadPyodideRuntime, runPythonCode } from "@/lib/pyodide";
import {
  validateMazeExitChallenge,
  type MazeExitChallenge,
} from "@/lib/maze/mazeExitChallenges";
import RichContent from "../RichContent";
import MazeExitPytoBuddy, { type ExitChallengeFeedback } from "./MazeExitPytoBuddy";

interface MazeExitChallengeModalProps {
  open: boolean;
  challenge: MazeExitChallenge;
  onSolved: () => void;
}

export default function MazeExitChallengeModal({
  open,
  challenge,
  onSolved,
}: MazeExitChallengeModalProps) {
  const [code, setCode] = useState(challenge.starterCode);
  const [output, setOutput] = useState("");
  const [feedback, setFeedback] = useState<ExitChallengeFeedback>("idle");
  const [runtimeReady, setRuntimeReady] = useState(false);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCode(challenge.starterCode);
    setOutput("");
    setFeedback("idle");
  }, [open, challenge]);

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

  const handleRun = useCallback(async () => {
    setBusy(true);
    setFeedback("checking");
    setOutput("");

    try {
      if (!runtimeReady) {
        await loadPyodideRuntime();
        setRuntimeReady(true);
      }

      const result = await runPythonCode(code);
      const lines: string[] = [];
      if (result.stdout) lines.push(result.stdout);
      if (result.stderr) lines.push(result.stderr);
      if (result.error) lines.push(`Fehler: ${result.error}`);
      const text = lines.join("\n") || "(Keine Ausgabe)";
      setOutput(text);

      const ok = validateMazeExitChallenge(challenge, result.stdout, result.error);
      if (ok) {
        setFeedback("success");
        setTimeout(() => onSolved(), 1200);
      } else {
        setFeedback("error");
      }
    } catch (err) {
      setOutput(`Fehler: ${formatPythonError(err)}`);
      setFeedback("error");
    } finally {
      setBusy(false);
    }
  }, [challenge, code, onSolved, runtimeReady]);

  if (!open) return null;

  return (
    <div className="maze-exit-modal" role="dialog" aria-modal="true" aria-labelledby="maze-exit-title">
      <div className="maze-exit-modal__backdrop" aria-hidden />
      <div className="maze-exit-modal__panel">
        <h2 id="maze-exit-title" className="text-xl font-bold mb-1">
          Ausgang gesperrt – {challenge.title}
        </h2>
        <p className="text-sm opacity-75 mb-4">
          Löse die Python-Aufgabe, damit Pyto das Level wirklich abschließen kann.
        </p>

        <div className="flex flex-col md:flex-row gap-5 items-start">
          <div className="flex-1 min-w-0 flex flex-col gap-3">
            <div className="rounded-xl border border-base-300 bg-base-200/40 p-4">
              <RichContent content={challenge.task} size="sm" />
            </div>

            {runtimeError && (
              <p className="text-error text-sm">{runtimeError}</p>
            )}

            <textarea
              className="textarea textarea-bordered w-full font-mono text-sm min-h-[9rem] leading-relaxed"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              disabled={busy || feedback === "success"}
              aria-label="Python-Code für die Ausgangs-Aufgabe"
            />

            <div>
              <p className="text-xs font-semibold uppercase opacity-60 mb-1">Ausgabe</p>
              <pre className="code-block text-sm min-h-[3.5rem] max-h-40 overflow-auto rounded-lg p-3">
                <code>{output || "Hier erscheint die Ausgabe nach dem Prüfen."}</code>
              </pre>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void handleRun()}
                disabled={busy || !!runtimeError || feedback === "success"}
              >
                {busy && <span className="loading loading-spinner loading-sm" />}
                {feedback === "success" ? "Tür öffnet sich …" : "Prüfen"}
              </button>
            </div>
          </div>

          <MazeExitPytoBuddy challenge={challenge} feedback={feedback} />
        </div>
      </div>
    </div>
  );
}
