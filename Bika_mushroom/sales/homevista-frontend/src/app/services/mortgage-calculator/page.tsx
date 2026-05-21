"use client";

import React from "react";
import MortgageCalculator from "@/components/ui/MortgageCalculator";
import { motion } from "framer-motion";

export default function MortgagePage() {
  return (
    <div className="py-24 px-6 bg-background min-h-screen">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <div className="text-center mb-16">
          <h1 className="text-5xl font-serif mb-4">Mortgage Calculator</h1>
          <p className="text-foreground/60 font-light">Calculate your monthly payments with precision.</p>
        </div>
        
        <MortgageCalculator />
      </motion.div>
    </div>
  );
}
