export default function VersionBanner() {
  return (
    <div
      role="status"
      className="bg-info/15 text-info-content border-b border-info/30 px-4 py-2 text-center text-xs sm:text-sm"
    >
      <p>
        <span className="font-semibold">Python Lernplattform Version 0.95</span>
        {" – "}
        <span className="opacity-90">
          Neu: Lektion 3 – Datenstrukturen (Listen, Tupel, Strings) kommt bald!
          Wer Lektion 2 schon geschafft hat, kann weiterhin das Python-Labyrinth
          spielen. Lektion 4 folgt demnächst.
        </span>
      </p>
    </div>
  );
}
