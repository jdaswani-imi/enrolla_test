import type { Variants } from "framer-motion";

// Page-level fade + slide up. Used in app-shell for route transitions.
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" } },
  exit:    { opacity: 0, y: -4, transition: { duration: 0.15, ease: "easeIn" } },
};

// Container that staggers its direct children.
export const staggerContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

// Single card / item — fade + slight rise.
export const fadeUpItem: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0,  transition: { duration: 0.22, ease: "easeOut" } },
};

// Sidebar flyout panel — slide in from the left edge.
export const flyoutVariants: Variants = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0,   transition: { duration: 0.15, ease: "easeOut" } },
  exit:    { opacity: 0, x: -10, transition: { duration: 0.1,  ease: "easeIn" } },
};

// Simple opacity-only fade (for elements where motion would feel too much).
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease: "easeOut" } },
  exit:    { opacity: 0, transition: { duration: 0.15, ease: "easeIn" } },
};

// Login panel stagger — left panel content rises in sequence.
export const loginPanelContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

export const loginPanelItem: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};
