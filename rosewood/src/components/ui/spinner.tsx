"use client";

import { motion } from "framer-motion";

export function Spinner({ size = 18 }: { size?: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
    >
      <path d="M12 2a10 10 0 0 1 10 10" />
    </motion.svg>
  );
}
