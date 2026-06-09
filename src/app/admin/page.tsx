"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import type { Exercise, Flashcard, Lesson } from "@/lib/types";
import { linesToMessages, messagesToLines } from "@/lib/pytoTips";
import {
  acknowledgeProgressReset,
  clearVisitorProgressOnly,
} from "@/lib/progressReset";

type AdminTab = "lektionen" | "karten" | "uebungen" | "fortschritt";

const EMPTY_CARD = {
  question: "",
  tip: "",
  tip2Lines: "",
  tip3Lines: "",
  answer: "",
  detail: "",
  codeExample: "",
  learnMoreUrl: "",
  learnMoreLabel: "",
};

const EMPTY_EXERCISE = {
  title: "",
  task: "",
  solution: "",
  notes: "",
  starterCode: "",
  solutionCode: "",
};

function cardToForm(card: Flashcard) {
  return {
    question: card.question,
    tip: card.tip,
    tip2Lines: messagesToLines(card.tip2Messages),
    tip3Lines: messagesToLines(card.tip3Messages),
    answer: card.answer,
    detail: card.detail ?? "",
    codeExample: card.codeExample ?? "",
    learnMoreUrl: card.learnMoreUrl ?? "",
    learnMoreLabel: card.learnMoreLabel ?? "",
  };
}

function cardFormToPayload(values: typeof EMPTY_CARD) {
  const { tip2Lines, tip3Lines, ...rest } = values;
  return {
    ...rest,
    tip2Messages: linesToMessages(tip2Lines),
    tip3Messages: linesToMessages(tip3Lines),
  };
}

