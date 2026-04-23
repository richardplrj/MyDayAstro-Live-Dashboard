/** Shared motion tuning for a consistent, premium feel across the app. */
export const springSnappy = { type: "spring" as const, stiffness: 440, damping: 30 };
export const springSoft = { type: "spring" as const, stiffness: 280, damping: 24 };
export const easeOut = [0.22, 1, 0.36, 1] as const;

export const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: easeOut },
  },
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
};
