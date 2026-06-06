"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiSearch, FiMapPin, FiHome, FiTrendingUp, FiArrowRight } from "react-icons/fi";
import { useLanguage } from "@/context/LanguageContext";
import api from "@/utils/api";
import Link from "next/link";

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
          <Link href="/properties" className="bg-accent hover:bg-accent-dark text-primary-dark font-bold px-8 py-4 rounded-xl transition-all flex items-center justify-center gap-2 w-full md:w-auto">
            <FiSearch /> {t("hero.search")}
          </Link>
        </motion.div>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default function Home() {
  const { t } = useLanguage();
  const [featuredProperties, setFeaturedProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.get("/properties/?ordering=-views_count&limit=3");
        setFeaturedProperties(res.data.results || res.data);
      } catch (err) {
        console.error("Error fetching featured properties", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

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
            <h2 className="text-accent text-sm font-bold tracking-[0.3em] mb-4 uppercase">{t("home.exclusive")}</h2>
            <h3 className="text-4xl md:text-5xl font-serif">{t("home.featured_title")}</h3>
          </motion.div>
          <Link href="/properties" className="text-accent border-b border-accent pb-1 hover:text-accent-dark hover:border-accent-dark transition-all hidden md:block font-bold text-xs uppercase tracking-widest">
            {t("home.view_all")}
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {loading ? (
             [1, 2, 3].map((i) => <div key={i} className="h-96 glass animate-pulse rounded-3xl" />)
          ) : (
            featuredProperties.map((property: any, i: number) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                whileHover={{ y: -10 }}
                className="group relative bg-primary-dark/5 dark:bg-white/5 rounded-3xl overflow-hidden border border-white/10"
              >
                <Link href={`/properties/${property.id}`}>
                    <div className="relative h-72 overflow-hidden">
                    <img 
                        src={property.images?.[0]?.image || `https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000&auto=format&fit=crop`} 
                        alt={property.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute top-4 left-4 flex gap-2">
                        <div className="bg-accent text-primary-dark text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                        {property.property_type}
                        </div>
                        {property.views_count > 50 && (
                        <motion.div 
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="bg-rose-500 text-white text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-lg"
                        >
                            <FiTrendingUp /> TRENDING
                        </motion.div>
                        )}
                    </div>
                    <motion.div 
                        whileHover={{ scale: 1.1 }}
                        className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white text-sm font-black px-4 py-2 rounded-2xl border border-white/10"
                    >
                        ${parseFloat(property.price).toLocaleString()}
                    </motion.div>
                    </div>
                    <div className="p-6">
                    <h4 className="text-xl font-serif mb-2 group-hover:text-accent transition-colors">{property.title}</h4>
                    <div className="flex items-center text-foreground/60 text-sm mb-4">
                        <FiMapPin className="mr-2 text-accent" /> {property.address}
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-foreground/10">
                        <div className="flex gap-4 text-foreground/80 text-xs font-bold uppercase tracking-widest">
                        <span>{property.bedrooms} Beds</span>
                        <span>{property.bathrooms} Baths</span>
                        <span>{property.size} sqm</span>
                        </div>
                    </div>
                    </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </section>

      {/* suggested for you left as is or similarly updated if endpoint exists for recommendations */}


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
