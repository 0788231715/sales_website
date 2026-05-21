"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiDollarSign, FiPercent, FiCalendar } from "react-icons/fi";

const MortgageCalculator = () => {
  const [p, setP] = useState(500000); // Principal
  const [r, setR] = useState(5);      // Annual Interest Rate
  const [n, setN] = useState(30);     // Years

  const [monthlyPayment, setMonthlyPayment] = useState(0);

  const calculate = () => {
    const monthlyRate = r / 100 / 12;
    const numberOfPayments = n * 12;
    
    if (monthlyRate === 0) {
      setMonthlyPayment(p / numberOfPayments);
      return;
    }

    // M = P [ r(1+r)^n / ((1+r)^n - 1) ]
    const m = p * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    setMonthlyPayment(m);
  };

  useEffect(() => {
    calculate();
  }, [p, r, n]);

  return (
    <div className="glass p-10 rounded-[2.5rem] border border-white/10 shadow-glass max-w-2xl mx-auto">
      <h2 className="text-3xl font-serif mb-8 text-center">Mortgage Calculator</h2>
      
      <div className="space-y-8 mb-10">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium mb-4 text-foreground/60">
            <FiDollarSign className="text-accent" /> LOAN AMOUNT ($)
          </label>
          <input 
            type="range" min="10000" max="10000000" step="10000"
            value={p} onChange={(e) => setP(Number(e.target.value))}
            className="w-full accent-accent bg-white/10 h-2 rounded-lg appearance-none cursor-pointer"
          />
          <div className="mt-4 text-2xl font-serif">${p.toLocaleString()}</div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium mb-4 text-foreground/60">
            <FiPercent className="text-accent" /> INTEREST RATE (%)
          </label>
          <input 
            type="range" min="0.1" max="15" step="0.1"
            value={r} onChange={(e) => setR(Number(e.target.value))}
            className="w-full accent-accent bg-white/10 h-2 rounded-lg appearance-none cursor-pointer"
          />
          <div className="mt-4 text-2xl font-serif">{r}%</div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium mb-4 text-foreground/60">
            <FiCalendar className="text-accent" /> LOAN TERM (YEARS)
          </label>
          <input 
            type="range" min="1" max="50" step="1"
            value={n} onChange={(e) => setN(Number(e.target.value))}
            className="w-full accent-accent bg-white/10 h-2 rounded-lg appearance-none cursor-pointer"
          />
          <div className="mt-4 text-2xl font-serif">{n} Years</div>
        </div>
      </div>

      <div className="bg-accent/10 p-8 rounded-3xl text-center">
        <span className="text-foreground/60 uppercase text-xs tracking-widest block mb-2">Estimated Monthly Payment</span>
        <span className="text-5xl font-serif text-accent">${monthlyPayment.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
      </div>
    </div>
  );
};

export default MortgageCalculator;
