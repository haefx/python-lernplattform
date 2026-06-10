"use client";

const COLORS = ["#f472b6", "#60a5fa", "#34d399", "#fbbf24", "#a78bfa", "#fb7185"];

const PIECES = Array.from({ length: 36 }, (_, index) => ({
  id: index,
  left: `${(index * 17) % 100}%`,
  delay: `${(index % 8) * 0.12}s`,
  duration: `${2.2 + (index % 5) * 0.25}s`,
  color: COLORS[index % COLORS.length],
  size: 6 + (index % 4) * 2,
}));

export default function MazeConfetti() {
  return (
    <div className="maze-confetti" aria-hidden>
      {PIECES.map((piece) => (
        <span
          key={piece.id}
          className="maze-confetti__piece"
          style={{
            left: piece.left,
            animationDelay: piece.delay,
            animationDuration: piece.duration,
            backgroundColor: piece.color,
            width: piece.size,
            height: piece.size * 0.6,
          }}
        />
      ))}
    </div>
  );
}
