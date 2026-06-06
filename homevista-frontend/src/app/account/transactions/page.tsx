"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { FiDollarSign, FiCalendar, FiCheckCircle, FiArrowRight, FiFileText, FiUpload, FiAlertCircle } from "react-icons/fi";
import Link from "next/link";

export default function TransactionHistoryPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  const fetchBookings = async () => {
    try {
      const response = await api.get("/bookings/");
      setBookings(response.data.results || response.data);
    } catch (error) {
      console.error("Error fetching bookings", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleConfirmWithProof = async (bookingId: number) => {
    const formData = new FormData();
    if (selectedFile) formData.append('payment_proof', selectedFile);

    try {
      await api.post(`/bookings/${bookingId}/confirm_deal/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert("Deal Confirmed!");
      fetchBookings();
    } catch (error) {
      alert("Error confirming deal");
    }
  };

  const handleRequestReversal = async (bookingId: number) => {
    try {
      await api.post(`/bookings/${bookingId}/request_reversal/`);
      alert("Reversal Request Sent to Admin");
      fetchBookings();
    } catch (error) {
      alert("Error requesting reversal");
    }
  };

  if (loading) return <div className="py-40 text-center text-2xl font-serif animate-pulse">Loading Transactions...</div>;

  return (
    <div className="py-24 px-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
        <h1 className="text-4xl font-serif mb-2">Transactions & Deals</h1>
        <p className="text-foreground/60 font-light">Manage your property agreements and payment confirmations.</p>
      </motion.div>

      {bookings.length > 0 ? (
        <div className="space-y-8">
          {bookings.map((bk: any, i: number) => (
            <motion.div
              key={bk.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass p-8 rounded-[2.5rem] border border-white/10 flex flex-col gap-8"
            >
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden flex-shrink-0">
                  <img src={bk.property_details?.images?.[0]?.image || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=400&auto=format&fit=crop"} className="w-full h-full object-cover" />
                </div>

                <div className="flex-grow text-center md:text-left">
                  <h3 className="text-xl font-serif mb-2">{bk.property_details?.title}</h3>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-foreground/60">
                    <span className="flex items-center gap-1 uppercase font-bold text-accent">{bk.status}</span>
                    <span className="flex items-center gap-1"><FiDollarSign className="text-accent" /> {parseFloat(bk.property_details?.price).toLocaleString()}</span>
                    {bk.payment_proof && <span className="text-green-500 flex items-center gap-1"><FiCheckCircle /> Payment Proof Uploaded</span>}
                  </div>
                </div>

                <div className="flex flex-col items-center md:items-end gap-3">
                   {bk.status !== 'COMPLETED' && (
                     <div className="flex flex-col gap-2">
                        {((user?.role === 'OWNER' && !bk.owner_confirmed) || (user?.role === 'CUSTOMER' && !bk.customer_confirmed)) && (
                          <div className="flex flex-col gap-3">
                            <input 
                              type="file" 
                              id={`file-${bk.id}`} 
                              className="hidden" 
                              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} 
                            />
                            <label htmlFor={`file-${bk.id}`} className="cursor-pointer flex items-center gap-2 text-xs bg-white/5 p-2 rounded-lg border border-dashed border-white/20 hover:bg-white/10">
                              <FiUpload /> {selectedFile ? selectedFile.name : "Upload Payment Proof (Optional)"}
                            </label>
                            <button 
                              onClick={() => handleConfirmWithProof(bk.id)}
                              className="bg-accent text-primary-dark font-bold px-6 py-2 rounded-xl hover:scale-105 transition-transform"
                            >
                              CONFIRM DEAL
                            </button>
                          </div>
                        )}
                        {((user?.role === 'OWNER' && bk.owner_confirmed) || (user?.role === 'CUSTOMER' && bk.customer_confirmed)) && (
                           <span className="text-sm italic text-foreground/40">Waiting for other party...</span>
                        )}
                     </div>
                   )}

                   {bk.status === 'COMPLETED' && (
                     <div className="flex flex-col gap-2 items-end">
                        <span className="bg-green-500/20 text-green-500 px-4 py-1 rounded-full text-xs font-bold">TRANSACTION LOCKED</span>
                        {((user?.role === 'OWNER' && !bk.owner_request_reversal) || (user?.role === 'CUSTOMER' && !bk.customer_request_reversal)) ? (
                          <button 
                            onClick={() => handleRequestReversal(bk.id)}
                            className="text-xs text-red-500 border-b border-red-500 mt-2"
                          >
                            REQUEST REVERSAL
                          </button>
                        ) : (
                          <span className="text-[10px] text-orange-500 flex items-center gap-1 mt-2">
                            <FiAlertCircle /> Reversal Requested. Waiting for other party & Admin.
                          </span>
                        )}
                     </div>
                   )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center glass rounded-[3rem] border border-dashed border-white/20">
          <FiFileText size={48} className="mx-auto text-foreground/20 mb-6" />
          <h3 className="text-2xl font-serif mb-2">No Transactions Found</h3>
          <Link href="/properties" className="bg-accent text-primary-dark font-bold px-8 py-3 rounded-xl inline-block mt-4">EXPLORE PROPERTIES</Link>
        </div>
      )}
    </div>
  );
}
