"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { FiHome, FiUsers, FiTrendingUp, FiActivity, FiLayers } from "react-icons/fi";
import dynamic from "next/dynamic";

const PropertyMap = dynamic(() => import("@/components/ui/PropertyMap"), { ssr: false });

export default function AdminDashboard() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reversalRequests, setReversalRequests] = useState([]);
  const [stats, setStats] = useState({
    totalSales: "$12.4M",
    activeListings: 45,
    pendingApprovals: 3,
    totalUsers: 1205
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [propsRes, bookingsRes] = await Promise.all([
          axios.get("http://localhost:8000/api/properties/"),
          axios.get("http://localhost:8000/api/bookings/", {
             headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
          })
        ]);
        setProperties(propsRes.data);
        setReversalRequests(bookingsRes.data.filter((b: any) => b.owner_request_reversal && b.customer_request_reversal && b.status === 'COMPLETED'));
      } catch (error) {
        console.error("Error fetching admin data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleReverse = async (id: number) => {
     try {
       await axios.post(`http://localhost:8000/api/bookings/${id}/admin_reverse/`, {}, {
         headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
       });
       alert("Transaction Reversed Successfully");
       window.location.reload();
     } catch (error) {
       alert("Error reversing transaction");
     }
  };

  return (
    <div className="py-24 px-6 max-w-7xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-4xl font-serif mb-2">Admin Command Center</h1>
        <p className="text-foreground/60 font-light">Global overview of HomeVista ecosystem.</p>
      </motion.div>

      {/* Reversal Requests Section */}
      {reversalRequests.length > 0 && (
        <div className="mb-12 glass p-8 rounded-[2.5rem] border border-red-500/20 bg-red-500/5">
          <h3 className="text-xl font-serif mb-6 text-red-500 flex items-center gap-2">
            <FiActivity /> Critical: Reversal Requests
          </h3>
          <div className="space-y-4">
            {reversalRequests.map((req: any) => (
              <div key={req.id} className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex items-center gap-4">
                  <img src={req.property_details?.images?.[0]?.image} className="w-16 h-16 rounded-xl object-cover" />
                  <div>
                    <h4 className="font-bold">{req.property_details?.title}</h4>
                    <p className="text-xs text-foreground/40">Buyer: {req.customer_details?.full_name} | Seller: {req.property_details?.owner?.full_name}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                   <button 
                     onClick={() => handleReverse(req.id)}
                     className="bg-red-600 text-white font-bold px-6 py-2 rounded-xl hover:bg-red-700 transition-colors"
                   >
                     APPROVE REVERSAL
                   </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {[
          { label: "Total Revenue", value: stats.totalSales, icon: <FiTrendingUp />, color: "text-green-500" },
          { label: "Active Listings", value: stats.activeListings, icon: <FiHome />, color: "text-blue-500" },
          { label: "Pending Approvals", value: stats.pendingApprovals, icon: <FiActivity />, color: "text-orange-500" },
          { label: "Registered Users", value: stats.totalUsers, icon: <FiUsers />, color: "text-purple-500" },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-6 rounded-3xl border border-white/10"
          >
            <div className={`text-2xl mb-4 ${stat.color}`}>{stat.icon}</div>
            <div className="text-3xl font-serif mb-1">{stat.value}</div>
            <div className="text-sm text-foreground/40 uppercase tracking-widest">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2">
          <div className="glass p-6 rounded-[2.5rem] border border-white/10 h-[600px] relative overflow-hidden">
            <h3 className="text-xl font-serif mb-6 flex items-center gap-2">
              <FiLayers className="text-accent" /> System-Wide Property Map
            </h3>
            <div className="h-[500px]">
               <PropertyMap properties={properties} />
            </div>
          </div>
        </div>

        <div className="glass p-8 rounded-[2.5rem] border border-white/10">
          <h3 className="text-xl font-serif mb-6">Recent Listings</h3>
          <div className="space-y-6">
            {properties.slice(0, 5).map((p: any, i) => (
              <motion.div 
                key={p.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-4 pb-4 border-b border-white/5 last:border-0"
              >
                <img src={p.images?.[0]?.image || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=100&auto=format&fit=crop"} className="w-12 h-12 rounded-xl object-cover" />
                <div>
                  <h4 className="font-bold text-sm truncate w-40">{p.title}</h4>
                  <p className="text-xs text-foreground/40">{p.address}</p>
                </div>
                <div className="ml-auto text-accent font-bold text-xs">
                   ${parseFloat(p.price).toLocaleString()}
                </div>
              </motion.div>
            ))}
          </div>
          <button className="w-full mt-8 text-accent text-sm tracking-widest border-b border-accent pb-1">VIEW ALL APPROVALS</button>
        </div>
      </div>
    </div>
  );
}
