"use client";

import React, { useState, useEffect } from "react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar
} from "recharts";
import { 
  Users, Home, DollarSign, TrendingUp, Activity, 
  ShieldCheck, AlertCircle, FileText, Download, 
  ExternalLink, CheckCircle, XCircle, ArrowUpRight, ArrowDownRight,
  Plus, MapPin, Search, Filter, Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import dynamic from "next/dynamic";

const PropertyMap = dynamic(() => import("@/components/ui/PropertyMap"), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeView, setActiveTab] = useState<'overview' | 'audit' | 'finance' | 'inventory'>('overview');
  const [isModalOpen, setIsModal] = useState(false);

  // New Property Form State
  const [newProp, setNewProp] = useState({
      title: "", price: "", currency: "USD", address: "", 
      bedrooms: 2, bathrooms: 2, size: 1000, description: "",
      latitude: -1.9441, longitude: 30.0619
  });

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const [statsRes, propsRes] = await Promise.all([
            axios.get(`${API_URL}/analytics/admin_stats/`, { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(`${API_URL}/properties/`)
        ]);
        setData(statsRes.data);
        setProperties(propsRes.data);
      } catch (err) {
        console.error("Error fetching admin data:", err);
        setError("Failed to load platform data. Ensure you are logged in as Admin.");
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const token = localStorage.getItem("accessToken");
        await axios.post(`${API_URL}/properties/`, newProp, {
            headers: { Authorization: `Bearer ${token}` }
        });
        alert("Property Added Successfully!");
        setIsModal(false);
        window.location.reload();
    } catch (err) {
        alert("Error creating property. Check console for details.");
    }
  };

  const handleGenerateReport = async () => {
    try {
        const token = localStorage.getItem("accessToken");
        const response = await axios.get(`${API_URL}/analytics/generate_report/`, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'HomeVista_Status_Report.pdf');
        document.body.appendChild(link);
        link.click();
    } catch (err) {
        alert("Error generating report");
    }
  };

  const handleResolveAllKYC = async () => {
    if (!confirm("Are you sure you want to approve all pending KYC requests?")) return;
    try {
        const token = localStorage.getItem("accessToken");
        await axios.post(`${API_URL}/analytics/resolve_all_kyc/`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        alert("All KYC requests resolved successfully");
        window.location.reload();
    } catch (err) {
        alert("Error resolving requests");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium">Initializing Command Center...</p>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Sidebar-style Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 px-8 py-4">
        <div className="flex justify-between items-center max-w-[1600px] mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                   <ShieldCheck className="text-blue-600" /> Platform Administration
                </h1>
                <p className="text-sm text-gray-500">Enterprise Monitoring & Governance</p>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeView === 'overview' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Overview</button>
                    <button onClick={() => setActiveTab('inventory')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeView === 'inventory' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Inventory</button>
                    <button onClick={() => setActiveTab('finance')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeView === 'finance' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Financials</button>
                    <button onClick={() => setActiveTab('audit')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeView === 'audit' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Audit Logs</button>
                </div>
                <button onClick={handleGenerateReport} className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-black transition text-sm font-bold">
                    <Download size={16} /> Generate Report
                </button>
            </div>
        </div>
      </div>

      <main className="p-8 max-w-[1600px] mx-auto">
        <AnimatePresence mode="wait">
          {activeView === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              {/* Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard label="Total Users" value={data.metrics.total_users} icon={<Users />} color="blue" trend="+14% this month" />
                <MetricCard label="Active Properties" value={data.metrics.total_properties} icon={<Home />} color="purple" trend="+8% this month" />
                <MetricCard label="Platform Revenue" value={`$${data.metrics.total_revenue.toLocaleString()}`} icon={<DollarSign />} color="green" trend="+22.5% vs Q1" />
                <MetricCard label="Pending Tasks" value={data.metrics.pending_kyc + data.metrics.pending_payments} icon={<Activity />} color="orange" trend="Requires action" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Map Summary Section */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-800">Global Inventory Distribution</h3>
                        <button onClick={() => setActiveTab('inventory')} className="text-blue-600 text-sm font-bold flex items-center gap-1">Manage All <ArrowUpRight size={14}/></button>
                    </div>
                    <div className="h-[400px] rounded-2xl overflow-hidden border border-gray-100">
                         <PropertyMap properties={properties} />
                    </div>
                </div>

                {/* User Distribution */}
                <div className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-8">Role Distribution</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={data.charts.user_distribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="count" nameKey="role">
                                    {data.charts.user_distribution.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-8 space-y-4">
                        {data.charts.user_distribution.map((item: any, i: number) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                                    <span className="text-sm font-medium text-gray-600 uppercase">{item.role}</span>
                                </div>
                                <span className="text-sm font-bold text-gray-900">{item.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeView === 'inventory' && (
            <motion.div key="inventory" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">Enterprise Inventory</h2>
                    <button 
                        onClick={() => setIsModal(true)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 hover:bg-blue-700 transition"
                    >
                        <Plus size={20}/> Add New Property
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4 max-h-[700px] overflow-y-auto pr-2 no-scrollbar">
                        {properties.map((p) => (
                            <div key={p.id} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex gap-6 group hover:border-blue-200 transition">
                                <img src={p.images?.[0]?.image || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=300&auto=format&fit=crop"} className="w-40 h-32 rounded-2xl object-cover" />
                                <div className="flex-1">
                                    <div className="flex justify-between">
                                        <h4 className="font-bold text-lg text-gray-800">{p.title}</h4>
                                        <div className="flex gap-2">
                                            <button className="p-2 text-gray-400 hover:text-blue-600 transition"><ExternalLink size={18}/></button>
                                            <button className="p-2 text-gray-400 hover:text-red-600 transition"><Trash2 size={18}/></button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 flex items-center gap-1 mb-4"><MapPin size={14}/> {p.address}</p>
                                    <div className="flex justify-between items-center mt-auto">
                                        <div className="flex gap-4 text-xs text-gray-400 font-medium">
                                            <span>{p.bedrooms} Beds</span>
                                            <span>{p.bathrooms} Baths</span>
                                            <span>{p.size} Sqm</span>
                                        </div>
                                        <span className="text-xl font-black text-blue-600">{p.currency} {parseFloat(p.price).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-2 h-[700px]">
                        <PropertyMap properties={properties} />
                    </div>
                </div>
            </motion.div>
          )}

          {activeView === 'finance' && (
            <motion.div key="finance" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm col-span-2">
                        <h3 className="text-lg font-bold text-gray-800 mb-8">Consolidated Financial Distribution</h3>
                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.charts.financials}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `$${v.toLocaleString()}`} />
                                    <Tooltip cursor={{fill: '#F8FAFC'}} contentStyle={{borderRadius: '16px', border: 'none'}} />
                                    <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                                        {data.charts.financials.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : index === 1 ? '#3b82f6' : '#ef4444'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="bg-gray-900 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-xl font-bold mb-8">Profit Estimation</h3>
                            <div className="space-y-8">
                                <div>
                                    <p className="text-gray-400 text-sm mb-1 uppercase tracking-widest">Net Profit Margin (5%)</p>
                                    <h4 className="text-4xl font-bold text-green-400">${data.metrics.estimated_profit.toLocaleString()}</h4>
                                </div>
                                <div className="pt-8 border-t border-white/10">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-gray-400">Operating Cost</span>
                                        <span className="text-red-400">-${data.metrics.estimated_cost.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Total Volume</span>
                                        <span className="text-blue-400 font-bold">${data.metrics.total_revenue.toLocaleString()}</span>
                                    </div>
                                </div>
                                <button onClick={handleGenerateReport} className="w-full py-4 bg-white text-black rounded-2xl font-bold hover:bg-gray-100 transition shadow-lg mt-4">Export P&L Statement</button>
                            </div>
                        </div>
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-600/10 blur-3xl rounded-full -mr-32 -mb-32" />
                    </div>
                </div>
            </motion.div>
          )}

          {activeView === 'audit' && (
            <motion.div key="audit" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden">
                {/* Audit Table (same as before) */}
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div><h3 className="text-xl font-bold text-gray-900">Immutable Audit Trail</h3></div>
                </div>
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                            <th className="px-8 py-4">Action</th>
                            <th className="px-8 py-4">Resource</th>
                            <th className="px-8 py-4">ID</th>
                            <th className="px-8 py-4">Performed By</th>
                            <th className="px-8 py-4">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data.recent_activity.map((event: any, i: number) => (
                            <tr key={i} className="hover:bg-blue-50/30 transition">
                                <td className="px-8 py-5">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${event.action.includes('CREATED') ? 'bg-green-100 text-green-700' : event.action.includes('DELETED') ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {event.action}
                                    </span>
                                </td>
                                <td className="px-8 py-5 text-sm font-medium text-gray-700">{event.resource}</td>
                                <td className="px-8 py-5 text-sm font-mono text-gray-400">{event.resource_id}</td>
                                <td className="px-8 py-5 text-sm text-gray-600 font-medium">{event.user_email || 'System'}</td>
                                <td className="px-8 py-5 text-sm text-gray-500">{new Date(event.timestamp).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Add Property Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
              <motion.div initial={{scale: 0.9, opacity: 0}} animate={{scale: 1, opacity: 1}} className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-10 overflow-y-auto max-h-[90vh]">
                  <div className="flex justify-between items-center mb-8">
                      <h2 className="text-2xl font-bold text-gray-900">List New Enterprise Property</h2>
                      <button onClick={() => setIsModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><XCircle/></button>
                  </div>
                  <form onSubmit={handleCreateProperty} className="grid grid-cols-2 gap-6">
                      <div className="col-span-2">
                          <label className="text-xs font-bold text-gray-400 uppercase">Property Title</label>
                          <input required type="text" value={newProp.title} onChange={e => setNewProp({...newProp, title: e.target.value})} className="w-full mt-2 bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Skyline Executive Penthouse" />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-400 uppercase">Currency</label>
                          <select value={newProp.currency} onChange={e => setNewProp({...newProp, currency: e.target.value})} className="w-full mt-2 bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none">
                              <option value="USD">USD ($)</option>
                              <option value="RWF">RWF (FRw)</option>
                              <option value="EUR">EUR (€)</option>
                              <option value="GBP">GBP (£)</option>
                          </select>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-400 uppercase">Asking Price</label>
                          <input required type="number" value={newProp.price} onChange={e => setNewProp({...newProp, price: e.target.value})} className="w-full mt-2 bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0.00" />
                      </div>
                      <div className="col-span-2">
                          <label className="text-xs font-bold text-gray-400 uppercase">Physical Address</label>
                          <input required type="text" value={newProp.address} onChange={e => setNewProp({...newProp, address: e.target.value})} className="w-full mt-2 bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Street, City, Country" />
                      </div>
                      <div><label className="text-xs font-bold text-gray-400 uppercase">Beds</label><input type="number" value={newProp.bedrooms} onChange={e => setNewProp({...newProp, bedrooms: parseInt(e.target.value)})} className="w-full mt-2 bg-gray-50 border-none rounded-xl px-4 py-3" /></div>
                      <div><label className="text-xs font-bold text-gray-400 uppercase">Baths</label><input type="number" value={newProp.bathrooms} onChange={e => setNewProp({...newProp, bathrooms: parseInt(e.target.value)})} className="w-full mt-2 bg-gray-50 border-none rounded-xl px-4 py-3" /></div>
                      <div className="col-span-2">
                          <label className="text-xs font-bold text-gray-400 uppercase">Description</label>
                          <textarea rows={4} value={newProp.description} onChange={e => setNewProp({...newProp, description: e.target.value})} className="w-full mt-2 bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
                      </div>
                      <button type="submit" className="col-span-2 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition shadow-xl mt-4">PUBLISH ENTERPRISE LISTING</button>
                  </form>
              </motion.div>
          </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, icon, color, trend }: any) {
    const colors: any = {
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        purple: "bg-purple-50 text-purple-600 border-purple-100",
        green: "bg-green-50 text-green-600 border-green-100",
        orange: "bg-orange-50 text-orange-600 border-orange-100"
    };

    return (
        <div className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-all duration-300">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${colors[color]}`}>
                {React.cloneElement(icon, { size: 28 })}
            </div>
            <p className="text-gray-500 text-sm font-medium uppercase tracking-widest mb-1">{label}</p>
            <h4 className="text-3xl font-bold text-gray-900">{value}</h4>
            <p className="text-xs mt-4 flex items-center gap-1 font-medium">
                {trend.includes('+') ? <ArrowUpRight size={14} className="text-green-500" /> : <Activity size={14} className="text-orange-500" />}
                <span className={trend.includes('+') ? 'text-green-600' : 'text-orange-600'}>{trend}</span>
            </p>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-full -mr-12 -mt-12 group-hover:bg-blue-50 transition-colors" />
        </div>
    );
}
