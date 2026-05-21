"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { FiFilter, FiSearch, FiMapPin, FiTrendingUp } from "react-icons/fi";
import Link from "next/link";

export default function PropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/properties/");
        setProperties(response.data);
      } catch (error) {
        console.error("Error fetching properties", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  return (
    <div className="py-24 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-4xl font-serif mb-2">Our Properties</h1>
          <p className="text-foreground/60 font-light">Explore our collection of luxury residences.</p>
        </motion.div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-grow md:w-64">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-accent outline-none"
            />
          </div>
          <button className="p-4 bg-white/5 border border-white/10 rounded-xl hover:text-accent transition-colors">
            <FiFilter />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-96 glass animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {properties.length > 0 ? properties.map((property: any, i: number) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -10 }}
              className="group relative bg-white/5 rounded-3xl overflow-hidden border border-white/10 shadow-lg hover:shadow-2xl transition-all duration-500"
            >
              <Link href={`/properties/${property.id}`}>
                <div className="relative h-72 overflow-hidden">
                  <motion.img 
                    src={property.images?.[0]?.image || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000&auto=format&fit=crop"} 
                    alt={property.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  
                  {/* Status Badge with Animation */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <motion.div 
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className={cn(
                        "text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter",
                        property.status === 'AVAILABLE' ? "bg-green-500 text-white" : "bg-red-500 text-white"
                      )}
                    >
                      {property.status}
                    </motion.div>
                    {property.views > 100 && (
                      <motion.div 
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="bg-accent text-primary-dark text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1"
                      >
                        <FiTrendingUp /> HOT
                      </motion.div>
                    )}
                  </div>

                  {/* Price Animation */}
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-xl text-white text-sm font-bold px-4 py-2 rounded-2xl border border-white/10"
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
                    <div className="flex gap-4 text-foreground/80">
                      <span className="text-sm font-medium">{property.bedrooms} Beds</span>
                      <span className="text-sm font-medium">{property.bathrooms} Baths</span>
                      <span className="text-sm font-medium">{property.size} sqft</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          )) : (
            <div className="col-span-full text-center py-20">
              <p className="text-foreground/40 text-xl font-light">No properties found. <br /> Check back soon for exclusive listings.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
