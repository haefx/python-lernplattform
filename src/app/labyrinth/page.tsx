import AdminPreviewShell from "@/components/AdminPreviewShell";
import MazeGame from "@/components/maze/MazeGame";
import LabyrinthGate from "@/components/maze/LabyrinthGate";
import { isAdminAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pyto's Labyrinth | PCEP Lernplattform",
  description: "Steuere Pyto mit Python durch ein Labyrinth mit Fog of War.",
};

export default async function LabyrinthPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const { preview } = await searchParams;
  const adminPreview = preview === "1" && (await isAdminAuthenticated());

  if (adminPreview) {
    return (
      <AdminPreviewShell>
        <MazeGame adminPreview />
      </AdminPreviewShell>
    );
  }

  return (
    <LabyrinthGate>
      <MazeGame />
    </LabyrinthGate>
  );
}
