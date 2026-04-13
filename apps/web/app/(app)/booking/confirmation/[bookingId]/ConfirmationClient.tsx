"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

export function ConfirmationClient() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <div className="mb-8 h-32" />;

  return (
    <div className="mb-8 flex justify-center">
      <div className="relative flex h-32 w-32 items-center justify-center">
        {/* Outer pulse rings */}
        {[0, 1, 2].map((_, i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border border-emerald/30"
            initial={{ scale: 0.6, opacity: 0.8 }}
            animate={{ scale: 1.8, opacity: 0 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeOut",
              delay: i * 0.6,
            }}
          />
        ))}

        {/* Glow circle */}
        <motion.div
          className="absolute inset-4 rounded-full bg-emerald/20 blur-xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Icon circle */}
        <motion.div
          className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald shadow-[0_0_32px_rgba(16,185,129,0.60)]"
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
        >
          <CheckCircle className="h-8 w-8 text-white" strokeWidth={2.5} />
        </motion.div>
      </div>
    </div>
  );
}
