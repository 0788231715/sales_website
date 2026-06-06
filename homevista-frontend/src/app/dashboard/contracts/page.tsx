"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { 
  FiFileText, FiDownload, FiEye, FiCheckCircle, 
  FiClock, FiSearch, FiFilter, FiArrowRight
} from "react-icons/fi";
import Link from "next/link";

export default function ContractManagementCenter() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'signed'>('all');
  const [searchQuery, setSearchQuery] = useState("");

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/legal/contracts/");
      setContracts(res.data.results || res.data);
    } catch (error) {
      console.error("Error fetching contracts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchContracts();
  }, [user]);

  const filteredContracts = contracts.filter((c) => {
    const matchesTab = activeTab === 'all' || 
                       (activeTab === 'pending' && c.status === 'PENDING_SIGNATURES') || 
                       (activeTab === 'signed' && c.status === 'SIGNED');
    const matchesSearch = c.booking_details?.property_details?.title?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pt-24 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-4xl font-serif mb-2">Contract Management</h1>
            <p className="text-foreground/50">Access and manage all your legal agreements and property contracts.</p>
          </div>
        </header>

        {/* Search & Tabs */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-8 mb-12">
          <div className="flex gap-8 border-b border-foreground/10 w-full lg:w-auto">
            {(['all', 'pending', 'signed'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 px-2 font-bold tracking-[0.2em] uppercase text-[10px] transition-all relative ${activeTab === tab ? "text-accent" : "text-foreground/40 hover:text-foreground"}`}
              >
                {tab} Contracts
                {activeTab === tab && (
                  <motion.div layoutId="activeContractTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
                )}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-96">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/30" />
            <input 
              type="text" 
              placeholder="Search by property name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-foreground/5 border border-foreground/10 rounded-2xl py-4 pl-12 pr-6 outline-none focus:border-accent transition-all text-sm font-medium"
            />
          </div>
        </div>

        {/* Contract Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredContracts.map((contract) => (
            <motion.div 
              key={contract.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-8 rounded-[3rem] border border-foreground/10 flex flex-col justify-between hover:border-accent/30 transition-all group"
            >
              <div>
                <div className="flex justify-between items-start mb-8">
                  <div className="p-4 bg-accent/10 text-accent rounded-2xl group-hover:scale-110 transition-transform">
                    <FiFileText size={24} />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${
                    contract.status === 'SIGNED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {contract.status}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold mb-2 group-hover:text-accent transition-colors">{contract.booking_details?.property_details?.title}</h3>
                <p className="text-xs text-foreground/40 font-bold uppercase tracking-[0.2em] mb-6">Agreement v{contract.version}</p>
                
                <div className="space-y-3 mb-8">
                  <div className="flex justify-between text-xs">
                    <span className="text-foreground/40 font-bold uppercase">Price</span>
                    <span className="font-black">${parseFloat(contract.booking_details?.total_price || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-foreground/40 font-bold uppercase">Date</span>
                    <span className="font-black">{new Date(contract.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Link href={`/contracts/${contract.id}`} className="flex-1 py-4 bg-accent text-primary-dark rounded-2xl font-bold text-[10px] uppercase tracking-widest text-center hover:scale-[1.02] transition-all shadow-lg shadow-accent/20">
                  {contract.status === 'SIGNED' ? 'View Final' : 'Sign Now'}
                </Link>
                {contract.status === 'SIGNED' && (
                  <button className="p-4 bg-foreground/5 hover:bg-foreground/10 rounded-2xl text-foreground/50 transition-all">
                    <FiDownload size={20} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}

          {filteredContracts.length === 0 && (
            <div className="col-span-full py-40 text-center border-2 border-dashed border-foreground/10 rounded-[4rem]">
              <FiFileText size={64} className="mx-auto text-foreground/10 mb-6" />
              <p className="text-2xl font-serif text-foreground/30">No contracts matching your criteria.</p>
              <button onClick={() => { setActiveTab('all'); setSearchQuery(""); }} className="mt-4 text-accent font-bold uppercase text-xs tracking-widest hover:underline">Clear all filters</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
