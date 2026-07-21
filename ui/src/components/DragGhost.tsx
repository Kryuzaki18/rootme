import { useEffect, useState, type ReactNode } from "react";

interface DragGhostProps {
  active: boolean;
  children: ReactNode;
  className?: string;
}

export default function DragGhost({ active, children, className }: DragGhostProps) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!active) {
      setPosition(null);
      return;
    }

    const handleDragOver = (event: globalThis.DragEvent) => {
      setPosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener("dragover", handleDragOver);
    return () => window.removeEventListener("dragover", handleDragOver);
  }, [active]);

  if (!active || !position) return null;

  return (
    <div
      className={`pointer-events-none fixed z-50 ${className ?? ""}`}
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -50%) rotate(-6deg)",
      }}
    >
      {children}
    </div>
  );
}
