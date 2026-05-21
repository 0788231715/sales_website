"use client";

import React from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

export default function AboutPage() {
  const { t } = useLanguage();
  return (
    <div className="py-24 px-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-24">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h2 className="text-accent text-sm font-bold tracking-[0.3em] mb-4">{t("about.story_label")}</h2>
          <h1 className="text-5xl font-serif mb-8 leading-tight">{t("about.story_title")} <br /> <span className="italic">{t("about.story_italic")}</span></h1>
          <p className="text-foreground/60 text-lg font-light leading-relaxed mb-8">
            {t("about.story_p")}
          </p>
          <div className="grid grid-cols-2 gap-8">
             <div>
                <span className="block text-4xl font-serif text-accent mb-2">10K+</span>
                <span className="text-sm tracking-widest text-foreground/40 uppercase">{t("about.stat_sold")}</span>
             </div>
             <div>
                <span className="block text-4xl font-serif text-accent mb-2">$5B+</span>
                <span className="text-sm tracking-widest text-foreground/40 uppercase">{t("about.stat_volume")}</span>
             </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative h-[600px] rounded-[3rem] overflow-hidden shadow-glass"
        >
          <img 
            src="https://images.unsplash.com/photo-1577412647305-991150c7d163?q=80&w=1000&auto=format&fit=crop" 
            className="w-full h-full object-cover"
          />
        </motion.div>
      </div>

      {/* Team Section */}
      <section className="text-center py-24">
         <h2 className="text-4xl font-serif mb-16">{t("about.team_title")}</h2>
         <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="group">
                 <div className="h-80 rounded-3xl overflow-hidden mb-6 relative">
                    <img 
                      src={`https://i.pravatar.cc/400?img=${i + 10}`} 
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                    />
                 </div>
                 <h4 className="text-xl font-bold">Agent Name {i}</h4>
                 <p className="text-accent text-sm tracking-widest uppercase">Senior Partner</p>
              </div>
            ))}
         </div>
      </section>
    </div>
  );
}
