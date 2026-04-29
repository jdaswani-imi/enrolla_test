import { useCallback, useEffect, useRef, useState } from "react";

interface PopoverPos {
  top: number;
  left: number;
}

const MARGIN = 12;

export function useSafePopover() {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<PopoverPos>({ top: 0, left: 0 });

  const computePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const popover = popoverRef.current;
    if (!trigger) return;

    const triggerRect = trigger.getBoundingClientRect();
    const popoverWidth = popover?.offsetWidth ?? 320;
    const popoverHeight = popover?.offsetHeight ?? 420;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Default: align left edge to trigger left, open downward
    let left = triggerRect.left;
    let top = triggerRect.bottom + 6;

    // Clamp right edge
    if (left + popoverWidth > vw - MARGIN) {
      left = triggerRect.right - popoverWidth;
    }
    // Clamp left edge
    if (left < MARGIN) left = MARGIN;

    // Flip above trigger if not enough space below
    if (top + popoverHeight > vh - MARGIN) {
      const topIfAbove = triggerRect.top - popoverHeight - 6;
      if (topIfAbove >= MARGIN) top = topIfAbove;
    }
    // Final top clamp
    if (top < MARGIN) top = MARGIN;

    setPos({ top, left });
  }, []);

  const toggle = useCallback(() => {
    setOpen((prev) => {
      if (!prev) setTimeout(computePosition, 0);
      return !prev;
    });
  }, [computePosition]);

  const close = useCallback(() => setOpen(false), []);

  // Recompute on scroll / resize while open
  useEffect(() => {
    if (!open) return;
    computePosition();
    window.addEventListener("resize", computePosition);
    window.addEventListener("scroll", computePosition, true);
    return () => {
      window.removeEventListener("resize", computePosition);
      window.removeEventListener("scroll", computePosition, true);
    };
  }, [open, computePosition]);

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !popoverRef.current?.contains(target) &&
        !triggerRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return { triggerRef, popoverRef, open, toggle, close, pos };
}
