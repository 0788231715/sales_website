"use client";

import { useEffect, useState } from "react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, Cell
} from "recharts";
import { 
  Home, Eye, CheckCircle, TrendingUp, AlertCircle, Clock, 
  ArrowUpRight, Download, ShieldCheck, Calendar as CalendarIcon,
  Plus, X as FiX, Image as ImageIcon, FileText, Send, AlertTriangle
} from "lucide-react";
import api from "@/utils/api";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function OwnerDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [offersLoading, setOffersLoading] = useState(true);
  const [offerActionLoading, setOfferActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'analytics' | 'calendar' | 'requests' | 'bookings' | 'offers'>('analytics');
  
  // Modals
  const [isRequestModal, setRequestModal] = useState(false);
  const [isExtendModal, setExtendModal] = useState(false);
  const [isCounterModal, setCounterModal] = useState(false);
  
  // Selected Objects for Actions
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  
  // Form States
  const [extendEndDatetime, setExtendEndDatetime] = useState('');
  const [counterData, setCounterData] = useState({ amount: "", message: "", expires_at: "" });
  const [newRequest, setNewRequest] = useState({
    title: "", price: "", currency: "USD", address: "", 
    bedrooms: 2, bathrooms: 2, size: 1000, description: ""
  });
  const [requestImages, setRequestImages] = useState<FileList | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, reqsRes, offersRes] = await Promise.all([
        api.get("/analytics/owner_dashboard/"),
        api.get("/properties/requests/"),
        api.get("/properties/offers/")
      ]);
      setStats(statsRes.data);
      setRequests(reqsRes.data.results || reqsRes.data);
      setOffers(offersRes.data.results || offersRes.data);
      const bookingsRes = await api.get('/bookings/');
      setBookings(bookingsRes.data.results || bookingsRes.data);
    } catch (err) {
      console.error("Error fetching owner data:", err);
    } finally {
      setLoading(false);
      setOffersLoading(false);
    }
  };

  const handleRequestListing = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const formData = new FormData();
        Object.entries(newRequest).forEach(([key, value]) => {
            formData.append(key, value.toString());
        });
        
        if (requestImages) {
            for (let i = 0; i < requestImages.length; i++) {
                formData.append('images', requestImages[i]);
            }
        }

        await api.post("/properties/requests/", formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        alert("Listing Request Submitted! Admin will review it shortly.");
        setRequestModal(false);
        setRequestImages(null);
        fetchData();
        setActiveTab('requests');
    } catch (err) {
        alert("Error submitting request.");
    }
  };

  const refreshOwnerBookings = async () => {
    try {
      const bookingsRes = await api.get('/bookings/');
      setBookings(bookingsRes.data.results || bookingsRes.data);
    } catch (err) {
      console.error('Error fetching owner bookings', err);
    }
  };

  const handleApproveBooking = async (bookingId: number) => {
    try {
      await api.post(`/bookings/${bookingId}/approve/`);
      alert('Booking approved.');
      refreshOwnerBookings();
    } catch (err) {
      alert('Error approving booking.');
    }
  };

  const handleRejectBooking = async (bookingId: number) => {
    try {
      await api.post(`/bookings/${bookingId}/reject/`);
      alert('Booking rejected.');
      refreshOwnerBookings();
    } catch (err) {
      alert('Error rejecting booking.');
    }
  };

  const handleAcceptOffer = async (offer: any) => {
    if (offer.property_details?.ownership_status !== 'VERIFIED') {
      alert("Property must be VERIFIED before you can accept an offer. Please upload ownership documents.");
      router.push(`/dashboard/owner/verify-property/${offer.property}`);
      return;
    }
    
    try {
      setOfferActionLoading(true);
      await api.post(`/properties/offers/${offer.id}/accept/`);
      alert('Offer accepted.');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error accepting offer.');
    } finally {
      setOfferActionLoading(false);
    }
  };

  const handleRejectOffer = async (offerId: number) => {
    try {
      setOfferActionLoading(true);
      await api.post(`/properties/offers/${offerId}/reject/`);
      alert('Offer rejected.');
      fetchData();
    } catch (err) {
      alert('Error rejecting offer.');
    } finally {
      setOfferActionLoading(false);
    }
  };

  const handleOpenCounter = (offer: any) => {
    setSelectedOffer(offer);
    setCounterData({
      amount: offer.amount,
      message: "",
      expires_at: ""
    });
    setCounterModal(true);
  };

  const handleCounterOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffer) return;
    try {
      setOfferActionLoading(true);
      await api.post(`/properties/offers/${selectedOffer.id}/counter/`, {
        amount: parseFloat(counterData.amount),
        message: counterData.message,
        expires_at: counterData.expires_at || null
      });
      alert('Counter-offer submitted.');
      setCounterModal(false);
      fetchData();
    } catch (err) {
      alert('Error submitting counter-offer.');
    } finally {
      setOfferActionLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await api.post(`/bookings/${bookingId}/cancel/`);
      alert('Booking cancelled.');
      refreshOwnerBookings();
    } catch (err) {
      alert('Error cancelling booking.');
    }
  };

  const handleOpenExtend = (booking: any) => {
    setSelectedBooking(booking);
    setExtendEndDatetime(booking.end_datetime?.slice(0, 16) || '');
    setExtendModal(true);
  };

  const handleExtendBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    try {
      await api.post(`/bookings/${selectedBooking.id}/extend/`, {
        end_datetime: new Date(extendEndDatetime).toISOString()
      });
      alert('Booking extended successfully.');
      setExtendModal(false);
      refreshOwnerBookings();
    } catch (err) {
      alert('Error extending booking.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            <p className="text-foreground/60 font-medium">Loading Owner Console...</p>
        </div>
    </div>
  );

  if (!stats) return <div className="p-8 text-center text-red-500">Failed to load dashboard data.</div>;

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold text-foreground">Owner Enterprise Console</h1>
            <div className="flex gap-4 mt-4">
                <button 
                    onClick={() => setActiveTab('analytics')}
                    className={`pb-2 px-2 font-medium transition ${activeTab === 'analytics' ? 'text-accent border-b-2 border-accent' : 'text-foreground/50 hover:text-foreground'}`}
                >
                    Performance Analytics
                </button>
                <button 
                    onClick={() => setActiveTab('calendar')}
                    className={`pb-2 px-2 font-medium transition ${activeTab === 'calendar' ? 'text-accent border-b-2 border-accent' : 'text-foreground/50 hover:text-foreground'}`}
                >
                    Booking Calendar
                </button>
                <button 
                    onClick={() => setActiveTab('requests')}
                    className={`pb-2 px-2 font-medium transition ${activeTab === 'requests' ? 'text-accent border-b-2 border-accent' : 'text-foreground/50 hover:text-foreground'}`}
                >
                    Listing Requests
                </button>
                <button 
                    onClick={() => setActiveTab('bookings')}
                    className={`pb-2 px-2 font-medium transition ${activeTab === 'bookings' ? 'text-accent border-b-2 border-accent' : 'text-foreground/50 hover:text-foreground'}`}
                >
                    Booking Management
                </button>
                <button 
                    onClick={() => setActiveTab('offers')}
                    className={`pb-2 px-2 font-medium transition ${activeTab === 'offers' ? 'text-accent border-b-2 border-accent' : 'text-foreground/50 hover:text-foreground'}`}
                >
                    Offers
                </button>
            </div>
        </div>
        <div className="flex gap-4">
            <button 
                onClick={() => setRequestModal(true)}
                className="flex items-center gap-2 bg-accent text-primary-dark px-4 py-2 rounded-lg hover:opacity-90 transition font-bold"
            >
                <Plus size={18} /> Request Listing
            </button>
            <button className="flex items-center gap-2 bg-foreground/10 text-foreground px-4 py-2 rounded-lg hover:bg-foreground/20 transition">
                <Download size={18} /> Export Report
            </button>
        </div>
      </div>

      {activeTab === 'analytics' ? (
        <>
            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <DashboardMetricCard label="Total Property Views" value={stats.total_views} icon={<Eye size={24}/>} color="blue" />
                <DashboardMetricCard label="Total Bookings" value={stats.total_bookings} icon={<CheckCircle size={24}/>} color="purple" />
                <DashboardMetricCard label="Conversion Rate" value={`${stats.conversion_rate}%`} icon={<TrendingUp size={24}/>} color="orange" />
                <DashboardMetricCard label="Trust Score" value="92/100" icon={<ShieldCheck size={24}/>} color="green" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Interaction Chart */}
                <div className="glass p-6 rounded-xl border border-foreground/10">
                <h3 className="text-lg font-bold text-foreground mb-6">Visitor Engagement (Daily)</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.daily_interactions}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" tick={{fill: 'currentColor', opacity: 0.5}} />
                        <YAxis tick={{fill: 'currentColor', opacity: 0.5}} />
                        <Tooltip contentStyle={{background: 'var(--background)', border: 'none', borderRadius: '12px'}} />
                        <Line type="monotone" dataKey="count" stroke="var(--color-accent)" strokeWidth={3} dot={{ r: 4, fill: "var(--color-accent)" }} activeDot={{ r: 6 }} />
                    </LineChart>
                    </ResponsiveContainer>
                </div>
                </div>

                {/* Property Performance */}
                <div className="glass p-6 rounded-xl border border-foreground/10">
                <h3 className="text-lg font-bold text-foreground mb-6">Top Performing Properties</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.property_ranking} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis type="number" tick={{fill: 'currentColor', opacity: 0.5}} />
                        <YAxis dataKey="title" type="category" width={100} tick={{fill: 'currentColor', opacity: 0.5}} />
                        <Tooltip contentStyle={{background: 'var(--background)', border: 'none', borderRadius: '12px'}} />
                        <Bar dataKey="views_count" fill="var(--color-accent)" radius={[0, 4, 4, 0]} opacity={0.8} />
                    </BarChart>
                    </ResponsiveContainer>
                </div>
                </div>
            </div>

            {/* Alerts & Tasks */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass p-6 rounded-xl border border-foreground/10">
                <h3 className="text-lg font-bold text-foreground mb-4">Pending Actions</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <div className="flex items-center gap-3 text-yellow-500">
                        <AlertCircle />
                        <div>
                        <p className="font-bold">2 Contracts Pending Signature</p>
                        <p className="text-sm opacity-70">Action required to finalize deals</p>
                        </div>
                    </div>
                    <button className="text-yellow-500 font-bold hover:underline">View Contracts</button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-accent/10 rounded-lg border border-accent/20">
                    <div className="flex items-center gap-3 text-accent">
                        <Clock />
                        <div>
                        <p className="font-bold">3 New Viewing Requests</p>
                        <p className="text-sm opacity-70">Approve or reschedule bookings</p>
                        </div>
                    </div>
                    <button className="text-accent font-bold hover:underline">Manage Bookings</button>
                    </div>
                </div>
                </div>

                <div className="glass p-6 rounded-xl border border-foreground/10 text-center">
                    <h3 className="text-lg font-bold text-foreground mb-4">AI Insight</h3>
                    <div className="p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20 italic text-indigo-400 mb-4">
                        "Properties with virtual tours in Kigali are seeing 45% more engagement this week. Consider adding one to your 'Sunset Villa' listing."
                    </div>
                    <button className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-bold">
                        Apply Optimization
                    </button>
                </div>
            </div>
        </>
      ) : activeTab === 'bookings' ? (
        <div className="glass p-8 rounded-3xl shadow-xl border border-foreground/10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-xl font-bold text-foreground">Booking Management</h2>
                    <p className="text-foreground/50">Approve, reject, extend, and cancel owner bookings.</p>
                </div>
                <button
                    onClick={refreshOwnerBookings}
                    className="px-4 py-2 bg-accent text-primary-dark rounded-lg hover:opacity-90 transition"
                >
                    Refresh Bookings
                </button>
            </div>
            {bookings.length === 0 ? (
                <div className="text-center py-20 text-foreground/30 italic">
                    No owner bookings found yet. Bookings will appear here once submitted by tenants.
                </div>
            ) : (
                <div className="space-y-6">
                    {bookings.map((booking: any) => (
                        <div key={booking.id} className="p-6 glass rounded-3xl border border-foreground/10 grid grid-cols-1 lg:grid-cols-[1.5fr,0.5fr] gap-6">
                            <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div>
                                        <h3 className="text-lg font-bold text-foreground">{booking.property?.title || 'Unknown Property'}</h3>
                                        <p className="text-sm text-foreground/60">{booking.customer?.full_name || booking.customer?.email}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${booking.status === 'APPROVED' ? 'bg-green-500/10 text-green-500' : booking.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'}`}>
                                        {booking.status}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-foreground/60">
                                    <div>
                                        <p><span className="font-semibold text-foreground">From:</span> {new Date(booking.start_datetime).toLocaleString()}</p>
                                        <p><span className="font-semibold text-foreground">To:</span> {new Date(booking.end_datetime).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p><span className="font-semibold text-foreground">Total:</span> {booking.currency} {parseFloat(booking.total_price || '0').toLocaleString()}</p>
                                        <p><span className="font-semibold text-foreground">Created:</span> {new Date(booking.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                {booking.customer_message && (
                                    <div className="bg-foreground/5 p-4 rounded-2xl border border-foreground/10 text-sm text-foreground/70">
                                        <span className="font-semibold text-foreground">Message:</span> {booking.customer_message}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-3 justify-between">
                                <div className="grid grid-cols-1 gap-3">
                                    {booking.status === 'PENDING' && (
                                        <>
                                            <button
                                                onClick={() => handleApproveBooking(booking.id)}
                                                className="w-full px-4 py-3 bg-green-500 text-white rounded-2xl hover:bg-green-600 transition font-semibold"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleRejectBooking(booking.id)}
                                                className="w-full px-4 py-3 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition font-semibold"
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => handleCancelBooking(booking.id)}
                                        className="w-full px-4 py-3 bg-foreground/10 text-foreground rounded-2xl hover:bg-foreground/20 transition font-semibold"
                                    >
                                        Cancel Booking
                                    </button>
                                    <button
                                        onClick={() => handleOpenExtend(booking)}
                                        className="w-full px-4 py-3 bg-accent text-primary-dark rounded-2xl hover:opacity-90 transition font-semibold"
                                    >
                                        Extend Booking
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      ) : activeTab === 'offers' ? (
        <div className="glass p-8 rounded-3xl shadow-xl border border-foreground/10">
            <div className="flex flex-col md:flex-row md:justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-xl font-bold text-foreground">Offer Management</h2>
                    <p className="text-foreground/50">Review incoming and outgoing sale offers from interested buyers.</p>
                </div>
                <button
                    onClick={fetchData}
                    className="px-4 py-2 bg-accent text-primary-dark rounded-lg hover:opacity-90 transition"
                >
                    Refresh Offers
                </button>
            </div>
            {offersLoading ? (
                <div className="text-center py-20 text-foreground/50">Loading offers...</div>
            ) : offers.length === 0 ? (
                <div className="text-center py-20 text-foreground/30 italic">No offers found yet. Offers appear here once buyers submit them.</div>
            ) : (
                <div className="space-y-6">
                    {offers.map((offer: any) => (
                        <div key={offer.id} className="p-6 glass rounded-3xl border border-foreground/10 grid grid-cols-1 lg:grid-cols-[1.7fr,0.8fr] gap-6">
                            <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div>
                                        <h3 className="text-lg font-bold text-foreground">{offer.property_details?.title || 'Unnamed Property'}</h3>
                                        <p className="text-sm text-foreground/60">Buyer: {offer.buyer_details?.full_name || offer.buyer_details?.email}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${offer.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500' : offer.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                            {offer.status}
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-1 ${offer.property_details?.ownership_status === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                            {offer.property_details?.ownership_status === 'VERIFIED' ? <ShieldCheck size={12}/> : <AlertTriangle size={12}/>}
                                            {offer.property_details?.ownership_status || 'UNVERIFIED'}
                                        </span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm text-foreground/60">
                                    <div>
                                        <p><span className="font-semibold text-foreground">Offer:</span> {offer.currency} {parseFloat(offer.amount).toLocaleString()}</p>
                                        <p><span className="font-semibold text-foreground">Expires:</span> {offer.expires_at ? new Date(offer.expires_at).toLocaleDateString() : 'No expiry'}</p>
                                    </div>
                                    <div>
                                        <p><span className="font-semibold text-foreground">Submitted:</span> {new Date(offer.created_at).toLocaleDateString()}</p>
                                        <p><span className="font-semibold text-foreground">Property Type:</span> {offer.property_details?.property_type || 'N/A'}</p>
                                    </div>
                                </div>
                                <p className="text-sm text-foreground/70">{offer.message || 'No message provided.'}</p>
                                {offer.property_details?.ownership_status !== 'VERIFIED' && (
                                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-between gap-4">
                                        <p className="text-xs text-rose-500 font-bold uppercase tracking-wider">Property verification required to accept offers.</p>
                                        <Link href={`/dashboard/owner/verify-property/${offer.property}`} className="text-xs font-black text-rose-500 border-b border-rose-500 hover:text-rose-600 transition-colors uppercase tracking-widest shrink-0">Verify Now</Link>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col justify-between gap-4">
                                {offer.status === 'PENDING' && (
                                    <div className="grid grid-cols-1 gap-3">
                                        <button 
                                            onClick={() => handleAcceptOffer(offer)} 
                                            disabled={offerActionLoading || offer.property_details?.ownership_status !== 'VERIFIED'} 
                                            className="w-full px-4 py-3 bg-green-500 text-white rounded-2xl hover:bg-green-600 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Accept
                                        </button>
                                        <button 
                                            onClick={() => handleOpenCounter(offer)} 
                                            disabled={offerActionLoading} 
                                            className="w-full px-4 py-3 bg-accent text-primary-dark rounded-2xl hover:opacity-90 transition font-semibold"
                                        >
                                            Counter Offer
                                        </button>
                                        <button 
                                            onClick={() => handleRejectOffer(offer.id)} 
                                            disabled={offerActionLoading} 
                                            className="w-full px-4 py-3 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition font-semibold"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                )}
                                <div className="p-4 bg-foreground/5 rounded-3xl border border-foreground/10 text-sm text-foreground/70">
                                    <p><span className="font-semibold text-foreground">Buyer Email:</span> {offer.buyer_details?.email || 'N/A'}</p>
                                    <p><span className="font-semibold text-foreground">Seller:</span> {offer.seller_details?.full_name || offer.seller_details?.email}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      ) : activeTab === 'calendar' ? (
        <div className="glass p-8 rounded-3xl shadow-xl border border-foreground/10">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-xl font-bold text-foreground">Appointment Management</h2>
                    <p className="text-foreground/50">Manage viewing schedules and property availability</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-sm text-foreground/70">
                        <span className="w-3 h-3 bg-accent rounded-full"></span> Confirmed
                    </div>
                    <div className="flex items-center gap-2 text-sm text-foreground/70">
                        <span className="w-3 h-3 bg-yellow-500 rounded-full"></span> Pending
                    </div>
                </div>
            </div>
            
            <div className="calendar-container">
                <FullCalendar
                    plugins={[dayGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,dayGridWeek'
                    }}
                    events={[
                        { title: 'Viewing: Sunset Villa', date: '2026-05-22', color: 'var(--color-accent)' },
                        { title: 'Contract Signing', date: '2026-05-24', color: '#10b981' },
                        { title: 'Pending: Hillside Condo', date: '2026-05-22', color: '#f59e0b' },
                    ]}
                    height="600px"
                    eventClick={(info) => alert('Event: ' + info.event.title)}
                />
            </div>

            <style jsx global>{`
                .fc { --fc-border-color: rgba(255,255,255,0.1); --fc-button-bg-color: var(--color-accent); --fc-button-border-color: var(--color-accent); --fc-button-text-color: var(--color-primary-dark); }
                .fc-toolbar-title { font-size: 1.25rem !important; font-weight: bold; color: var(--foreground); }
                .fc-daygrid-day { transition: background 0.2s; }
                .fc-daygrid-day:hover { background: rgba(255,255,255,0.05); }
                .fc-theme-standard td, .fc-theme-standard th { border: 1px solid rgba(255,255,255,0.05); }
            `}</style>
        </div>
      ) : (
        <div className="glass p-8 rounded-3xl shadow-xl border border-foreground/10">
            <h2 className="text-xl font-bold text-foreground mb-6">Submitted Listing Requests</h2>
            <p className="text-foreground/50 mb-8">Track the status of your house listing requests sent to the Admin.</p>
            
            <div className="space-y-4">
                {requests.length === 0 ? (
                    <div className="text-center py-20 text-foreground/20 italic">
                        You have no pending listing requests. Click "Request Listing" to get started.
                    </div>
                ) : (
                    requests.map((req) => (
                        <div key={req.id} className="p-6 glass rounded-2xl border border-foreground/10 flex flex-col md:flex-row justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h4 className="font-bold text-foreground">{req.title}</h4>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${req.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500' : req.status === 'APPROVED' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                        {req.status}
                                    </span>
                                </div>
                                <p className="text-sm text-foreground/60 mb-2">{req.address} • {req.currency} {parseFloat(req.price).toLocaleString()}</p>
                                <p className="text-xs text-foreground/40">Submitted on {new Date(req.created_at).toLocaleDateString()}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                {req.images?.length > 0 && (
                                    <div className="flex gap-1">
                                        {req.images.slice(0, 3).map((img: any, idx: number) => (
                                            <img key={idx} src={img.image} className="w-8 h-8 rounded-lg object-cover border border-white/10" />
                                        ))}
                                        {req.images.length > 3 && <span className="text-[10px] flex items-center text-foreground/40">+{req.images.length - 3}</span>}
                                    </div>
                                )}
                                {req.admin_comment && (
                                    <div className="bg-foreground/5 p-3 rounded-lg border border-foreground/10 text-sm italic text-foreground/70 max-w-md">
                                        <span className="font-bold not-italic text-accent">Admin: </span> "{req.admin_comment}"
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
      )}

      {/* Request Modal */}
      {isRequestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-primary-dark/80 backdrop-blur-md">
              <div className="bg-background w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-10 overflow-y-auto max-h-[90vh] border border-foreground/10">
                  <div className="flex justify-between items-center mb-8">
                      <h2 className="text-2xl font-bold text-foreground">Request House Listing</h2>
                      <button onClick={() => setRequestModal(false)} className="p-2 hover:bg-foreground/5 rounded-full text-foreground/30"><FiX size={24}/></button>
                  </div>
                  <form onSubmit={handleRequestListing} className="grid grid-cols-2 gap-6">
                      <div className="col-span-2">
                          <label className="text-xs font-bold text-foreground/40 uppercase">Property Title</label>
                          <input required type="text" value={newRequest.title} onChange={e => setNewRequest({...newRequest, title: e.target.value})} className="w-full mt-2 bg-foreground/5 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-accent outline-none text-foreground" placeholder="e.g. Modern Villa in Kigali" />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-foreground/40 uppercase">Currency</label>
                          <select value={newRequest.currency} onChange={e => setNewRequest({...newRequest, currency: e.target.value})} className="w-full mt-2 bg-foreground/5 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-accent outline-none text-foreground">
                              <option value="USD" className="bg-background">USD ($)</option>
                              <option value="RWF" className="bg-background">RWF (FRw)</option>
                              <option value="EUR" className="bg-background">EUR (€)</option>
                          </select>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-foreground/40 uppercase">Asking Price</label>
                          <input required type="number" value={newRequest.price} onChange={e => setNewRequest({...newRequest, price: e.target.value})} className="w-full mt-2 bg-foreground/5 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-accent outline-none text-foreground" placeholder="0.00" />
                      </div>
                      <div className="col-span-2">
                          <label className="text-xs font-bold text-foreground/40 uppercase">Physical Address</label>
                          <input required type="text" value={newRequest.address} onChange={e => setNewRequest({...newRequest, address: e.target.value})} className="w-full mt-2 bg-foreground/5 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-accent outline-none text-foreground" placeholder="Location details" />
                      </div>
                      <div><label className="text-xs font-bold text-foreground/40 uppercase">Beds</label><input type="number" value={newRequest.bedrooms} onChange={e => setNewRequest({...newRequest, bedrooms: parseInt(e.target.value) || 0})} className="w-full mt-2 bg-foreground/5 border-none rounded-xl px-4 py-3 text-foreground" /></div>
                      <div><label className="text-xs font-bold text-foreground/40 uppercase">Baths</label><input type="number" value={newRequest.bathrooms} onChange={e => setNewRequest({...newRequest, bathrooms: parseInt(e.target.value) || 0})} className="w-full mt-2 bg-foreground/5 border-none rounded-xl px-4 py-3 text-foreground" /></div>
                      <div className="col-span-2">
                          <label className="text-xs font-bold text-foreground/40 uppercase">Description</label>
                          <textarea rows={4} value={newRequest.description} onChange={e => setNewRequest({...newRequest, description: e.target.value})} className="w-full mt-2 bg-foreground/5 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-accent outline-none text-foreground resize-none"></textarea>
                      </div>
                      <div className="col-span-2">
                          <label className="text-xs font-bold text-foreground/40 uppercase flex items-center gap-2">
                             <ImageIcon size={14}/> House Photos (Upload Multiple)
                          </label>
                          <input 
                            type="file" 
                            multiple 
                            accept="image/*"
                            onChange={e => setRequestImages(e.target.files)}
                            className="w-full mt-2 bg-foreground/5 border border-dashed border-foreground/20 rounded-xl px-4 py-8 text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-primary-dark hover:file:opacity-80 cursor-pointer"
                          />
                          {requestImages && (
                              <p className="mt-2 text-xs text-accent font-bold">{requestImages.length} images selected</p>
                          )}
                      </div>
                      <button type="submit" className="col-span-2 py-4 bg-accent text-primary-dark rounded-2xl font-bold hover:opacity-90 transition shadow-xl mt-4 uppercase tracking-widest">Submit Request to Admin</button>
                  </form>
              </div>
          </div>
      )}
      {isExtendModal && selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-primary-dark/80 backdrop-blur-md">
              <div className="bg-background w-full max-w-xl rounded-[2.5rem] shadow-2xl p-10 overflow-y-auto max-h-[90vh] border border-foreground/10">
                  <div className="flex justify-between items-center mb-8">
                      <div>
                          <h2 className="text-2xl font-bold text-foreground">Extend Booking</h2>
                          <p className="text-sm text-foreground/60">Booking for {selectedBooking.property?.title || 'property'}</p>
                      </div>
                      <button onClick={() => setExtendModal(false)} className="p-2 hover:bg-foreground/5 rounded-full text-foreground/30"><FiX size={24}/></button>
                  </div>
                  <form onSubmit={handleExtendBooking} className="space-y-6">
                      <div>
                          <label className="text-xs font-bold text-foreground/40 uppercase">New End Date & Time</label>
                          <input
                              type="datetime-local"
                              value={extendEndDatetime}
                              onChange={e => setExtendEndDatetime(e.target.value)}
                              className="w-full mt-2 bg-foreground/5 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-accent outline-none text-foreground"
                              required
                          />
                      </div>
                      <button type="submit" className="w-full py-4 bg-accent text-primary-dark rounded-2xl font-bold hover:opacity-90 transition uppercase tracking-widest">Submit Extension</button>
                  </form>
              </div>
          </div>
      )}
      {isCounterModal && selectedOffer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-primary-dark/80 backdrop-blur-md">
              <div className="bg-background w-full max-w-xl rounded-[2.5rem] shadow-2xl p-10 overflow-y-auto max-h-[90vh] border border-foreground/10">
                  <div className="flex justify-between items-center mb-8 border-b border-foreground/5 pb-6">
                      <div>
                          <h2 className="text-2xl font-bold text-foreground">Counter Offer</h2>
                          <p className="text-sm text-foreground/60">Negotiating for {selectedOffer.property_details?.title}</p>
                      </div>
                      <button onClick={() => setCounterModal(false)} className="p-2 hover:bg-foreground/5 rounded-full text-foreground/30"><FiX size={24}/></button>
                  </div>
                  <form onSubmit={handleCounterOffer} className="space-y-6 pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-bold text-foreground/40 uppercase">Original Offer</label>
                            <p className="mt-2 text-xl font-bold text-foreground/30">{selectedOffer.currency} {parseFloat(selectedOffer.amount).toLocaleString()}</p>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-foreground/40 uppercase text-accent">Counter Amount</label>
                            <input
                                type="number"
                                value={counterData.amount}
                                onChange={e => setCounterData({...counterData, amount: e.target.value})}
                                className="w-full mt-2 bg-foreground/5 border border-accent/20 rounded-xl px-4 py-3 focus:ring-2 focus:ring-accent outline-none text-foreground font-bold"
                                required
                            />
                        </div>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-foreground/40 uppercase">Expiration Date (Optional)</label>
                          <input
                              type="date"
                              value={counterData.expires_at}
                              onChange={e => setCounterData({...counterData, expires_at: e.target.value})}
                              className="w-full mt-2 bg-foreground/5 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-accent outline-none text-foreground"
                          />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-foreground/40 uppercase">Message to Buyer</label>
                          <textarea
                              rows={3}
                              value={counterData.message}
                              onChange={e => setCounterData({...counterData, message: e.target.value})}
                              className="w-full mt-2 bg-foreground/5 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-accent outline-none text-foreground resize-none"
                              placeholder="Explain your counter-offer terms..."
                          />
                      </div>
                      <button type="submit" disabled={offerActionLoading} className="w-full py-4 bg-accent text-primary-dark rounded-2xl font-bold hover:opacity-90 transition uppercase tracking-widest flex items-center justify-center gap-2">
                          <Send size={18}/> {offerActionLoading ? "Sending..." : "Submit Counter Offer"}
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
}

function DashboardMetricCard({ label, value, icon, color }: any) {
    const colors: any = {
        blue: "bg-blue-500/10 text-blue-500",
        purple: "bg-purple-500/10 text-purple-500",
        orange: "bg-orange-500/10 text-orange-500",
        green: "bg-green-500/10 text-green-500"
    };

    return (
        <div className="glass p-6 rounded-xl shadow-sm border border-foreground/10 hover:border-accent/30 transition-all">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg ${colors[color]}`}>
                    {icon}
                </div>
                <span className="text-green-500 flex items-center gap-1 text-sm font-medium">
                    +12% <ArrowUpRight size={14} />
                </span>
            </div>
            <h3 className="text-foreground/50 text-sm font-medium">{label}</h3>
            <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
    );
}
