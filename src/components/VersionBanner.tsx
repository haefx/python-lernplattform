export default function VersionBanner() {
  return (
    <div
      role="status"
      className="bg-info/15 text-info-content border-b border-info/30 px-4 py-2 text-center text-xs sm:text-sm"
    >
      <p>
        <span className="font-semibold">Python Lernplattform Version 0.85</span>
        {" – "}
        <span className="opacity-90">
          Update: Lektion 2 wurde mit weiteren Lernkarten und Übungen erweitert.
          Aufgrund von Überarbeitungen kann es kurz zu technischen Verzögerungen
          kommen.
        </span>
      </p>
    </div>
  );
}
