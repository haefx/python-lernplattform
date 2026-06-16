import Link from "next/link";
import PcepChallengeClient from "@/components/pcepChallenge/PcepChallengeClient";
import PcepChallengeGate from "@/components/pcepChallenge/PcepChallengeGate";
import VisitorLessonGate from "@/components/VisitorLessonGate";
import { getPcepChallengeQuestions } from "@/lib/pcepChallenge/questions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "PCEP-Challenge | PCEP Lernplattform",
  description:
    "12 zeitgestoppte Prüfungsfragen zur Vorbereitung auf das PCEP-Zertifikat.",
};

export default async function PcepChallengePage() {
  const questions = await getPcepChallengeQuestions();

  return (
    <VisitorLessonGate>
      <PcepChallengeGate>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="breadcrumbs text-sm mb-4">
            <ul>
              <li>
                <Link href="/">Start</Link>
              </li>
              <li>PCEP-Challenge</li>
            </ul>
          </div>

          <header className="mb-8">
            <h1 className="text-3xl font-bold">PCEP-Challenge</h1>
            <p className="opacity-70 mt-2">
              12 Multiple-Choice-Fragen im Prüfungsstil – Zeitmessung von Start bis
              zur letzten richtigen Antwort.
            </p>
          </header>

          <PcepChallengeClient questions={questions} />
        </div>
      </PcepChallengeGate>
    </VisitorLessonGate>
  );
}
