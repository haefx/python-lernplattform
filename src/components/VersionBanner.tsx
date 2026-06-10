export default function VersionBanner() {
  return (
    <div
      role="status"
      className="bg-info/15 text-info-content border-b border-info/30 px-4 py-2 text-center text-xs sm:text-sm"
    >
      <p>
        <span className="font-semibold">Python Lernplattform Version 0.9</span>
        {" – "}
        <span className="opacity-90">
          Neu: Das Python-Labyrinth-Spiel! Wer Lektion 2 geschafft hat, findet auf
          der Startseite die Belohnung und kann Pyto mit Python-Code steuern.
        </span>
      </p>
    </div>
  );
}
