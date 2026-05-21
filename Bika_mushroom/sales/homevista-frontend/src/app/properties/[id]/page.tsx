"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { FiMapPin, FiMaximize, FiUser, FiCalendar, FiMessageCircle, FiHeart, FiShare2, FiCheckCircle } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import dynamic from "next/dynamic";

const PropertyMap = dynamic(() => import("@/components/ui/PropertyMap"), { ssr: false });

export default function PropertyDetailPage() {
  const { id } = useParams();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/properties/${id}/`);
        setProperty(response.data);
      } catch (error) {
        console.error("Error fetching property", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id]);

  if (loading) return <div className="py-40 text-center text-2xl font-serif animate-pulse">Loading Luxury Residence...</div>;
  if (!property) return <div className="py-40 text-center text-2xl font-serif">Residence Not Found</div>;

  return (
    <div className="bg-background">
      {/* Image Gallery */}
      <section className="h-[70vh] grid grid-cols-4 grid-rows-2 gap-2 p-2">
        <div className="col-span-2 row-span-2 overflow-hidden rounded-l-3xl relative group">
          <img 
            src={property.images?.[0]?.image || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000&auto=format&fit=crop"} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          {property.status === 'SOLD' && (
            <motion.div 
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: -15 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-red-600/90 text-white font-serif text-6xl px-12 py-4 border-8 border-white shadow-2xl pointer-events-none"
            >
              SOLD
            </motion.div>
          )}
        </div>
        <div className="col-span-1 row-span-1 overflow-hidden relative group">
          <img 
            src={property.images?.[1]?.image || "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?q=80&w=1000&auto=format&fit=crop"} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </div>
        <div className="col-span-1 row-span-1 overflow-hidden rounded-tr-3xl relative group">
           <img 
            src={property.images?.[2]?.image || "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?q=80&w=1000&auto=format&fit=crop"} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </div>
        <div className="col-span-2 row-span-1 overflow-hidden rounded-br-3xl relative group">
           <img 
            src={property.images?.[3]?.image || "https://images.unsplash.com/photo-1600585154526-990dcea4db0d?q=80&w=1000&auto=format&fit=crop"} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <button className="absolute bottom-6 right-6 glass px-6 py-2 rounded-full text-white font-bold flex items-center gap-2">
             <FiMaximize /> VIEW ALL PHOTOS
          </button>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-start mb-8"
          >
            <div>
               <h1 className="text-5xl font-serif mb-4 tracking-tight">{property.title}</h1>
               <div className="flex items-center text-foreground/60 text-lg">
                 <FiMapPin className="text-accent mr-2" /> {property.address}
               </div>
            </div>
            <div className="flex gap-4">
               <motion.button whileHover={{ scale: 1.1 }} className="p-4 glass rounded-full hover:bg-accent/10 transition-colors"><FiHeart /></motion.button>
               <motion.button whileHover={{ scale: 1.1 }} className="p-4 glass rounded-full hover:bg-accent/10 transition-colors"><FiShare2 /></motion.button>
            </div>
          </motion.div>

          <div className="grid grid-cols-3 gap-6 py-8 border-y border-foreground/10 mb-12">
             <div className="text-center">
                <span className="block text-accent text-2xl font-bold">{property.bedrooms}</span>
                <span className="text-foreground/60 uppercase text-xs tracking-widest">Bedrooms</span>
             </div>
             <div className="text-center">
                <span className="block text-accent text-2xl font-bold">{property.bathrooms}</span>
                <span className="text-foreground/60 uppercase text-xs tracking-widest">Bathrooms</span>
             </div>
             <div className="text-center">
                <span className="block text-accent text-2xl font-bold">{property.size}</span>
                <span className="text-foreground/60 uppercase text-xs tracking-widest">Sq Ft</span>
             </div>
          </div>

          <div className="mb-12">
             <h3 className="text-2xl font-serif mb-6">Location</h3>
             <div className="h-[400px] w-full rounded-3xl overflow-hidden border border-white/10 shadow-glass">
                <PropertyMap properties={[property]} />
             </div>
          </div>

          <div className="mb-12">
             <h3 className="text-2xl font-serif mb-6">About this Residence</h3>
             <p className="text-foreground/70 leading-loose font-light text-lg">
               {property.description}
             </p>
          </div>

          <div className="mb-12">
             <h3 className="text-2xl font-serif mb-6">Property Owner</h3>
             <div className="glass p-6 rounded-3xl flex items-center gap-6">
                <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center text-primary-dark font-bold text-xl">
                   {property.owner?.full_name?.[0]}
                </div>
                <div>
                   <h4 className="text-xl font-bold">{property.owner?.full_name}</h4>
                   <p className="text-foreground/60">Elite Property Consultant</p>
                </div>
                <button className="ml-auto bg-primary-dark text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-accent hover:text-primary-dark transition-all">
                   <FiMessageCircle /> CHAT NOW
                </button>
             </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="relative">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="sticky top-32 glass p-8 rounded-[2.5rem] border border-white/10 shadow-glass"
          >
             <div className="mb-8">
                <span className="text-foreground/60 uppercase text-xs tracking-[0.2em] block mb-2">Price</span>
                <motion.span 
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="text-4xl font-serif text-accent"
                >
                  ${parseFloat(property.price).toLocaleString()}
                </motion.span>
             </div>
             
             <div className="space-y-4 mb-8">
                <button className="w-full bg-accent text-primary-dark font-bold py-5 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-transform">
                   <FiCalendar /> BOOK AN APPOINTMENT
                </button>
                <button className="w-full bg-white/5 border border-white/10 text-foreground font-bold py-5 rounded-2xl hover:bg-white/10 transition-colors">
                   MORTGAGE CALCULATOR
                </button>
             </div>

             <div className="bg-primary-dark/5 dark:bg-white/5 p-6 rounded-3xl">
                <div className="flex items-center gap-2 mb-4">
                   <FiCheckCircle className="text-green-500" />
                   <h4 className="font-bold">Verified Listing</h4>
                </div>
                <p className="text-sm text-foreground/60 font-light mb-6">This property has been inspected and approved by HomeVista Elite Team.</p>
                <input 
                  type="text" 
                  placeholder="Your Phone Number" 
                  className="w-full bg-white/10 p-4 rounded-xl mb-4 border border-white/10 outline-none focus:border-accent"
                />
                <button className="w-full text-accent font-bold text-sm tracking-widest border-b border-accent pb-1 hover:text-white hover:border-white transition-all">REQUEST CALLBACK</button>
             </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
