"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Pixel {
  id: number;
  x: number;
  y: number;
  opacity: number;
  age: number;
  color: string;
}

interface PixelCursorTrailProps {
  /** Tamaño base de cada pixel */
  pixelSize?: number;
  /** Longitud máxima del rastro */
  trailLength?: number;
  /** Opacidad inicial de cada pixel */
  maxOpacity?: number;
  /** z-index del layer */
  zIndex?: number;
  className?: string;
}

const DEFAULT_COLORS = [
  "#d4a017",
  "#fbbf24",
  "#b8860b",
  "#fde68a",
  "#92650a",
];

const FADE_SPEED = 0.035;

export function PixelCursorTrail({
  pixelSize = 10,
  trailLength = 36,
  maxOpacity = 0.55,
  zIndex = 0,
  className = "",
}: PixelCursorTrailProps) {
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const pixelIdRef = useRef(0);
  const lastPositionRef = useRef<{ x: number; y: number } | null>(null);
  const animationRef = useRef<number>();

  const createPixel = useCallback(
    (x: number, y: number) => {
      const color = DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)];
      return {
        id: pixelIdRef.current++,
        x,
        y,
        opacity: maxOpacity,
        age: 0,
        color,
      };
    },
    [maxOpacity],
  );

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      const x = e.clientX;
      const y = e.clientY;

      if (!lastPositionRef.current) {
        lastPositionRef.current = { x, y };
        return;
      }

      const dx = x - lastPositionRef.current.x;
      const dy = y - lastPositionRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > pixelSize * 0.85) {
        const newPixel = createPixel(x, y);
        setPixels((prev) => [...prev.slice(-trailLength), newPixel]);
        lastPositionRef.current = { x, y };
      }
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [createPixel, pixelSize, trailLength]);

  useEffect(() => {
    function animate() {
      setPixels((prev) =>
        prev
          .map((pixel) => ({
            ...pixel,
            opacity: pixel.opacity - FADE_SPEED,
            age: pixel.age + 1,
          }))
          .filter((pixel) => pixel.opacity > 0),
      );
      animationRef.current = requestAnimationFrame(animate);
    }

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 overflow-hidden select-none ${className}`}
      style={{ zIndex }}
    >
      {pixels.map((pixel) => {
        const sizeMultiplier = Math.max(0.25, 1 - pixel.age / 90);
        const currentSize = pixelSize * sizeMultiplier;

        return (
          <div
            key={pixel.id}
            className="absolute rounded-[1px]"
            style={{
              left: pixel.x - currentSize / 2,
              top: pixel.y - currentSize / 2,
              width: currentSize,
              height: currentSize,
              opacity: pixel.opacity,
              backgroundColor: pixel.color,
              boxShadow: `0 0 ${currentSize * 1.5}px ${pixel.color}40`,
            }}
          />
        );
      })}
    </div>
  );
}
