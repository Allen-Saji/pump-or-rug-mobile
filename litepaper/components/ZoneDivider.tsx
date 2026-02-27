"use client";

import { motion } from "framer-motion";

export default function ZoneDivider() {
  return (
    <div className="py-20 sm:py-28 px-4">
      <div className="max-w-content mx-auto">
        <div className="divider-gradient mb-8" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-muted/60">
            Under the Hood
          </span>
          <h2 className="font-heading text-4xl sm:text-5xl font-bold mt-3">
            The <span className="text-accent">Technical</span> Deep Dive
          </h2>
        </motion.div>
        <div className="divider-gradient mt-8" />
      </div>
    </div>
  );
}
