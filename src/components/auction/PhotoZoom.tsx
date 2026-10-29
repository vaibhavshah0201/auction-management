"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

const MIN = 1;
const MAX = 5;
const STEP = 0.5;

/**
 * Full-screen image lightbox with zoom in/out (buttons + mouse wheel) and
 * drag-to-pan while zoomed. Opened by clicking the player photo.
 */
export function PhotoZoom({
  src,
  alt,
  open,
  onClose,
}: {
  src: string;
  alt: string;
  open: boolean;
  onClose: () => void;
}) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  // Portals only work on the client; wait until mounted.
  useEffect(() => setMounted(true), []);

  // Reset transform whenever the lightbox opens or the image changes.
  useEffect(() => {
    if (open) {
      setScale(1);
      setPos({ x: 0, y: 0 });
    }
  }, [open, src]);

  // Lock page scroll while the lightbox is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") zoom(STEP);
      if (e.key === "-") zoom(-STEP);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function clampScale(s: number) {
    return Math.min(MAX, Math.max(MIN, s));
  }

  function zoom(delta: number) {
    setScale((s) => {
      const next = clampScale(s + delta);
      if (next === 1) setPos({ x: 0, y: 0 });
      return next;
    });
  }

  function reset() {
    setScale(1);
    setPos({ x: 0, y: 0 });
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    zoom(e.deltaY < 0 ? STEP : -STEP);
  }

  function onPointerDown(e: React.PointerEvent) {
    if (scale <= 1) return;
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    setPos((p) => ({ x: p.x + dx, y: p.y + dy }));
  }
  function onPointerUp() {
    dragging.current = false;
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90"
          onClick={onClose}
        >
          {/* Controls */}
          <div
            className="absolute right-4 top-4 z-10 flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <ControlButton
              label="Zoom out"
              onClick={() => zoom(-STEP)}
              disabled={scale <= MIN}
            >
              <ZoomOut size={22} />
            </ControlButton>
            <span className="min-w-[3.5rem] rounded-lg bg-white/10 px-2 py-1.5 text-center text-sm font-bold tabular text-white">
              {Math.round(scale * 100)}%
            </span>
            <ControlButton
              label="Zoom in"
              onClick={() => zoom(STEP)}
              disabled={scale >= MAX}
            >
              <ZoomIn size={22} />
            </ControlButton>
            <ControlButton label="Reset" onClick={reset} disabled={scale === 1}>
              <RotateCcw size={20} />
            </ControlButton>
            <ControlButton label="Close" onClick={onClose}>
              <X size={22} />
            </ControlButton>
          </div>

          <p className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 text-sm text-white/60">
            Scroll to zoom · drag to pan · Esc to close
          </p>

          {/* Image stage */}
          <div
            className="flex h-full w-full items-center justify-center overflow-hidden"
            onWheel={onWheel}
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img
              key={src}
              src={src}
              alt={alt}
              draggable={false}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              style={{
                transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
                cursor: scale > 1 ? "grab" : "default",
                touchAction: "none",
              }}
              className="max-h-full max-w-full select-none object-contain will-change-transform"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function ControlButton({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}
