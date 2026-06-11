"use client";

import { useState } from "react";
import Image from "next/image";
import { getRandomBugInventoryLine } from "@/lib/maze/level4Inventory";
import { PYTO_IMAGES } from "@/lib/pyto";

interface MazeBugInventoryProps {
  visible: boolean;
}

export default function MazeBugInventory({ visible }: MazeBugInventoryProps) {
  const [pytoLine, setPytoLine] = useState<string | null>(null);

  if (!visible) return null;

  function handleBugClick() {
    setPytoLine(getRandomBugInventoryLine());
  }

  return (
    <aside className="maze-inventory" aria-label="Inventar">
      <p className="maze-inventory__title">Inventar</p>
      <div className="maze-inventory__grid">
        <div className="maze-inventory__slot maze-inventory__slot--empty" aria-hidden />
        <div className="maze-inventory__slot maze-inventory__slot--empty" aria-hidden />
        <button
          type="button"
          className="maze-inventory__slot maze-inventory__slot--bug"
          onClick={handleBugClick}
          aria-label="Gefangenen Bug ansehen"
          title="Bug antippen"
        >
          <span className="maze-inventory__bug" aria-hidden>
            🐛
          </span>
        </button>
        <div className="maze-inventory__slot maze-inventory__slot--empty" aria-hidden />
      </div>
      {pytoLine && (
        <div className="maze-inventory__pyto">
          <Image
            src={PYTO_IMAGES.nachdenklich}
            alt=""
            width={36}
            height={36}
            className="maze-inventory__pyto-img"
            aria-hidden
          />
          <p className="maze-inventory__pyto-text">
            <span className="font-semibold text-primary">Pyto:</span> {pytoLine}
          </p>
        </div>
      )}
    </aside>
  );
}
