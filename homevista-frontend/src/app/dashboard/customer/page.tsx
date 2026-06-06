"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiHome, FiDollarSign, FiClock, FiCheckCircle, 
  FiXCircle, FiMessageCircle, FiFileText, FiArrowRight,
  FiActivity, FiHeart, FiTrendingUp, FiSearch
} from "react-icons/fi";
import api from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CustomerDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [stats, setStats] = useState({
    activeOffers: 0,
    acceptedOffers: 0,
    totalSpent: 0,
    favorites: 0
  });
  
  const [offers, setOffers] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'offers' | 'contracts' | 'bookings'>('overview');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [offersRes, bookingsRes, favoritesRes, contractsRes] = await Promise.all([
        api.get("/properties/offers/"),
        api.get("/bookings/"),
        api.get("/users/profile/"), // Assuming favorites count is in profile or we fetch separately
        api.get("/legal/contracts/")
      ]);

      const offersData = offersRes.data.results || offersRes.data;
      setOffers(offersData);
      setBookings(bookingsRes.data.results || bookingsRes.data);
      setContracts(contractsRes.data.results || contractsRes.data);

      // Simple stats calculation
      setStats({
        activeOffers: offersData.filter((o: any) => o.status === 'PENDING').length,
        acceptedOffers: offersData.filter((o: any) => o.status === 'ACCEPTED').length,
        totalSpent: offersData.reduce((acc: number, o: any) => o.status === 'ACCEPTED' ? acc + parseFloat(o.amount) : acc, 0),
        favorites: 0 // Will be updated if favorites fetch is separate
      });

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const handleWithdrawOffer = async (offerId: number) => {
    if (!confirm("Are you sure you want to withdraw this offer?")) return;
    try {
      setActionLoading(true);
      await api.post(`/properties/offers/${offerId}/withdraw/`);
      alert("Offer withdrawn successfully.");
      fetchData();
    } catch (error) {
      alert("Error withdrawing offer.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xl font-serif text-foreground/60">Loading Your Dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pt-24 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-4xl font-serif mb-2">Buyer Dashboard</h1>
            <p className="text-foreground/50">Welcome back, {user?.full_name}. Manage your property acquisitions.</p>
          </div>
          <div className="flex gap-4">
            <Link href="/properties" className="bg-accent text-primary-dark px-6 py-3 rounded-xl font-bold text-sm tracking-widest uppercase hover:scale-105 transition-transform shadow-lg shadow-accent/20">
              Find Properties
            </Link>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: "Active Offers", value: stats.activeOffers, icon: FiActivity, color: "text-blue-500" },
            { label: "Accepted Deals", value: stats.acceptedOffers, icon: FiCheckCircle, color: "text-emerald-500" },
            { label: "Investment Value", value: `$${stats.totalSpent.toLocaleString()}`, icon: FiTrendingUp, color: "text-accent" },
            { label: "Booked Viewings", value: bookings.length, icon: FiClock, color: "text-amber-500" },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass p-8 rounded-[2.5rem] border border-foreground/10 flex items-center gap-6"
            >
              <div className={`p-4 rounded-2xl bg-foreground/5 ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-foreground/40 font-bold mb-1">{stat.label}</p>
                <p className="text-2xl font-serif font-bold text-foreground">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tabs Navigation */}
        <div className="flex border-b border-foreground/10 mb-8 gap-8 overflow-x-auto no-scrollbar">
          {(['overview', 'offers', 'contracts', 'bookings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 px-2 font-bold tracking-[0.2em] uppercase text-xs transition-all relative ${activeTab === tab ? "text-accent" : "text-foreground/40 hover:text-foreground"}`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <div className="glass p-8 rounded-[3rem] border border-foreground/10">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <FiTrendingUp className="text-accent" /> Recent Offers
                </h3>
                <div className="space-y-4">
                  {offers.slice(0, 3).map((offer) => (
                    <div key={offer.id} className="p-4 rounded-2xl bg-foreground/5 flex justify-between items-center">
                      <div>
                        <p className="font-bold">{offer.property_details?.title}</p>
                        <p className="text-sm text-foreground/50">${parseFloat(offer.amount).toLocaleString()}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${
                        offer.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-500' :
                        offer.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-rose-500/10 text-rose-500'
                      }`}>
                        {offer.status}
                      </span>
                    </div>
                  ))}
                  {offers.length === 0 && <p className="text-foreground/30 italic">No offers submitted yet.</p>}
                </div>
                {offers.length > 3 && (
                  <button onClick={() => setActiveTab('offers')} className="mt-6 text-accent font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                    View All Offers <FiArrowRight />
                  </button>
                )}
              </div>

              <div className="glass p-8 rounded-[3rem] border border-foreground/10">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <FiFileText className="text-accent" /> Active Contracts
                </h3>
                <div className="space-y-4">
                  {contracts.filter(c => c.status !== 'SIGNED').slice(0, 3).map((contract) => (
                    <div key={contract.id} className="p-4 rounded-2xl bg-foreground/5 flex justify-between items-center">
                      <div>
                        <p className="font-bold">{contract.booking_details?.property_details?.title || 'Property Contract'}</p>
                        <p className="text-sm text-foreground/50">Status: {contract.status}</p>
                      </div>
                      <Link href={`/contracts/${contract.id}`} className="p-2 bg-accent/10 text-accent rounded-xl hover:bg-accent hover:text-primary-dark transition-all">
                        <FiArrowRight />
                      </Link>
                    </div>
                  ))}
                  {contracts.length === 0 && <p className="text-foreground/30 italic">No active contracts found.</p>}
                </div>
                {contracts.length > 3 && (
                  <button onClick={() => setActiveTab('contracts')} className="mt-6 text-accent font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                    View All Contracts <FiArrowRight />
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'offers' && (
            <motion.div 
              key="offers"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {offers.map((offer) => (
                <div key={offer.id} className="glass p-8 rounded-[2.5rem] border border-foreground/10 grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <div className="flex items-center gap-4 mb-4">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase ${
                        offer.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-500' :
                        offer.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-rose-500/10 text-rose-500'
                      }`}>
                        {offer.status}
                      </span>
                      <span className="text-foreground/40 text-xs font-bold uppercase tracking-widest">Submitted {new Date(offer.created_at).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-2xl font-serif mb-2">{offer.property_details?.title}</h3>
                    <p className="text-foreground/60 mb-6 max-w-xl line-clamp-2">{offer.property_details?.description}</p>
                    
                    <div className="flex flex-wrap gap-6">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-foreground/40 block mb-1">Offer Price</span>
                        <span className="text-xl font-bold text-accent">${parseFloat(offer.amount).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-foreground/40 block mb-1">Expires On</span>
                        <span className="text-xl font-bold text-foreground">{offer.expires_at ? new Date(offer.expires_at).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center gap-4">
                    <Link href={`/properties/${offer.property}`} className="w-full py-4 bg-foreground/5 border border-foreground/10 text-center rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-foreground/10 transition-all">
                      View Property
                    </Link>
                    {offer.status === 'PENDING' && (
                      <button 
                        onClick={() => handleWithdrawOffer(offer.id)}
                        disabled={actionLoading}
                        className="w-full py-4 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
                      >
                        Withdraw Offer
                      </button>
                    )}
                    {offer.status === 'ACCEPTED' && (
                      <Link href={`/dashboard/contracts`} className="w-full py-4 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-center rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all">
                        Proceed to Signing
                      </Link>
                    )}
                  </div>
                </div>
              ))}
              {offers.length === 0 && (
                <div className="py-20 text-center border-2 border-dashed border-foreground/10 rounded-[3rem]">
                  <FiTrendingUp size={48} className="mx-auto text-foreground/20 mb-6" />
                  <p className="text-xl text-foreground/40 font-serif">No offers found. Start exploring luxury assets.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'contracts' && (
            <motion.div 
              key="contracts"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {contracts.map((contract) => (
                <div key={contract.id} className="glass p-8 rounded-[2.5rem] border border-foreground/10 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-3 bg-accent/10 text-accent rounded-2xl">
                        <FiFileText size={24} />
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${
                        contract.status === 'SIGNED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {contract.status}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">{contract.booking_details?.property_details?.title || 'Agreement'}</h3>
                    <p className="text-xs text-foreground/40 font-bold uppercase tracking-[0.2em] mb-4">Contract v{contract.version}</p>
                  </div>
                  
                  <div className="mt-8 space-y-4">
                    <Link href={`/contracts/${contract.id}`} className="w-full py-4 bg-accent text-primary-dark text-center rounded-2xl font-bold text-xs uppercase tracking-widest block hover:scale-105 transition-transform shadow-lg shadow-accent/20">
                      {contract.status === 'SIGNED' ? 'View Final Contract' : 'Review & Sign'}
                    </Link>
                  </div>
                </div>
              ))}
              {contracts.length === 0 && (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-foreground/10 rounded-[3rem]">
                  <FiFileText size={48} className="mx-auto text-foreground/20 mb-6" />
                  <p className="text-xl text-foreground/40 font-serif">No contracts yet. They appear after your offers are accepted.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'bookings' && (
            <motion.div 
              key="bookings"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {bookings.map((booking) => (
                <div key={booking.id} className="glass p-6 rounded-3xl border border-foreground/10 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex items-center gap-6 w-full">
                    <div className="w-20 h-20 bg-foreground/5 rounded-2xl overflow-hidden hidden md:block">
                      <img 
                        src={booking.property_details?.images?.[0]?.image || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=400&auto=format&fit=crop"} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{booking.property_details?.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-foreground/50 mt-1">
                        <span className="flex items-center gap-1"><FiClock /> {booking.date} at {booking.time}</span>
                        <span className={`uppercase text-[10px] font-black tracking-widest ${
                          booking.status === 'APPROVED' ? 'text-emerald-500' : 'text-amber-500'
                        }`}>{booking.status}</span>
                      </div>
                    </div>
                  </div>
                  <Link href={`/properties/${booking.property}`} className="px-6 py-3 bg-foreground/5 hover:bg-foreground/10 rounded-xl text-xs font-bold uppercase tracking-widest transition-all w-full md:w-auto text-center">
                    Property Details
                  </Link>
                </div>
              ))}
              {bookings.length === 0 && (
                <div className="py-20 text-center border-2 border-dashed border-foreground/10 rounded-[3rem]">
                  <FiClock size={48} className="mx-auto text-foreground/20 mb-6" />
                  <p className="text-xl text-foreground/40 font-serif">No viewing requests scheduled.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
