"use client";

import { useEffect, useState } from "react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, Cell
} from "recharts";
import { 
  Home, Eye, CheckCircle, TrendingUp, AlertCircle, Clock, 
  ArrowUpRight, Download, ShieldCheck, Calendar as CalendarIcon,
  Plus, X as FiX, Image as ImageIcon
} from "lucide-react";
import api from "@/utils/api";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

export default function OwnerDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analytics' | 'calendar' | 'requests'>('analytics');
  const [isRequestModal, setRequestModal] = useState(false);
  const [newRequest, setNewRequest] = useState({
    title: "", price: "", currency: "USD", address: "", 
    bedrooms: 2, bathrooms: 2, size: 1000, description: ""
  });
  const [requestImages, setRequestImages] = useState<FileList | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, reqsRes] = await Promise.all([
        api.get("/analytics/owner_dashboard/"),
        api.get("/properties/requests/")
      ]);
      setStats(statsRes.data);
      setRequests(reqsRes.data.results || reqsRes.data);
    } catch (err) {
      console.error("Error fetching owner data:", err);
    } finally {
      setLoading(false);
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
