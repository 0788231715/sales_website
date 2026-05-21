"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/utils/api";
import { 
  FiMapPin, FiMaximize, FiUser, FiCalendar, 
  FiMessageCircle, FiHeart, FiShare2, FiCheckCircle,
  FiX, FiChevronLeft, FiChevronRight, FiGrid, FiDollarSign, FiPercent, FiClock
} from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import dynamic from "next/dynamic";

const PropertyMap = dynamic(() => import("@/components/ui/PropertyMap"), { ssr: false });

export default function PropertyDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  
  // Feature States
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [isBookingModal, setIsBookingModal] = useState(false);
  const [isMortgageModal, setIsMortgageModal] = useState(false);
  const [isChatModal, setIsChatModal] = useState(false);

  // Booking Form State
  const [bookingData, setBookingData] = useState({ date: "", time: "10:00", notes: "" });

  // Mortgage Calculator State
  const [mortgage, setMortgage] = useState({ downPayment: 20, interestRate: 5, term: 30 });

  const fetchData = async () => {
    try {
      const response = await api.get(`/properties/${id}/`);
      setProperty(response.data);
      setIsFavorite(response.data.is_favorite);
      setFavoritesCount(response.data.favorites_count);
    } catch (error) {
      console.error("Error fetching property", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleToggleFavorite = async () => {
    if (!user) return router.push("/account");
    try {
        const res = await api.post(`/properties/${id}/toggle_favorite/`);
        setIsFavorite(res.data.is_favorite);
        setFavoritesCount(prev => res.data.is_favorite ? prev + 1 : prev - 1);
    } catch (err) {
        alert("Failed to update favorite status.");
    }
  };

  const handleShare = async () => {
    const shareData = {
        title: property.title,
        text: `Check out this amazing residence on HomeVista: ${property.title}`,
        url: window.location.href
    };
    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            await navigator.clipboard.writeText(window.location.href);
            alert("Link copied to clipboard!");
        }
    } catch (err) {
        console.error("Error sharing", err);
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return router.push("/account");
    try {
        await api.post("/bookings/", {
            property: id,
            date: bookingData.date,
            time: bookingData.time,
            notes: bookingData.notes
        });
        alert("Viewing Request Sent! The owner will be notified.");
        setIsBookingModal(false);
    } catch (err: any) {
        alert(err.response?.data?.non_field_errors?.[0] || "Failed to book appointment.");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return router.push("/account");
    const message = (e.target as any).message.value;
    try {
        await api.post("/chat/", {
            receiver: property.owner.id,
            content: message
        });
        alert("Message sent to owner!");
        setIsChatModal(false);
    } catch (err) {
        alert("Failed to send message.");
    }
  };

  // Calculator Logic
  const calculateMonthly = () => {
    if (!property) return 0;
    const principal = property.price * (1 - mortgage.downPayment / 100);
    const monthlyRate = mortgage.interestRate / 100 / 12;
    const numberOfPayments = mortgage.term * 12;
    if (monthlyRate === 0) return principal / numberOfPayments;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            <p className="text-2xl font-serif text-foreground/60 animate-pulse">Loading Luxury Residence...</p>
        </div>
    </div>
  );

  if (!property) return <div className="py-40 text-center text-2xl font-serif text-foreground">Residence Not Found</div>;

  const images = property.images?.length > 0 
    ? property.images.map((img: any) => img.image)
    : ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000&auto=format&fit=crop"];

  return (
    <div className="bg-background min-h-screen">
      {/* Image Gallery Hero */}
      <section className="h-[75vh] grid grid-cols-4 grid-rows-2 gap-3 p-4">
        <div 
            onClick={() => { setSelectedImage(0); setIsGalleryOpen(true); }}
            className="col-span-2 row-span-2 overflow-hidden rounded-3xl relative group cursor-pointer shadow-2xl border border-foreground/5"
        >
          <img 
            src={images[0]} 
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          {property.status === 'SOLD' && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                <motion.div 
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: -15 }}
                className="bg-red-600/90 text-white font-serif text-6xl px-12 py-4 border-8 border-white shadow-2xl pointer-events-none"
                >
                SOLD
                </motion.div>
            </div>
          )}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <FiMaximize className="text-white text-4xl" />
          </div>
        </div>

        {/* Small Images */}
        <div 
            onClick={() => { setSelectedImage(1); setIsGalleryOpen(true); }}
            className="col-span-1 row-span-1 overflow-hidden rounded-2xl relative group cursor-pointer border border-foreground/5"
        >
          <img 
            src={images[1] || images[0]} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <FiMaximize className="text-white text-2xl" />
          </div>
        </div>

        <div 
            onClick={() => { setSelectedImage(2); setIsGalleryOpen(true); }}
            className="col-span-1 row-span-1 overflow-hidden rounded-2xl relative group cursor-pointer border border-foreground/5"
        >
           <img 
            src={images[2] || images[0]} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <FiMaximize className="text-white text-2xl" />
          </div>
        </div>

        <div 
            onClick={() => setIsGalleryOpen(true)}
            className="col-span-2 row-span-1 overflow-hidden rounded-2xl relative group cursor-pointer border border-foreground/5"
        >
           <img 
            src={images[3] || images[0]} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center transition-all group-hover:bg-black/60">
             <FiGrid className="text-accent text-3xl mb-2" />
             <span className="text-white font-bold tracking-widest uppercase">
                {images.length > 4 ? `+${images.length - 3} More Photos` : "View All Photos"}
             </span>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row justify-between items-start mb-12 gap-6"
          >
            <div>
               <h1 className="text-6xl font-serif mb-6 text-foreground leading-[1.1]">{property.title}</h1>
               <div className="flex items-center text-foreground/50 text-xl font-light">
                 <FiMapPin className="text-accent mr-3" /> {property.address}
               </div>
            </div>
            <div className="flex gap-4">
               <motion.button 
                onClick={handleToggleFavorite}
                whileHover={{ scale: 1.1 }} 
                className={`p-5 glass rounded-full transition-colors border border-foreground/10 ${isFavorite ? "text-red-500 bg-red-500/10" : "hover:text-red-500"}`}
               >
                   <FiHeart size={24} fill={isFavorite ? "currentColor" : "none"} />
               </motion.button>
               <motion.button 
                onClick={handleShare}
                whileHover={{ scale: 1.1 }} 
                className="p-5 glass rounded-full hover:text-accent transition-colors border border-foreground/10"
               >
                   <FiShare2 size={24} />
               </motion.button>
            </div>
          </motion.div>

          {/* Quick Specs */}
          <div className="grid grid-cols-3 gap-12 py-10 border-y border-foreground/10 mb-16">
             <div className="flex flex-col gap-2">
                <span className="text-foreground/40 uppercase text-[10px] font-bold tracking-[0.3em]">Bedrooms</span>
                <span className="text-3xl font-serif text-accent">{property.bedrooms}</span>
             </div>
             <div className="flex flex-col gap-2">
                <span className="text-foreground/40 uppercase text-[10px] font-bold tracking-[0.3em]">Bathrooms</span>
                <span className="text-3xl font-serif text-accent">{property.bathrooms}</span>
             </div>
             <div className="flex flex-col gap-2">
                <span className="text-foreground/40 uppercase text-[10px] font-bold tracking-[0.3em]">Living Area</span>
                <span className="text-3xl font-serif text-accent">{property.size} <span className="text-sm font-sans uppercase">Sqm</span></span>
             </div>
          </div>

          <div className="mb-20">
             <h3 className="text-3xl font-serif mb-8 text-foreground">Interactive Location</h3>
             <div className="h-[500px] w-full rounded-[2.5rem] overflow-hidden border border-foreground/10 shadow-2xl">
                <PropertyMap properties={[property]} />
             </div>
          </div>

          <div className="mb-20">
             <h3 className="text-3xl font-serif mb-8 text-foreground">The Residence</h3>
             <p className="text-foreground/70 leading-[2] font-light text-xl whitespace-pre-line">
               {property.description}
             </p>
          </div>

          <div className="mb-20">
             <h3 className="text-3xl font-serif mb-8 text-foreground">Property Concierge</h3>
             <div className="glass p-10 rounded-[3rem] border border-foreground/10 flex flex-col md:flex-row items-center gap-10 shadow-xl">
                <div className="w-24 h-24 bg-accent/20 rounded-full flex items-center justify-center text-accent font-bold text-3xl border border-accent/30">
                   {property.owner?.full_name?.[0]}
                </div>
                <div className="flex-1 text-center md:text-left">
                   <h4 className="text-2xl font-bold text-foreground mb-1">{property.owner?.full_name}</h4>
                   <p className="text-accent uppercase text-xs font-bold tracking-[0.2em] mb-4">Certified Luxury Consultant</p>
                   <div className="flex flex-wrap justify-center md:justify-start gap-4">
                      <span className="text-sm text-foreground/60 flex items-center gap-2"><FiCalendar /> Listed on {new Date(property.created_at).toLocaleDateString()}</span>
                   </div>
                </div>
                <button 
                    onClick={() => setIsChatModal(true)}
                    className="bg-primary-dark text-luxury-white px-8 py-4 rounded-2xl flex items-center gap-3 hover:bg-accent hover:text-primary-dark transition-all font-bold shadow-lg uppercase tracking-widest text-sm"
                >
                   <FiMessageCircle size={20} /> INITIATE CHAT
                </button>
             </div>
          </div>
        </div>

        {/* Sidebar Sticky Box */}
        <div className="relative">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="sticky top-32 glass p-10 rounded-[3.5rem] border border-foreground/10 shadow-2xl"
          >
             <div className="mb-12">
                <span className="text-foreground/40 uppercase text-xs tracking-[0.4em] font-bold block mb-4">Investment</span>
                <motion.div className="flex items-baseline gap-2">
                    <span className="text-5xl font-serif text-accent font-bold">
                        {property.currency}
                    </span>
                    <span className="text-5xl font-serif text-accent font-bold">
                        {parseFloat(property.price).toLocaleString()}
                    </span>
                </motion.div>
                <p className="mt-2 text-xs text-foreground/40 font-bold uppercase tracking-widest">{favoritesCount} people liked this</p>
             </div>
             
             <div className="space-y-4 mb-12">
                <button 
                    onClick={() => setIsBookingModal(true)}
                    className="w-full bg-accent text-primary-dark font-black py-6 rounded-[2rem] flex items-center justify-center gap-3 hover:scale-[1.03] active:scale-95 transition-all shadow-xl shadow-accent/20 uppercase tracking-widest text-sm"
                >
                   <FiCalendar size={20}/> SECURE A VIEWING
                </button>
                <button 
                    onClick={() => setIsMortgageModal(true)}
                    className="w-full bg-foreground/5 border border-foreground/10 text-foreground font-bold py-6 rounded-[2rem] hover:bg-foreground/10 transition-all uppercase tracking-widest text-xs"
                >
                   CALCULATE MORTGAGE
                </button>
             </div>

             {property.is_verified && (
                <div className="bg-foreground/[0.03] p-8 rounded-[2.5rem] border border-foreground/5">
                    <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center">
                            <FiCheckCircle size={20} />
                    </div>
                    <h4 className="font-bold text-foreground">Verified Asset</h4>
                    </div>
                    <p className="text-sm text-foreground/50 font-light leading-relaxed mb-8">This asset has undergone rigorous due diligence and is verified for immediate acquisition.</p>
                    <div className="relative mb-6">
                        <input 
                        type="text" 
                        placeholder="ENTER PHONE NUMBER" 
                        className="w-full bg-background border border-foreground/10 p-5 rounded-2xl outline-none focus:border-accent text-sm font-bold tracking-widest text-foreground"
                        />
                    </div>
                    <button className="w-full bg-primary-dark text-luxury-white font-black text-xs tracking-[0.3em] py-5 rounded-2xl hover:bg-accent hover:text-primary-dark transition-all border border-foreground/5">
                        REQUEST CALLBACK
                    </button>
                </div>
             )}
          </motion.div>
        </div>
      </div>

      {/* Lightbox / Gallery Full Screen Modal */}
      <AnimatePresence>
        {isGalleryOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col"
          >
            {/* Gallery Header */}
            <div className="p-6 flex justify-between items-center border-b border-white/10">
                <div className="text-white">
                    <h2 className="text-xl font-serif font-bold">{property.title}</h2>
                    <p className="text-xs text-white/50 uppercase tracking-widest">{images.length} HD PHOTOS</p>
                </div>
                <button 
                    onClick={() => setIsGalleryOpen(false)}
                    className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors"
                >
                    <FiX size={32} />
                </button>
            </div>

            {/* Main Carousel */}
            <div className="flex-1 relative flex items-center justify-center p-12">
                <button 
                    onClick={() => setSelectedImage(prev => (prev !== null && prev > 0) ? prev - 1 : images.length - 1)}
                    className="absolute left-10 p-4 rounded-full bg-white/5 text-white hover:bg-accent hover:text-primary-dark transition-all"
                >
                    <FiChevronLeft size={40} />
                </button>

                <motion.div 
                    key={selectedImage}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="h-full max-w-5xl overflow-hidden rounded-[2rem] shadow-2xl border border-white/10"
                >
                    <img 
                        src={images[selectedImage ?? 0]} 
                        className="w-full h-full object-contain"
                    />
                </motion.div>

                <button 
                    onClick={() => setSelectedImage(prev => (prev !== null && prev < images.length - 1) ? prev + 1 : 0)}
                    className="absolute right-10 p-4 rounded-full bg-white/5 text-white hover:bg-accent hover:text-primary-dark transition-all"
                >
                    <FiChevronRight size={40} />
                </button>
            </div>

            {/* Thumbnail Strip */}
            <div className="p-8 flex gap-4 overflow-x-auto no-scrollbar bg-white/5 border-t border-white/10">
                {images.map((img: string, idx: number) => (
                    <div 
                        key={idx}
                        onClick={() => setSelectedImage(idx)}
                        className={`min-w-[150px] h-24 rounded-xl overflow-hidden cursor-pointer transition-all border-2 ${selectedImage === idx ? "border-accent scale-110 z-10" : "border-transparent opacity-50 hover:opacity-100"}`}
                    >
                        <img src={img} className="w-full h-full object-cover" />
                    </div>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Booking Modal */}
      <AnimatePresence>
        {isBookingModal && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-background w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 border border-foreground/10">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-serif font-bold text-foreground">Secure Viewing</h2>
                        <button onClick={() => setIsBookingModal(false)} className="text-foreground/40"><FiX size={24}/></button>
                    </div>
                    <form onSubmit={handleBooking} className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 mb-2 block">Preferred Date</label>
                            <input required type="date" value={bookingData.date} onChange={e => setBookingData({...bookingData, date: e.target.value})} className="w-full bg-foreground/5 border border-foreground/10 p-4 rounded-xl outline-none focus:border-accent text-foreground" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 mb-2 block">Preferred Time</label>
                            <select value={bookingData.time} onChange={e => setBookingData({...bookingData, time: e.target.value})} className="w-full bg-foreground/5 border border-foreground/10 p-4 rounded-xl outline-none focus:border-accent text-foreground">
                                <option value="09:00" className="bg-background">09:00 AM</option>
                                <option value="10:00" className="bg-background">10:00 AM</option>
                                <option value="11:00" className="bg-background">11:00 AM</option>
                                <option value="14:00" className="bg-background">02:00 PM</option>
                                <option value="15:00" className="bg-background">03:00 PM</option>
                                <option value="16:00" className="bg-background">04:00 PM</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 mb-2 block">Special Requests</label>
                            <textarea value={bookingData.notes} onChange={e => setBookingData({...bookingData, notes: e.target.value})} className="w-full bg-foreground/5 border border-foreground/10 p-4 rounded-xl outline-none focus:border-accent text-foreground resize-none" rows={3}></textarea>
                        </div>
                        <button type="submit" className="w-full bg-accent text-primary-dark font-black py-5 rounded-2xl shadow-xl shadow-accent/20 uppercase tracking-widest">SEND VIEWING REQUEST</button>
                    </form>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* Mortgage Modal */}
      <AnimatePresence>
        {isMortgageModal && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-background w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 border border-foreground/10 text-foreground">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-serif font-bold">Mortgage Tool</h2>
                        <button onClick={() => setIsMortgageModal(false)} className="text-foreground/40"><FiX size={24}/></button>
                    </div>
                    <div className="space-y-8">
                        <div className="text-center p-8 bg-accent/10 rounded-3xl border border-accent/20">
                            <span className="text-xs uppercase font-bold tracking-widest text-accent block mb-2">Estimated Monthly</span>
                            <span className="text-4xl font-serif font-bold text-accent">{property.currency} {Math.round(calculateMonthly()).toLocaleString()}</span>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                                    <span>Down Payment</span>
                                    <span>{mortgage.downPayment}%</span>
                                </label>
                                <input type="range" min="5" max="80" value={mortgage.downPayment} onChange={e => setMortgage({...mortgage, downPayment: parseInt(e.target.value)})} className="w-full accent-accent" />
                            </div>
                            <div>
                                <label className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                                    <span>Interest Rate</span>
                                    <span>{mortgage.interestRate}%</span>
                                </label>
                                <input type="range" min="1" max="15" step="0.1" value={mortgage.interestRate} onChange={e => setMortgage({...mortgage, interestRate: parseFloat(e.target.value)})} className="w-full accent-accent" />
                            </div>
                            <div>
                                <label className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                                    <span>Loan Term</span>
                                    <span>{mortgage.term} Years</span>
                                </label>
                                <input type="range" min="5" max="30" step="5" value={mortgage.term} onChange={e => setMortgage({...mortgage, term: parseInt(e.target.value)})} className="w-full accent-accent" />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* Chat Modal */}
      <AnimatePresence>
        {isChatModal && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-background w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 border border-foreground/10 text-foreground">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center font-bold text-primary-dark">{property.owner.full_name[0]}</div>
                            <h2 className="text-xl font-bold">Chat with {property.owner.full_name.split(' ')[0]}</h2>
                        </div>
                        <button onClick={() => setIsChatModal(false)} className="text-foreground/40"><FiX size={24}/></button>
                    </div>
                    <form onSubmit={handleSendMessage} className="space-y-4">
                        <textarea required name="message" placeholder="Type your message..." className="w-full bg-foreground/5 border border-foreground/10 p-4 rounded-2xl outline-none focus:border-accent text-foreground resize-none" rows={4}></textarea>
                        <button type="submit" className="w-full bg-accent text-primary-dark font-black py-5 rounded-2xl shadow-xl uppercase tracking-widest">SEND MESSAGE</button>
                    </form>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}