function exerciseToForm(exercise: Exercise) {
  return {
    title: exercise.title,
    task: exercise.task,
    solution: exercise.solution,
    notes: exercise.notes ?? "",
    starterCode: exercise.starterCode ?? "",
    solutionCode: exercise.solutionCode ?? "",
  };
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<AdminTab>("lektionen");

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState("");

  const [newLesson, setNewLesson] = useState({ title: "", description: "", pcepTopic: "" });
  const [editLessonId, setEditLessonId] = useState<string | null>(null);
  const [editLesson, setEditLesson] = useState({ title: "", description: "", pcepTopic: "" });

  const [newCard, setNewCard] = useState(EMPTY_CARD);
  const [editCardId, setEditCardId] = useState<string | null>(null);
  const [editCard, setEditCard] = useState(EMPTY_CARD);

  const [newExercise, setNewExercise] = useState(EMPTY_EXERCISE);
  const [editExerciseId, setEditExerciseId] = useState<string | null>(null);
  const [editExercise, setEditExercise] = useState(EMPTY_EXERCISE);

  const [saving, setSaving] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");

  const loadData = useCallback(async () => {
    const res = await fetch("/api/admin/lessons");
    if (res.status === 401) {
      setAuthenticated(false);
      setLoading(false);
      return;
    }
    if (!res.ok) return;
    const data = await res.json();
    setLessons(data.lessons);
    setCards(data.cards);
    setExercises(data.exercises ?? []);
    setAuthenticated(true);
    setLoading(false);
    setSelectedLessonId((prev) => prev || data.lessons[0]?.id || "");
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function adminPost(payload: Record<string, unknown>) {
    setSaving(true);
    const res = await fetch("/api/admin/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) await loadData();
    return res.ok;
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      setError("Falsches Passwort");
      return;
    }
    setPassword("");
    await loadData();
  }

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    setAuthenticated(false);
  }

  async function handleResetProgress() {
    setResetMessage("");
    setResetError("");

    const confirmed = confirm(
      "Alle Lernfortschritte und Lernmonitor-Einträge zurücksetzen?\n\nLektionen, Lernkarten, Übungen und Namen im Monitor bleiben erhalten.",
    );
    if (!confirmed) return;

    const reallyConfirmed = confirm(
      "Letzte Bestätigung: Alle Fortschrittsdaten werden unwiderruflich gelöscht.",
    );
    if (!reallyConfirmed) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/reset-progress", { method: "POST" });
      const data = (await res.json()) as { resetAt?: string; error?: string };

      if (!res.ok) {
        setResetError(data.error ?? "Zurücksetzen fehlgeschlagen.");
        return;
      }

      clearVisitorProgressOnly();
      if (data.resetAt) acknowledgeProgressReset(data.resetAt);

      setResetMessage(
        "Fortschritt zurückgesetzt. Lernmonitor und alle Durchläufe sind auf 0 % – Namen, Lektionen und Karten bleiben bestehen.",
      );
    } catch {
      setResetError("Zurücksetzen fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  const lessonCards = cards
    .filter((c) => c.lessonId === selectedLessonId)
    .sort((a, b) => a.order - b.order);

  const lessonExercises = exercises
    .filter((e) => e.lessonId === selectedLessonId)
    .sort((a, b) => a.order - b.order);

  function startEditCard(card: Flashcard) {
    setEditCardId(card.id);
    setEditCard(cardToForm(card));
    setTab("karten");
  }

  function startEditExercise(exercise: Exercise) {
    setEditExerciseId(exercise.id);
    setEditExercise(exerciseToForm(exercise));
    setTab("uebungen");
  }

  function startEditLesson(lesson: Lesson) {
    setEditLessonId(lesson.id);
    setEditLesson({
      title: lesson.title,
      description: lesson.description,
      pcepTopic: lesson.pcepTopic ?? "",
    });
    setTab("lektionen");
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md">
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            <h1 className="card-title text-2xl">Admin-Zugang</h1>
            <p className="text-sm opacity-70">
              Lektionen, Lernkarten und Übungen verwalten.
            </p>
            <form onSubmit={handleLogin} className="flex flex-col gap-4 mt-4">
              <input
                type="password"
                className="input input-bordered w-full"
                placeholder="Admin-Passwort"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {error && <p className="text-error text-sm">{error}</p>}
              <button type="submit" className="btn btn-primary">Anmelden</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Admin-Bereich</h1>
        <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>
          Abmelden
        </button>
      </div>

      <div role="tablist" className="tabs tabs-boxed mb-6 w-fit">
        {(
          [
            ["lektionen", "Lektionen"],
            ["karten", "Lernkarten"],
            ["uebungen", "Übungen"],
            ["fortschritt", "Fortschritt"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            className={`tab ${tab === id ? "tab-active" : ""}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Lektionen */}
      {tab === "lektionen" && (
        <section className="card bg-base-100 shadow border border-base-300">
          <div className="card-body gap-6">
            <h2 className="card-title">Lektionen</h2>
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Lektion</th>
                    <th>Karten</th>
                    <th>Übungen</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {lessons.map((lesson) => (
                    <tr key={lesson.id}>
                      <td className="font-medium">{lesson.title}</td>
                      <td>{cards.filter((c) => c.lessonId === lesson.id).length}</td>
                      <td>{exercises.filter((e) => e.lessonId === lesson.id).length}</td>
                      <td>
                        {lesson.published ? (
                          <span className="badge badge-success badge-sm">Freigegeben</span>
                        ) : (
                          <span className="badge badge-ghost badge-sm">Entwurf</span>
                        )}
                      </td>
                      <td className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs"
                          onClick={() => startEditLesson(lesson)}
                        >
                          Bearbeiten
                        </button>
                        <button
                          type="button"
                          className={`btn btn-xs ${lesson.published ? "btn-warning" : "btn-primary"}`}
                          onClick={() => adminPost({ action: "toggle-publish", lessonId: lesson.id })}
                        >
                          {lesson.published ? "Zurückziehen" : "Freigeben"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {editLessonId && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const ok = await adminPost({
                    action: "update-lesson",
                    lessonId: editLessonId,
                    ...editLesson,
                  });
                  if (ok) setEditLessonId(null);
                }}
                className="flex flex-col gap-3 p-4 bg-base-200 rounded-xl border border-primary"
              >
                <h3 className="font-semibold">Lektion bearbeiten</h3>
                <input
                  className="input input-bordered input-sm"
                  value={editLesson.title}
                  onChange={(e) => setEditLesson({ ...editLesson, title: e.target.value })}
                  required
                />
                <textarea
                  className="textarea textarea-bordered textarea-sm"
                  value={editLesson.description}
                  onChange={(e) =>
                    setEditLesson({ ...editLesson, description: e.target.value })
                  }
                  required
                />
                <input
                  className="input input-bordered input-sm"
                  placeholder="PCEP-Thema"
                  value={editLesson.pcepTopic}
                  onChange={(e) =>
                    setEditLesson({ ...editLesson, pcepTopic: e.target.value })
                  }
                />
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                    Speichern
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setEditLessonId(null)}
                  >
                    Abbrechen
                  </button>
                </div>
              </form>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const ok = await adminPost({ action: "create-lesson", ...newLesson });
                if (ok) setNewLesson({ title: "", description: "", pcepTopic: "" });
              }}
              className="flex flex-col gap-3 border-t pt-4"
            >
              <h3 className="font-semibold text-sm">Neue Lektion</h3>
              <input
                className="input input-bordered input-sm"
                placeholder="Titel"
                value={newLesson.title}
                onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                required
              />
              <textarea
                className="textarea textarea-bordered textarea-sm"
                placeholder="Beschreibung"
                value={newLesson.description}
                onChange={(e) =>
                  setNewLesson({ ...newLesson, description: e.target.value })
                }
                required
              />
              <input
                className="input input-bordered input-sm"
                placeholder="PCEP-Thema (optional)"
                value={newLesson.pcepTopic}
                onChange={(e) =>
                  setNewLesson({ ...newLesson, pcepTopic: e.target.value })
                }
              />
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                Lektion erstellen
              </button>
            </form>
          </div>
        </section>
      )}

      {/* Lernkarten */}
      {tab === "karten" && (
        <section className="card bg-base-100 shadow border border-base-300">
          <div className="card-body gap-6">
            <h2 className="card-title">Lernkarten</h2>
            <select
              className="select select-bordered select-sm w-full max-w-md"
              value={selectedLessonId}
              onChange={(e) => {
                setSelectedLessonId(e.target.value);
                setEditCardId(null);
              }}
            >
              {lessons.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {lessonCards.map((card, i) => (
                <div
                  key={card.id}
                  className={`flex items-start justify-between gap-2 p-3 rounded-lg text-sm border ${
                    editCardId === card.id
                      ? "border-primary bg-primary/10"
                      : "border-base-300 bg-base-200"
                  }`}
                >
                  <span className="flex-1 min-w-0">
                    <strong>{i + 1}.</strong> {card.question}
                  </span>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      onClick={() => startEditCard(card)}
                    >
                      Bearbeiten
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs text-error"
                      onClick={async () => {
                        if (!confirm("Lernkarte wirklich löschen?")) return;
                        await adminPost({ action: "delete-card", cardId: card.id });
                        if (editCardId === card.id) setEditCardId(null);
                      }}
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              ))}
              {lessonCards.length === 0 && (
                <p className="text-sm opacity-60">Noch keine Karten in dieser Lektion.</p>
              )}
            </div>

            <CardForm
              title={editCardId ? "Karte bearbeiten" : "Neue Lernkarte"}
              values={editCardId ? editCard : newCard}
              onChange={editCardId ? setEditCard : setNewCard}
              onSubmit={async (e) => {
                e.preventDefault();
                if (!selectedLessonId) return;
                const payload = editCardId
                  ? { action: "update-card", cardId: editCardId, ...cardFormToPayload(editCard) }
                  : {
                      action: "create-card",
                      lessonId: selectedLessonId,
                      ...cardFormToPayload(newCard),
                    };
                const ok = await adminPost(payload);
                if (ok) {
                  if (editCardId) setEditCardId(null);
                  else setNewCard(EMPTY_CARD);
                }
              }}
              onCancel={editCardId ? () => setEditCardId(null) : undefined}
              saving={saving}
            />
          </div>
        </section>
      )}

      {/* Übungen */}
      {tab === "uebungen" && (
        <section className="card bg-base-100 shadow border border-base-300">
          <div className="card-body gap-6">
            <h2 className="card-title">Übungsaufgaben</h2>
            <select
              className="select select-bordered select-sm w-full max-w-md"
              value={selectedLessonId}
              onChange={(e) => {
                setSelectedLessonId(e.target.value);
                setEditExerciseId(null);
              }}
            >
              {lessons.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {lessonExercises.map((exercise, i) => (
                <div
                  key={exercise.id}
                  className={`flex items-start justify-between gap-2 p-3 rounded-lg text-sm border ${
                    editExerciseId === exercise.id
                      ? "border-secondary bg-secondary/10"
                      : "border-base-300 bg-base-200"
                  }`}
                >
                  <span className="flex-1 min-w-0">
                    <strong>Übung {i + 1}:</strong> {exercise.title}
                  </span>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      onClick={() => startEditExercise(exercise)}
                    >
                      Bearbeiten
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs text-error"
                      onClick={async () => {
                        if (!confirm("Übung wirklich löschen?")) return;
                        await adminPost({ action: "delete-exercise", exerciseId: exercise.id });
                        if (editExerciseId === exercise.id) setEditExerciseId(null);
                      }}
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              ))}
              {lessonExercises.length === 0 && (
                <p className="text-sm opacity-60">Noch keine Übungen in dieser Lektion.</p>
              )}
            </div>

            <ExerciseForm
              title={editExerciseId ? "Übung bearbeiten" : "Neue Übung"}
              values={editExerciseId ? editExercise : newExercise}
              onChange={editExerciseId ? setEditExercise : setNewExercise}
              onSubmit={async (e) => {
                e.preventDefault();
                if (!selectedLessonId) return;
                const payload = editExerciseId
                  ? { action: "update-exercise", exerciseId: editExerciseId, ...editExercise }
                  : { action: "create-exercise", lessonId: selectedLessonId, ...newExercise };
                const ok = await adminPost(payload);
                if (ok) {
                  if (editExerciseId) setEditExerciseId(null);
                  else setNewExercise(EMPTY_EXERCISE);
                }
              }}
              onCancel={editExerciseId ? () => setEditExerciseId(null) : undefined}
              saving={saving}
            />
          </div>
        </section>
      )}

      {tab === "fortschritt" && (
        <section className="card bg-base-100 shadow border border-error/30">
          <div className="card-body gap-4">
            <h2 className="card-title text-error">Fortschritt zurücksetzen</h2>
            <p className="text-sm opacity-80 leading-relaxed">
              Setzt den <strong>Lernmonitor</strong> und alle gespeicherten{" "}
              <strong>Lernfortschritte</strong> zurück (inkl. Wiederholungen und
              abgeschlossener Karten/Übungen).
            </p>
            <ul className="text-sm opacity-80 list-disc list-inside space-y-1">
              <li>Bleibt erhalten: Lektionen, Lernkarten, Übungen</li>
              <li>Bleibt erhalten: Namen im Lernmonitor</li>
              <li>Bleibt erhalten: Namen der Nutzer auf ihren Geräten</li>
            </ul>
            <p className="text-sm opacity-70">
              Alle Besucher erhalten beim nächsten Seitenaufruf ebenfalls einen
              leeren Fortschritt – ihre Anmeldung mit Namen bleibt bestehen.
            </p>

            {resetMessage && (
              <div className="alert alert-success text-sm">
                <span>{resetMessage}</span>
              </div>
            )}
            {resetError && (
              <div className="alert alert-error text-sm">
                <span>{resetError}</span>
              </div>
            )}

            <div>
              <button
                type="button"
                className="btn btn-error"
                onClick={() => void handleResetProgress()}
                disabled={saving}
              >
                {saving ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  "Alle Fortschritte zurücksetzen"
                )}
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function CardForm({
  title,
  values,
  onChange,
  onSubmit,
  onCancel,
  saving,
}: {
  title: string;
  values: typeof EMPTY_CARD;
  onChange: (v: typeof EMPTY_CARD) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel?: () => void;
  saving: boolean;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className={`flex flex-col gap-3 border-t pt-4 ${onCancel ? "p-4 bg-base-200 rounded-xl border border-primary" : ""}`}
    >
      <h3 className="font-semibold text-sm">{title}</h3>
      <textarea
        className="textarea textarea-bordered textarea-sm"
        placeholder="Frage (Vorderseite)"
        value={values.question}
        onChange={(e) => onChange({ ...values, question: e.target.value })}
        required
      />
      <textarea
        className="textarea textarea-bordered textarea-sm"
        placeholder="Tipp 1 – Haupttipp (Pyto, erster Klick)"
        value={values.tip}
        onChange={(e) => onChange({ ...values, tip: e.target.value })}
        required
      />
      <textarea
        className="textarea textarea-bordered textarea-sm"
        placeholder="Tipp 2 – Varianten (eine Zeile pro Antwort, zufällig)"
        value={values.tip2Lines}
        onChange={(e) => onChange({ ...values, tip2Lines: e.target.value })}
        rows={4}
      />
      <textarea
        className="textarea textarea-bordered textarea-sm"
        placeholder="Tipp 3 – Varianten (eine Zeile pro Antwort, danach schläft Pyto ein)"
        value={values.tip3Lines}
        onChange={(e) => onChange({ ...values, tip3Lines: e.target.value })}
        rows={4}
      />
      <textarea
        className="textarea textarea-bordered textarea-sm"
        placeholder="Kurzantwort (Rückseite)"
        value={values.answer}
        onChange={(e) => onChange({ ...values, answer: e.target.value })}
        required
      />
      <textarea
        className="textarea textarea-bordered textarea-sm"
        placeholder="Ausführliche Erklärung (optional)"
        value={values.detail}
        onChange={(e) => onChange({ ...values, detail: e.target.value })}
      />
      <textarea
        className="textarea textarea-bordered textarea-sm font-mono text-xs"
        placeholder="Code-Beispiel (optional)"
        value={values.codeExample}
        onChange={(e) => onChange({ ...values, codeExample: e.target.value })}
      />
      <input
        className="input input-bordered input-sm"
        placeholder="Link URL (optional)"
        value={values.learnMoreUrl}
        onChange={(e) => onChange({ ...values, learnMoreUrl: e.target.value })}
      />
      <input
        className="input input-bordered input-sm"
        placeholder="Link-Text (optional)"
        value={values.learnMoreLabel}
        onChange={(e) => onChange({ ...values, learnMoreLabel: e.target.value })}
      />
      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
          {onCancel ? "Änderungen speichern" : "Karte hinzufügen"}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
            Abbrechen
          </button>
        )}
      </div>
    </form>
  );
}

function ExerciseForm({
  title,
  values,
  onChange,
  onSubmit,
  onCancel,
  saving,
}: {
  title: string;
  values: typeof EMPTY_EXERCISE;
  onChange: (v: typeof EMPTY_EXERCISE) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel?: () => void;
  saving: boolean;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className={`flex flex-col gap-3 border-t pt-4 ${onCancel ? "p-4 bg-base-200 rounded-xl border border-secondary" : ""}`}
    >
      <h3 className="font-semibold text-sm">{title}</h3>
      <input
        className="input input-bordered input-sm"
        placeholder="Titel der Übung"
        value={values.title}
        onChange={(e) => onChange({ ...values, title: e.target.value })}
        required
      />
      <textarea
        className="textarea textarea-bordered textarea-sm"
        placeholder="Aufgabenstellung"
        value={values.task}
        onChange={(e) => onChange({ ...values, task: e.target.value })}
        required
      />
      <textarea
        className="textarea textarea-bordered textarea-sm"
        placeholder="Lösung & Erklärung"
        value={values.solution}
        onChange={(e) => onChange({ ...values, solution: e.target.value })}
        required
      />
      <textarea
        className="textarea textarea-bordered textarea-sm"
        placeholder="Hinweise / Was beachten? (optional)"
        value={values.notes}
        onChange={(e) => onChange({ ...values, notes: e.target.value })}
      />
      <textarea
        className="textarea textarea-bordered textarea-sm font-mono text-xs"
        placeholder="Startcode für den Editor (optional)"
        value={values.starterCode}
        onChange={(e) => onChange({ ...values, starterCode: e.target.value })}
      />
      <textarea
        className="textarea textarea-bordered textarea-sm font-mono text-xs"
        placeholder="Musterlösung Code (optional)"
        value={values.solutionCode}
        onChange={(e) => onChange({ ...values, solutionCode: e.target.value })}
      />
      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
          {onCancel ? "Änderungen speichern" : "Übung hinzufügen"}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
            Abbrechen
          </button>
        )}
      </div>
    </form>
  );
}
