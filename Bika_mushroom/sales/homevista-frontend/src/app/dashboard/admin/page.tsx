"use client";

import React, { useState, useEffect } from "react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar
} from "recharts";
import { 
  Users, Home, DollarSign, TrendingUp, Activity, 
  ShieldCheck, AlertCircle, FileText, Download, 
  ExternalLink, CheckCircle, XCircle, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeView, setActiveTab] = useState<'overview' | 'audit' | 'finance'>('overview');

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await axios.get(`${API_URL}/analytics/admin_stats/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data);
      } catch (err) {
        console.error("Error fetching admin stats:", err);
        setError("Failed to load platform data. Ensure you are logged in as Admin.");
      } finally {
        setLoading(false);
      }
    };
    fetchAdminStats();
  }, []);

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

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
            <p className="text-gray-500 mb-6">{error}</p>
            <button 
                onClick={() => window.location.href = '/account'}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition"
            >
                Return to Login
            </button>
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
                    <button 
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeView === 'overview' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Overview
                    </button>
                    <button 
                        onClick={() => setActiveTab('finance')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeView === 'finance' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Financials
                    </button>
                    <button 
                        onClick={() => setActiveTab('audit')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeView === 'audit' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Audit Logs
                    </button>
                </div>
                <button 
                    onClick={handleGenerateReport}
                    className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-black transition text-sm font-bold"
                >
                    <Download size={16} /> Generate Report
                </button>
            </div>
        </div>
      </div>

      <main className="p-8 max-w-[1600px] mx-auto">
        <AnimatePresence mode="wait">
          {activeView === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard 
                    label="Total Users" 
                    value={data.metrics.total_users} 
                    icon={<Users />} 
                    color="blue"
                    trend="+14% this month"
                />
                <MetricCard 
                    label="Active Properties" 
                    value={data.metrics.total_properties} 
                    icon={<Home />} 
                    color="purple"
                    trend="+8% this month"
                />
                <MetricCard 
                    label="Platform Revenue" 
                    value={`$${data.metrics.total_revenue.toLocaleString()}`} 
                    icon={<DollarSign />} 
                    color="green"
                    trend="+22.5% vs Q1"
                />
                <MetricCard 
                    label="Pending Tasks" 
                    value={data.metrics.pending_kyc + data.metrics.pending_payments} 
                    icon={<Activity />} 
                    color="orange"
                    trend="Requires action"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Growth Chart */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-8">Platform Engagement Growth</h3>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.charts.growth}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                                <Tooltip 
                                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                                />
                                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* User Distribution */}
                <div className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-8">Role Distribution</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.charts.user_distribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="count"
                                    nameKey="role"
                                >
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

              {/* Action Center */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-800">Critical Approvals</h3>
                        <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-bold">
                            {data.metrics.pending_kyc} KYC Pending
                        </span>
                    </div>
                    <div className="space-y-4">
                        {data.metrics.pending_kyc > 0 ? (
                            <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-600 text-white rounded-xl">
                                        <Users size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">Review KYC Applications</p>
                                        <p className="text-sm text-gray-500">New owners waiting for verification</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={handleResolveAllKYC}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition"
                                    >
                                        Approve All
                                    </button>
                                    <button 
                                        onClick={() => window.location.href = '/admin/verification/kycrequest/'}
                                        className="bg-white text-blue-600 px-4 py-2 rounded-lg font-bold border border-blue-200 hover:bg-blue-50 transition"
                                    >
                                        Portal
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-10 text-gray-400">
                                <CheckCircle className="mx-auto mb-2 opacity-20" size={40} />
                                <p>All KYC requests resolved</p>
                            </div>
                        )}
                        
                        <div className="p-6 bg-green-50 rounded-2xl border border-green-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-600 text-white rounded-xl">
                                    <DollarSign size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">Verify Payment Proofs</p>
                                    <p className="text-sm text-gray-500">{data.metrics.pending_payments} payments under review</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => window.location.href = '/admin/bookings/booking/'}
                                className="bg-white text-green-600 px-4 py-2 rounded-lg font-bold border border-green-200 hover:bg-green-50 transition"
                            >
                                Resolve
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Recent Platform Events</h3>
                    <div className="space-y-4">
                        {data.recent_activity.map((event: any, i: number) => (
                            <div key={i} className="flex gap-4 p-4 hover:bg-gray-50 rounded-xl transition cursor-default">
                                <div className={`w-2 h-10 rounded-full ${
                                    event.action.includes('CREATED') ? 'bg-green-500' : 
                                    event.action.includes('DELETED') ? 'bg-red-500' : 'bg-blue-500'
                                }`}></div>
                                <div className="flex-1">
                                    <div className="flex justify-between">
                                        <p className="text-sm font-bold text-gray-800">{event.action.replace('_', ' ')}</p>
                                        <span className="text-[10px] text-gray-400 uppercase font-bold">{new Date(event.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Resource: <span className="text-gray-700 font-medium">{event.resource}</span> (#{event.resource_id})</p>
                                </div>
                                <div className="text-xs font-medium text-gray-400 self-center">
                                    By {event.user_email?.split('@')[0] || 'System'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeView === 'finance' && (
            <motion.div 
              key="finance"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
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
                                <button className="w-full py-4 bg-white text-black rounded-2xl font-bold hover:bg-gray-100 transition shadow-lg mt-4">
                                    Export P&L Statement
                                </button>
                            </div>
                        </div>
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-600/10 blur-3xl rounded-full -mr-32 -mb-32" />
                    </div>
                </div>
            </motion.div>
          )}

          {activeView === 'audit' && (
            <motion.div 
              key="audit"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden"
            >
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Immutable Audit Trail</h3>
                        <p className="text-sm text-gray-500">Chronological history of all platform resource mutations</p>
                    </div>
                    <div className="flex gap-2">
                        <input type="text" placeholder="Filter by User or ID..." className="px-4 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64" />
                        <button className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"><Activity size={20}/></button>
                    </div>
                </div>
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                            <th className="px-8 py-4">Action</th>
                            <th className="px-8 py-4">Resource</th>
                            <th className="px-8 py-4">ID</th>
                            <th className="px-8 py-4">Performed By</th>
                            <th className="px-8 py-4">Timestamp</th>
                            <th className="px-8 py-4">IP Address</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data.recent_activity.map((event: any, i: number) => (
                            <tr key={i} className="hover:bg-blue-50/30 transition">
                                <td className="px-8 py-5">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                                        event.action.includes('CREATED') ? 'bg-green-100 text-green-700' : 
                                        event.action.includes('DELETED') ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                        {event.action}
                                    </span>
                                </td>
                                <td className="px-8 py-5 text-sm font-medium text-gray-700">{event.resource}</td>
                                <td className="px-8 py-5 text-sm font-mono text-gray-400">{event.resource_id}</td>
                                <td className="px-8 py-5 text-sm text-gray-600 font-medium">{event.user_email || 'System'}</td>
                                <td className="px-8 py-5 text-sm text-gray-500">{new Date(event.timestamp).toLocaleString()}</td>
                                <td className="px-8 py-5 text-xs font-mono text-gray-400">{event.ip_address || 'Internal'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="p-6 bg-gray-50 border-t border-gray-100 text-center">
                    <button className="text-blue-600 font-bold text-sm hover:underline">Load Full Audit History</button>
                </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
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
