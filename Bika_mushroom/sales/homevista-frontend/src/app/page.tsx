"use client";

import React from "react";
import { motion } from "framer-motion";
import { FiSearch, FiMapPin, FiHome, FiTrendingUp } from "react-icons/fi";
import { useLanguage } from "@/context/LanguageContext";

const HeroSection = () => {
  const { t } = useLanguage();
  return (
    <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <motion.div 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5 }}
          className="w-full h-full bg-[url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center"
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-5xl md:text-7xl font-serif text-white mb-6 tracking-tight"
        >
          {t("hero.title")} <br /> <span className="text-accent italic">{t("hero.title_italic")}</span>
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-white/80 text-lg md:text-xl mb-12 font-light tracking-wide"
        >
          {t("hero.subtitle")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/10 backdrop-blur-xl p-2 rounded-2xl border border-white/20 flex flex-col md:flex-row items-center gap-2 max-w-3xl mx-auto shadow-glass"
        >
          <div className="flex-grow flex items-center px-4 py-3 bg-white/5 rounded-xl w-full">
            <FiMapPin className="text-accent mr-3" />
            <input 
              type="text" 
              placeholder={t("hero.placeholder_location")} 
              className="bg-transparent border-none outline-none text-white placeholder-white/50 w-full"
            />
          </div>
          <div className="flex-grow flex items-center px-4 py-3 bg-white/5 rounded-xl w-full">
            <FiHome className="text-accent mr-3" />
            <select className="bg-transparent border-none outline-none text-white w-full appearance-none">
              <option value="">{t("hero.placeholder_type")}</option>
              <option value="villa">Villa</option>
              <option value="apartment">Apartment</option>
              <option value="mansion">Mansion</option>
            </select>
          </div>
          <button className="bg-accent hover:bg-accent-dark text-primary-dark font-bold px-8 py-4 rounded-xl transition-all flex items-center gap-2 w-full md:w-auto">
            <FiSearch /> {t("hero.search")}
          </button>
        </motion.div>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default function Home() {
  const { t } = useLanguage();
  return (
    <div className="bg-background overflow-x-hidden">
      <HeroSection />
      
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-accent text-sm font-bold tracking-[0.3em] mb-4">{t("home.exclusive")}</h2>
            <h3 className="text-4xl md:text-5xl font-serif">{t("home.featured_title")}</h3>
          </motion.div>
          <button className="text-accent border-b border-accent pb-1 hover:text-accent-dark hover:border-accent-dark transition-all hidden md:block">
            {t("home.view_all")}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((item, i) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              whileHover={{ y: -10 }}
              className="group relative bg-primary-dark/5 dark:bg-white/5 rounded-3xl overflow-hidden border border-white/10"
            >
              <div className="relative h-72 overflow-hidden">
                <img 
                  src={`https://images.unsplash.com/photo-1600${58 + item}5154340-be6161a56a0c?q=80&w=1000&auto=format&fit=crop`} 
                  alt="Property" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  <div className="bg-accent text-primary-dark text-xs font-bold px-3 py-1 rounded-full uppercase">
                    FOR SALE
                  </div>
                  {i === 0 && (
                    <motion.div 
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1"
                    >
                      <FiTrendingUp /> TRENDING
                    </motion.div>
                  )}
                </div>
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full"
                >
                  $2,450,000
                </motion.div>
              </div>
              <div className="p-6">
                <h4 className="text-xl font-serif mb-2 group-hover:text-accent transition-colors">The Serenity Villa</h4>
                <div className="flex items-center text-foreground/60 text-sm mb-4">
                  <FiMapPin className="mr-2 text-accent" /> Beverly Hills, CA
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-foreground/10">
                  <div className="flex gap-4">
                    <span className="text-sm font-medium">4 Beds</span>
                    <span className="text-sm font-medium">3 Baths</span>
                    <span className="text-sm font-medium">3,500 sqft</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Suggested for You Section (AI Intelligence Layer) */}
      <section className="py-24 px-6 max-w-7xl mx-auto bg-white/5 rounded-[3rem] my-12 border border-white/5">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div className="text-center md:text-left">
            <h2 className="text-accent text-sm font-bold tracking-[0.3em] mb-4 uppercase">Personalized</h2>
            <h3 className="text-4xl md:text-5xl font-serif">Suggested <span className="text-accent">For You</span></h3>
            <p className="text-foreground/60 mt-4 max-w-lg">Based on your browsing behavior and preferences, our AI found these perfect matches.</p>
          </div>
          <div className="bg-primary-dark/5 p-4 rounded-2xl flex items-center gap-4">
              <div className="p-3 bg-accent/20 rounded-xl text-accent"><FiTrendingUp size={24}/></div>
              <div className="text-sm font-medium">AI Match Rate: <span className="text-accent font-bold">98.4%</span></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((item, i) => (
                <div key={item} className="group cursor-pointer">
                    <div className="relative h-60 rounded-3xl overflow-hidden mb-4">
                        <img 
                            src={`https://images.unsplash.com/photo-1600585154${340 + item}?q=80&w=600&auto=format&fit=crop`} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-primary-dark">
                            SMART MATCH
                        </div>
                    </div>
                    <h5 className="font-serif text-lg mb-1 group-hover:text-accent transition-colors">Oakwood Manor</h5>
                    <p className="text-sm text-foreground/50 flex items-center gap-2"><FiMapPin className="text-accent"/> Portland, OR</p>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-foreground/5">
                        <span className="font-bold text-accent">$850k</span>
                        <span className="text-xs text-foreground/40 italic">92% Match</span>
                    </div>
                </div>
            ))}
        </div>
      </section>

      <section className="py-24 bg-primary-dark text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 blur-[100px] rounded-full -mr-48 -mt-48" />
        <div className="max-w-4xl mx-auto text-center px-6 relative z-10">
          <motion.h2 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-serif mb-8 leading-tight"
          >
            {t("home.cta_title")} <br /> <span className="italic">{t("home.cta_italic")}</span>?
          </motion.h2>
          <p className="text-white/60 text-lg mb-12 font-light">{t("home.cta_subtitle")}</p>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-accent text-primary-dark font-bold px-12 py-5 rounded-full shadow-2xl hover:bg-white transition-colors"
          >
            {t("home.cta_button")}
          </motion.button>
        </div>
      </section>
    </div>
  );
}
