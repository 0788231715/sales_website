"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/utils/api";
import { 
  FiFilter, FiSearch, FiMapPin, FiTrendingUp, 
  FiX, FiCheck, FiChevronDown, FiShield, FiHome
} from "react-icons/fi";
import Link from "next/link";

export default function PropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [filters, setFilters] = useState({
    property_type: "",
    min_price: "",
    max_price: "",
    bedrooms: "",
    bathrooms: "",
    ownership_status: "", // To be used for "Verified Only"
    ordering: "-created_at"
  });

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (filters.property_type) params.append("property_type", filters.property_type);
      if (filters.min_price) params.append("min_price", filters.min_price);
      if (filters.max_price) params.append("max_price", filters.max_price);
      if (filters.bedrooms) params.append("bedrooms", filters.bedrooms);
      if (filters.bathrooms) params.append("bathrooms", filters.bathrooms);
      if (filters.ownership_status) params.append("ownership_status", filters.ownership_status);
      if (filters.ordering) params.append("ordering", filters.ordering);

      const response = await api.get(`/properties/?${params.toString()}`);
      const data = response.data.results || response.data;
      setProperties(data);
    } catch (error) {
      console.error("Error fetching properties", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProperties();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, filters]);

  const toggleVerifiedOnly = () => {
    setFilters(prev => ({
        ...prev,
        ownership_status: prev.ownership_status === "VERIFIED" ? "" : "VERIFIED"
    }));
  };

  return (
    <div className="py-24 px-6 max-w-7xl mx-auto min-h-screen bg-background">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-5xl font-serif mb-3 text-foreground tracking-tighter">Marketplace</h1>
          <p className="text-foreground/50 font-medium uppercase tracking-[0.2em] text-xs">Curated Excellence in Real Estate</p>
        </motion.div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="relative w-full sm:w-80">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/30" />
            <input 
              type="text" 
              placeholder="Search estates, cities..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-foreground/5 border border-foreground/10 rounded-2xl focus:border-accent outline-none text-foreground transition-all shadow-inner"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border transition-all font-bold text-xs uppercase tracking-widest ${isFilterOpen ? 'bg-accent text-primary-dark border-accent' : 'bg-foreground/5 border-foreground/10 text-foreground/60 hover:border-accent'}`}
            >
                <FiFilter /> Filters
            </button>
            <select 
                value={filters.ordering}
                onChange={(e) => setFilters({...filters, ordering: e.target.value})}
                className="flex-1 sm:flex-none px-6 py-4 bg-foreground/5 border border-foreground/10 rounded-2xl text-xs font-bold uppercase tracking-widest outline-none focus:border-accent appearance-none text-center"
            >
                <option value="-created_at">Newest First</option>
                <option value="price">Price: Low to High</option>
                <option value="-price">Price: High to Low</option>
                <option value="-views_count">Most Viewed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expanded Filter Panel */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-12"
          >
            <div className="glass p-8 rounded-[2.5rem] border border-foreground/10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-foreground/30 mb-2 block">Listing Type</label>
                    <select 
                        value={filters.property_type}
                        onChange={(e) => setFilters({...filters, property_type: e.target.value})}
                        className="w-full bg-foreground/5 border-none p-3 rounded-xl outline-none text-sm font-bold"
                    >
                        <option value="">All Types</option>
                        <option value="SALE">For Sale</option>
                        <option value="RENT">For Rent</option>
                        <option value="RENT_TO_OWN">Rent to Own</option>
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-foreground/30 mb-2 block">Price Range</label>
                    <div className="flex items-center gap-2">
                        <input 
                            type="number" placeholder="Min" 
                            value={filters.min_price}
                            onChange={(e) => setFilters({...filters, min_price: e.target.value})}
                            className="w-1/2 bg-foreground/5 p-3 rounded-xl text-sm font-bold outline-none" 
                        />
                        <input 
                            type="number" placeholder="Max" 
                            value={filters.max_price}
                            onChange={(e) => setFilters({...filters, max_price: e.target.value})}
                            className="w-1/2 bg-foreground/5 p-3 rounded-xl text-sm font-bold outline-none" 
                        />
                    </div>
                </div>
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-foreground/30 mb-2 block">Bedrooms</label>
                    <select 
                        value={filters.bedrooms}
                        onChange={(e) => setFilters({...filters, bedrooms: e.target.value})}
                        className="w-full bg-foreground/5 border-none p-3 rounded-xl outline-none text-sm font-bold"
                    >
                        <option value="">Any</option>
                        <option value="1">1+</option>
                        <option value="2">2+</option>
                        <option value="3">3+</option>
                        <option value="4">4+</option>
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-foreground/30 mb-2 block">Ownership</label>
                    <button 
                        onClick={toggleVerifiedOnly}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-xs font-bold uppercase tracking-widest ${filters.ownership_status === "VERIFIED" ? 'bg-accent/10 border-accent text-accent' : 'bg-foreground/5 border-transparent text-foreground/40'}`}
                    >
                        <span>Verified Only</span>
                        {filters.ownership_status === "VERIFIED" ? <FiCheck /> : <FiShield />}
                    </button>
                </div>
                <div className="flex items-end">
                    <button 
                        onClick={() => {
                            setFilters({ property_type: "", min_price: "", max_price: "", bedrooms: "", bathrooms: "", ownership_status: "", ordering: "-created_at" });
                            setSearchQuery("");
                        }}
                        className="w-full py-3 text-xs font-black uppercase tracking-widest text-foreground/30 hover:text-rose-500 transition-colors"
                    >
                        Reset All
                    </button>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-[500px] glass animate-pulse rounded-[3rem]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {properties.length > 0 ? properties.map((property: any, i: number) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group bg-white/5 rounded-[3rem] overflow-hidden border border-foreground/5 hover:border-accent/20 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col"
            >
              <Link href={`/properties/${property.id}`} className="flex-1 flex flex-col">
                <div className="relative h-80 overflow-hidden">
                  <motion.img 
                    src={property.images?.[0]?.image || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000&auto=format&fit=crop"} 
                    alt={property.title} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  
                  {/* Status Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />

                  <div className="absolute top-6 left-6 flex flex-col gap-2">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl backdrop-blur-md ${
                        property.status === 'AVAILABLE' ? 'bg-emerald-500/80 text-white' : 
                        property.status === 'UNDER_CONTRACT' ? 'bg-amber-500/80 text-white' : 
                        'bg-rose-500/80 text-white'
                    }`}>
                      {property.status_label || property.status}
                    </span>
                    {property.ownership_status === 'VERIFIED' && (
                        <span className="bg-accent/90 text-primary-dark px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-xl backdrop-blur-md">
                            <FiShield size={12}/> Verified
                        </span>
                    )}
                  </div>

                  <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                    <div>
                        <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Asking Price</p>
                        <p className="text-2xl font-black text-white">${parseFloat(property.price).toLocaleString()}</p>
                    </div>
                    {property.views_count > 50 && (
                        <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl text-white">
                            <FiTrendingUp size={18}/>
                        </div>
                    )}
                  </div>
                </div>

                <div className="p-8">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-2xl font-serif text-foreground group-hover:text-accent transition-colors leading-tight">{property.title}</h4>
                  </div>
                  
                  <div className="flex items-center text-foreground/40 text-xs font-bold uppercase tracking-widest mb-8">
                    <FiMapPin className="mr-2 text-accent" /> {property.address}
                  </div>

                  <div className="grid grid-cols-3 gap-4 py-6 border-y border-foreground/5">
                    <div className="text-center">
                        <p className="text-[10px] font-black text-foreground/30 uppercase mb-1">Beds</p>
                        <p className="font-bold text-foreground">{property.bedrooms}</p>
                    </div>
                    <div className="text-center border-x border-foreground/5 px-2">
                        <p className="text-[10px] font-black text-foreground/30 uppercase mb-1">Baths</p>
                        <p className="font-bold text-foreground">{property.bathrooms}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] font-black text-foreground/30 uppercase mb-1">Size</p>
                        <p className="font-bold text-foreground">{property.size}<span className="text-[10px] ml-0.5">m²</span></p>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between group-hover:px-2 transition-all">
                    <span className="text-[10px] font-black uppercase tracking-widest text-accent">View Details</span>
                    <FiArrowRight className="text-accent opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all" />
                  </div>
                </div>
              </Link>
            </motion.div>
          )) : (
            <div className="col-span-full py-40 text-center border-2 border-dashed border-foreground/10 rounded-[4rem]">
              <FiHome size={64} className="mx-auto text-foreground/10 mb-6" />
              <p className="text-3xl font-serif text-foreground/30 mb-4">No results found</p>
              <p className="text-foreground/40 max-w-sm mx-auto">Try adjusting your filters or search terms to find your perfect estate.</p>
              <button 
                onClick={() => { setFilters({ property_type: "", min_price: "", max_price: "", bedrooms: "", bathrooms: "", ownership_status: "", ordering: "-created_at" }); setSearchQuery(""); }} 
                className="mt-8 bg-foreground/5 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent hover:text-primary-dark transition-all"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Footer Insight */}
      <footer className="mt-20 pt-20 border-t border-foreground/5 text-center">
        <p className="text-foreground/30 text-[10px] font-black uppercase tracking-[0.3em]">HomeVista Asset Management Group</p>
      </footer>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

const FiArrowRight = ({ className }: { className?: string }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14m-7-7 7 7-7 7"/>
    </svg>
);
