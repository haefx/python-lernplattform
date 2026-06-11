export const BUG_INVENTORY_LINES = [
  "Er ist so schleimig … aber niedlich?",
  "Ich frage mich, womit ich ihn füttern muss?",
  "Na, kleiner? Wie heißt du denn?",
  "Ob es noch mehr von dir gibt? Ich hoffe nicht!",
  "Ein Bug kommt selten allein …",
] as const;

export function getRandomBugInventoryLine(): string {
  const index = Math.floor(Math.random() * BUG_INVENTORY_LINES.length);
  return BUG_INVENTORY_LINES[index] ?? BUG_INVENTORY_LINES[0];
}
