import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

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
      if (event.clientX === 0 && event.clientY === 0) return;
      setPosition({ x: event.clientX, y: event.clientY });
    };

    const handleDragEnd = () => setPosition(null);

    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDragEnd);
    window.addEventListener("dragend", handleDragEnd);
    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDragEnd);
      window.removeEventListener("dragend", handleDragEnd);
    };
  }, [active]);

  if (!active || !position) return null;

  return createPortal(
    <div
      className={`pointer-events-none fixed z-50 ${className ?? ""}`}
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {children}
    </div>,
    document.body
  );
}
