"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { MAZE_CODE_EXAMPLES } from "@/lib/maze/examples";

interface MazeCodeBarProps {
  code: string;
  onCodeChange: (code: string) => void;
  onRun: () => void;
  disabled: boolean;
  running: boolean;
  loading: boolean;
}

export default function MazeCodeBar({
  code,
  onCodeChange,
  onRun,
  disabled,
  running,
  loading,
}: MazeCodeBarProps) {
  const [helpOpen, setHelpOpen] = useState(false);
  const helpRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!helpOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (helpRef.current && !helpRef.current.contains(event.target as Node)) {
        setHelpOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [helpOpen]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!disabled && !running && !loading) onRun();
  }

  function applyExample(exampleCode: string) {
    onCodeChange(exampleCode);
    setHelpOpen(false);
  }

  return (
    <div className="maze-code-bar" ref={helpRef}>
      <form onSubmit={handleSubmit} className="maze-code-bar__row">
        <textarea
          rows={3}
          className="textarea textarea-bordered font-mono text-sm maze-code-bar__input"
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!disabled && !running && !loading) onRun();
            }
          }}
          placeholder="vorwaerts()  ·  rechts(2)  ·  links()"
          spellCheck={false}
          disabled={disabled || running}
          aria-label="Python-Code für Pyto"
        />
        <button
          type="submit"
          className="btn btn-primary maze-code-bar__run"
          disabled={disabled || running || loading}
        >
          {loading && <span className="loading loading-spinner loading-sm" />}
          {running ? "Pyto läuft …" : "Jetzt ausführen"}
        </button>
        <button
          type="button"
          className="btn btn-outline maze-code-bar__help"
          onClick={() => setHelpOpen((open) => !open)}
          aria-expanded={helpOpen}
        >
          Hilfe
        </button>
      </form>

      {helpOpen && (
        <div className="maze-help-panel">
          <p className="maze-help-panel__intro">
            Klicke ein Beispiel – der Code wird übernommen. Enter startet Pyto, Shift+Enter
            für eine neue Zeile.
          </p>
          <ul className="maze-help-panel__list">
            {MAZE_CODE_EXAMPLES.map((example) => (
              <li key={example.title}>
                <button
                  type="button"
                  className="maze-help-panel__item"
                  onClick={() => applyExample(example.code)}
                >
                  <span className="maze-help-panel__title">{example.title}</span>
                  <span className="maze-help-panel__desc">{example.description}</span>
                  <code className="maze-help-panel__code">{example.code}</code>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
