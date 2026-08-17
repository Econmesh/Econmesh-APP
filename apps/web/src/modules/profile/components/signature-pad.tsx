"use client";

import { Button } from "@econmesh-app/ui/components/button";
import { useCallback, useEffect, useRef } from "react";

type SignaturePadProps = {
  width?: number;
  height?: number;
  disabled?: boolean;
  onReady?: (exportPng: () => Promise<Blob | null>, clear: () => void, isEmpty: () => boolean) => void;
};

export function SignaturePad({
  width = 480,
  height = 140,
  disabled = false,
  onReady,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const empty = useRef(true);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    empty.current = true;
  }, []);

  const isEmpty = useCallback(() => empty.current, []);

  const exportPng = useCallback(async (): Promise<Blob | null> => {
    const canvas = canvasRef.current;
    if (!canvas || empty.current) return null;
    return await new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png");
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    onReady?.(exportPng, clear, isEmpty);
  }, [clear, exportPng, isEmpty, onReady]);

  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    canvas.setPointerCapture(event.pointerId);
    drawing.current = true;
    const { x, y } = point(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled || !drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = point(event);
    ctx.lineTo(x, y);
    ctx.stroke();
    empty.current = false;
  }

  function handlePointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = false;
    canvasRef.current?.releasePointerCapture(event.pointerId);
  }

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full touch-none rounded-md border bg-white"
        style={{ aspectRatio: `${width} / ${height}` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
      <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={clear}>
        Limpar
      </Button>
    </div>
  );
}
