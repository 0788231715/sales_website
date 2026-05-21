"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/utils/api";
import { 
  FiEye, 
  FiMessageCircle, 
  FiHeart, 
  FiChevronLeft, 
  FiChevronRight,
  FiMaximize2,
  FiMapPin
} from "react-icons/fi";
import Link from "next/link";

export default function GalleryPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [favorites, setFavorites] = useState<number[]>([]);

  const fetchProperties = async (pageNum: number) => {
    setLoading(true);
    try {
      const response = await api.get(`/properties/?page=${pageNum}`);
      if (response.data.results) {
        setProperties(response.data.results);
        setTotalPages(Math.ceil(response.data.count / 6));
      } else {
        setProperties(response.data);
      }
    } catch (error) {
      console.error("Error fetching properties", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties(page);
  }, [page]);

  const toggleFavorite = (id: number) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  return (
    <main className="min-h-screen pt-32 pb-20 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-5xl font-serif font-bold mb-4 text-foreground">
              Property <span className="italic text-accent">Gallery</span>
            </h1>
            <p className="text-foreground/60 max-w-2xl">
              Immerse yourself in our collection of luxury residences. Every detail captured in high-definition.
            </p>
          </motion.div>

          <div className="flex gap-4">
             <button 
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="p-3 glass rounded-xl disabled:opacity-30 hover:text-accent transition-colors text-foreground"
             >
               <FiChevronLeft size={20} />
             </button>
             <span className="flex items-center font-mono text-sm px-4 text-foreground/60">
                PAGE {page} OF {totalPages}
             </span>
             <button 
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="p-3 glass rounded-xl disabled:opacity-30 hover:text-accent transition-colors text-foreground"
             >
               <FiChevronRight size={20} />
             </button>
          </div>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-[4/3] glass animate-pulse rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="wait">
              {properties.map((property: any, index) => (
                <motion.div
                  key={property.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-background shadow-xl border border-foreground/10"
                >
                  {/* Property Image */}
                  <img 
                    src={property.images?.[0]?.image || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c"} 
                    alt={property.title}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />

                  {/* Top Overlay (Favorite & Info) */}
                  <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-10">
                     <button 
                        onClick={() => toggleFavorite(property.id)}
                        className={`p-3 rounded-2xl backdrop-blur-md transition-all ${favorites.includes(property.id) ? "bg-red-500 text-white" : "bg-black/20 text-white hover:bg-black/40"}`}
                     >
                       <FiHeart size={20} fill={favorites.includes(property.id) ? "currentColor" : "none"} />
                     </button>
                     <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                        <span className="text-white font-black tracking-tighter">
                          {property.currency} {parseFloat(property.price).toLocaleString()}
                        </span>
                     </div>
                  </div>

                  {/* Bottom Overlay (Info & View Full Button) */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8">
                    <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        className="space-y-4"
                    >
                        <div>
                            <h3 className="text-2xl font-serif font-bold text-white mb-1">{property.title}</h3>
                            <p className="text-white/70 text-sm flex items-center gap-2">
                                <FiMapPin className="text-accent" /> {property.address}
                            </p>
                        </div>

                        <div className="flex items-center gap-6 py-4 border-y border-white/10">
                            <div className="flex items-center gap-2 text-white/90">
                                <FiEye size={18} className="text-accent" />
                                <span className="text-xs font-bold">{property.views_count}</span>
                            </div>
                            <div className="flex items-center gap-2 text-white/90">
                                <FiMessageCircle size={18} className="text-accent" />
                                <span className="text-xs font-bold">{property.review_count}</span>
                            </div>
                            <div className="flex gap-4 ml-auto text-white/60 text-[10px] font-bold uppercase tracking-widest">
                                <span>{property.bedrooms} BD</span>
                                <span>{property.bathrooms} BA</span>
                            </div>
                        </div>

                        <Link 
                            href={`/properties/${property.id}`}
                            className="w-full py-4 bg-accent text-primary-dark rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
                        >
                            <FiMaximize2 size={18} /> VIEW FULL DETAILS
                        </Link>
                    </motion.div>
                  </div>

                  {/* Static Info (Visible when not hovered) */}
                  <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center group-hover:opacity-0 transition-opacity duration-300">
                     <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex gap-4">
                        <div className="flex items-center gap-2 text-white text-xs font-bold">
                            <FiEye size={14} /> {property.views_count}
                        </div>
                        <div className="flex items-center gap-2 text-white text-xs font-bold">
                            <FiMessageCircle size={14} /> {property.review_count}
                        </div>
                     </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {!loading && properties.length === 0 && (
          <div className="text-center py-40">
             <p className="text-3xl font-serif text-foreground/20 italic">No properties in our collection yet.</p>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
            <div className="mt-16 flex justify-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-12 h-12 rounded-xl font-bold transition-all ${page === p ? "bg-accent text-primary-dark" : "glass hover:text-accent text-foreground"}`}
                    >
                        {p}
                    </button>
                ))}
            </div>
        )}
      </div>
    </main>
  );
}
