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
  Plus, MapPin, Search, Filter, Trash2, ClipboardList, Edit, UserPlus, Mail, Phone, Image as ImageIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/utils/api";
import dynamic from "next/dynamic";
import Link from "next/link";

const PropertyMap = dynamic(() => import("@/components/ui/PropertyMap"), { ssr: false });

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [owners, setOwners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeView, setActiveTab] = useState<'overview' | 'audit' | 'finance' | 'inventory' | 'requests' | 'users'>('overview');
  const [isModalOpen, setIsModal] = useState(false);
  const [isUserModalOpen, setIsUserModal] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // New Property Form State
  const [newProp, setNewProp] = useState({
      title: "", price: "", currency: "USD", address: "", 
      bedrooms: 2, bathrooms: 2, size: 1000, description: "",
      latitude: -1.9441, longitude: 30.0619,
      owner_id: ""
  });
  const [propImages, setPropImages] = useState<FileList | null>(null);

  // User Form State (Creation & Edit)
  const [userForm, setUserForm] = useState({
      email: "", full_name: "", role: "CUSTOMER", phone: "", password: ""
  });

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [statsRes, propsRes, reqsRes, usersRes] = await Promise.all([
          api.get("/analytics/admin_stats/"),
          api.get("/properties/"),
          api.get("/properties/requests/"),
          api.get("/users/")
      ]);
      setData(statsRes.data);
      setProperties(propsRes.data.results || propsRes.data);
      setRequests(reqsRes.data.results || reqsRes.data);
      
      const userData = usersRes.data.results || usersRes.data;
      setUsers(userData);
      setOwners(userData.filter((u: any) => u.role === 'OWNER'));
    } catch (err: any) {
      console.error("Error fetching admin data:", err);
      setError(err.response?.status === 401 ? "Unauthorized. Please log in as Admin." : "Failed to load platform data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const formData = new FormData();
        Object.entries(newProp).forEach(([key, value]) => {
            if (value !== "") formData.append(key, value.toString());
        });
        
        if (propImages) {
            for (let i = 0; i < propImages.length; i++) {
                formData.append('images', propImages[i]);
            }
        }
        
        await api.post("/properties/", formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert("Property Added Successfully!");
        setIsModal(false);
        setPropImages(null);
        fetchAllData();
    } catch (err) {
        alert("Error creating property.");
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        if (isEditingUser && selectedUserId) {
            // Update logic
            const payload = { ...userForm };
            if (!payload.password) delete (payload as any).password;
            await api.patch(`/users/${selectedUserId}/`, payload);
            alert("User Updated Successfully!");
        } else {
            // Create logic
            await api.post("/users/", userForm);
            alert("User Created Successfully!");
        }
        setIsUserModal(false);
        fetchAllData();
    } catch (err) {
        alert("Error saving user. Check if email already exists.");
    }
  };

  const handleEditUserClick = (u: any) => {
      setSelectedUserId(u.id);
      setUserForm({
          email: u.email,
          full_name: u.full_name,
          role: u.role,
          phone: u.phone || "",
          password: "" // Don't show old password
      });
      setIsEditingUser(true);
      setIsUserModal(true);
  };

  const handleAddNewUserClick = () => {
      setSelectedUserId(null);
      setUserForm({ email: "", full_name: "", role: "CUSTOMER", phone: "", password: "" });
      setIsEditingUser(false);
      setIsUserModal(true);
  };

  const handleDeleteUser = async (id: number) => {
      if (!confirm("Are you sure you want to delete this user?")) return;
      try {
          await api.delete(`/users/${id}/`);
          alert("User Deleted Successfully");
          fetchAllData();
      } catch (err) {
          alert("Error deleting user.");
      }
  };

  const handleApproveRequest = async (id: number) => {
    try {
        await api.post(`/properties/requests/${id}/approve/`);
        alert("Request Approved and Property Created!");
        fetchAllData();
    } catch (err) {
        alert("Error approving request");
    }
  };

  const handleRejectRequest = async (id: number) => {
    const reason = prompt("Enter rejection reason:");
    if (reason === null) return;
    try {
        await api.post(`/properties/requests/${id}/reject/`, { admin_comment: reason });
        alert("Request Rejected");
        fetchAllData();
    } catch (err) {
        alert("Error rejecting request");
    }
  };

  const handleGenerateReport = async () => {
    try {
        const response = await api.get("/analytics/generate_report/", {
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            <p className="text-foreground/60 font-medium">Initializing Command Center...</p>
        </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="glass p-8 rounded-3xl text-center max-w-md">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-foreground">Access Denied</h2>
            <p className="text-foreground/60 mb-6">{error}</p>
            <Link href="/account" className="bg-accent text-primary-dark px-8 py-3 rounded-xl font-bold inline-block">Log In Again</Link>
        </div>
    </div>
  );

  if (!data) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar-style Header */}
      <div className="bg-background/80 backdrop-blur-md border-b border-foreground/10 sticky top-0 z-30 px-8 py-4">
        <div className="flex justify-between items-center max-w-[1600px] mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                   <ShieldCheck className="text-accent" /> Platform Administration
                </h1>
                <p className="text-sm text-foreground/50">Enterprise Monitoring & Governance (Rwanda)</p>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex bg-foreground/5 p-1 rounded-xl">
                    <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeView === 'overview' ? 'bg-background shadow-sm text-accent font-bold' : 'text-foreground/60 hover:text-foreground'}`}>Overview</button>
                    <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeView === 'users' ? 'bg-background shadow-sm text-accent font-bold' : 'text-foreground/60 hover:text-foreground'}`}>Users</button>
                    <button onClick={() => setActiveTab('inventory')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeView === 'inventory' ? 'bg-background shadow-sm text-accent font-bold' : 'text-foreground/60 hover:text-foreground'}`}>Inventory</button>
                    <button onClick={() => setActiveTab('requests')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeView === 'requests' ? 'bg-background shadow-sm text-accent font-bold' : 'text-foreground/60 hover:text-foreground'}`}>Requests</button>
                    <button onClick={() => setActiveTab('finance')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeView === 'finance' ? 'bg-background shadow-sm text-accent font-bold' : 'text-foreground/60 hover:text-foreground'}`}>Financials</button>
                    <button onClick={() => setActiveTab('audit')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeView === 'audit' ? 'bg-background shadow-sm text-accent font-bold' : 'text-foreground/60 hover:text-foreground'}`}>Audit Logs</button>
                </div>
                <button onClick={handleGenerateReport} className="flex items-center gap-2 bg-accent text-primary-dark px-4 py-2 rounded-xl hover:opacity-90 transition text-sm font-bold">
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
                <MetricCard label="Pending Tasks" value={requests.filter(r => r.status === 'PENDING').length} icon={<ClipboardList />} color="orange" trend="Listing requests" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Map Summary Section */}
                <div className="lg:col-span-2 glass p-8 rounded-[2rem] border border-foreground/10 shadow-sm overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-foreground">Global Inventory Distribution</h3>
                        <button onClick={() => setActiveTab('inventory')} className="text-accent text-sm font-bold flex items-center gap-1">Manage All <ArrowUpRight size={14}/></button>
                    </div>
                    <div className="h-[400px] rounded-2xl overflow-hidden border border-foreground/5">
                         <PropertyMap key="overview-map" properties={properties} />
                    </div>
                </div>

                {/* User Distribution */}
                <div className="glass p-8 rounded-[2rem] border border-foreground/10 shadow-sm">
                    <h3 className="text-lg font-bold text-foreground mb-8">Role Distribution</h3>
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
                                    <span className="text-sm font-medium text-foreground/60 uppercase">{item.role}</span>
                                </div>
                                <span className="text-sm font-bold text-foreground">{item.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeView === 'users' && (
            <motion.div key="users" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-foreground">User Management</h2>
                    <button 
                        onClick={handleAddNewUserClick}
                        className="bg-accent text-primary-dark px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg hover:scale-105 transition-transform"
                    >
                        <UserPlus size={20}/> Add New User
                    </button>
                </div>

                <div className="glass rounded-[2rem] border border-foreground/10 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-foreground/5 text-[10px] font-bold text-foreground/40 uppercase tracking-widest border-b border-foreground/10">
                                <th className="px-8 py-4">User</th>
                                <th className="px-8 py-4">Role</th>
                                <th className="px-8 py-4">Contact</th>
                                <th className="px-8 py-4">Joined</th>
                                <th className="px-8 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-foreground/10">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-accent/5 transition">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold">
                                                {u.full_name[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground">{u.full_name}</p>
                                                <p className="text-xs text-foreground/50">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${u.role === 'ADMIN' ? 'bg-red-500/10 text-red-500' : u.role === 'OWNER' ? 'bg-purple-500/10 text-purple-500' : 'bg-green-500/10 text-green-500'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="space-y-1">
                                            <p className="text-xs flex items-center gap-1 text-foreground/70"><Mail size={12}/> {u.email}</p>
                                            <p className="text-xs flex items-center gap-1 text-foreground/70"><Phone size={12}/> {u.phone || 'N/A'}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-sm text-foreground/50">
                                        {new Date(u.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEditUserClick(u)} className="p-2 text-foreground/40 hover:text-accent transition"><Edit size={16}/></button>
                                            <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-foreground/40 hover:text-red-500 transition"><Trash2 size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
          )}

          {activeView === 'inventory' && (
            <motion.div key="inventory" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-foreground">Enterprise Inventory</h2>
                    <button 
                        onClick={() => setIsModal(true)}
                        className="bg-accent text-primary-dark px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg hover:scale-105 transition-transform"
                    >
                        <Plus size={20}/> Add New Property
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4 max-h-[700px] overflow-y-auto pr-2 no-scrollbar">
                        {properties.map((p) => (
                            <div key={p.id} className="glass p-4 rounded-3xl border border-foreground/10 shadow-sm flex gap-6 group hover:border-accent/30 transition">
                                <img src={p.images?.[0]?.image || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=300&auto=format&fit=crop"} className="w-40 h-32 rounded-2xl object-cover" />
                                <div className="flex-1">
                                    <div className="flex justify-between">
                                        <h4 className="font-bold text-lg text-foreground">{p.title}</h4>
                                        <div className="flex gap-2">
                                            <button className="p-2 text-foreground/40 hover:text-accent transition"><ExternalLink size={18}/></button>
                                            <button className="p-2 text-foreground/40 hover:text-red-500 transition"><Trash2 size={18}/></button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-foreground/60 flex items-center gap-1 mb-2"><MapPin size={14}/> {p.address}</p>
                                    <p className="text-xs text-accent font-bold mb-4 uppercase tracking-widest">OWNER: {p.owner?.full_name || 'N/A'}</p>
                                    <div className="flex justify-between items-center mt-auto">
                                        <div className="flex gap-4 text-xs text-foreground/40 font-medium">
                                            <span>{p.bedrooms} Beds</span>
                                            <span>{p.bathrooms} Baths</span>
                                            <span>{p.size} Sqm</span>
                                        </div>
                                        <span className="text-xl font-black text-accent">{p.currency} {parseFloat(p.price).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="glass rounded-3xl border border-foreground/10 shadow-sm p-2 h-[700px]">
                        <PropertyMap key="inventory-map" properties={properties} />
                    </div>
                </div>
            </motion.div>
          )}

          {activeView === 'requests' && (
            <motion.div key="requests" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <h2 className="text-2xl font-bold text-foreground">Property Listing Requests</h2>
                <div className="grid grid-cols-1 gap-6">
                    {requests.length === 0 ? (
                        <div className="glass p-12 rounded-[2.5rem] text-center text-foreground/20 italic border border-foreground/10">
                            No property listing requests found.
                        </div>
                    ) : (
                        requests.map((req) => (
                            <div key={req.id} className="glass p-8 rounded-[2rem] border border-foreground/10 shadow-sm flex flex-col md:flex-row justify-between gap-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${req.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500' : req.status === 'APPROVED' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                            {req.status}
                                        </span>
                                        <span className="text-foreground/30 text-xs">{new Date(req.created_at).toLocaleString()}</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground mb-2">{req.title}</h3>
                                    <p className="text-foreground/60 text-sm mb-4">{req.description}</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div><p className="text-foreground/40 uppercase text-[10px] font-bold mb-1">Price</p><p className="font-bold text-foreground">{req.currency} {parseFloat(req.price).toLocaleString()}</p></div>
                                        <div><p className="text-foreground/40 uppercase text-[10px] font-bold mb-1">Address</p><p className="font-bold text-foreground">{req.address}</p></div>
                                        <div><p className="text-foreground/40 uppercase text-[10px] font-bold mb-1">Specs</p><p className="font-bold text-foreground">{req.bedrooms}B / {req.bathrooms}B / {req.size}Sqm</p></div>
                                        <div><p className="text-foreground/40 uppercase text-[10px] font-bold mb-1">Owner</p><p className="font-bold text-accent">{req.owner?.full_name}</p></div>
                                    </div>
                                </div>
                                {req.status === 'PENDING' && (
                                    <div className="flex md:flex-col justify-end gap-3">
                                        <button onClick={() => handleApproveRequest(req.id)} className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-green-700 transition flex items-center gap-2">
                                            <CheckCircle size={16}/> Approve
                                        </button>
                                        <button onClick={() => handleRejectRequest(req.id)} className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-red-700 transition flex items-center gap-2">
                                            <XCircle size={16}/> Reject
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </motion.div>
          )}

          {activeView === 'finance' && (
            <motion.div key="finance" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="glass p-8 rounded-[2rem] border border-foreground/10 shadow-sm col-span-2">
                        <h3 className="text-lg font-bold text-foreground mb-8">Consolidated Financial Distribution</h3>
                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.charts.financials}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'currentColor', opacity: 0.5}} />
                                    <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `$${v.toLocaleString()}`} tick={{fill: 'currentColor', opacity: 0.5}} />
                                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.02)'}} contentStyle={{borderRadius: '16px', border: 'none', background: 'var(--background)', color: 'var(--foreground)'}} />
                                    <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                                        {data.charts.financials.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : index === 1 ? '#3b82f6' : '#ef4444'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="bg-primary text-luxury-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-xl font-bold mb-8">Profit Estimation</h3>
                            <div className="space-y-8">
                                <div>
                                    <p className="text-luxury-white/40 text-sm mb-1 uppercase tracking-widest font-bold">Net Profit Margin (5%)</p>
                                    <h4 className="text-4xl font-bold text-green-400">${data.metrics.estimated_profit.toLocaleString()}</h4>
                                </div>
                                <div className="pt-8 border-t border-luxury-white/10">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-luxury-white/60">Operating Cost</span>
                                        <span className="text-red-400">-${data.metrics.estimated_cost.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-luxury-white/60">Total Volume</span>
                                        <span className="text-accent font-bold">${data.metrics.total_revenue.toLocaleString()}</span>
                                    </div>
                                </div>
                                <button onClick={handleGenerateReport} className="w-full py-4 bg-accent text-primary-dark rounded-2xl font-bold hover:opacity-90 transition shadow-lg mt-4 uppercase tracking-widest">Export P&L Statement</button>
                            </div>
                        </div>
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-accent/10 blur-3xl rounded-full -mr-32 -mb-32" />
                    </div>
                </div>
            </motion.div>
          )}

          {activeView === 'audit' && (
            <motion.div key="audit" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass rounded-[2.5rem] border border-foreground/10 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-foreground/10 flex justify-between items-center bg-foreground/5">
                    <div><h3 className="text-xl font-bold text-foreground">Immutable Audit Trail</h3></div>
                </div>
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-foreground/5 text-[10px] font-bold text-foreground/40 uppercase tracking-widest border-b border-foreground/10">
                            <th className="px-8 py-4">Action</th>
                            <th className="px-8 py-4">Resource</th>
                            <th className="px-8 py-4">ID</th>
                            <th className="px-8 py-4">Performed By</th>
                            <th className="px-8 py-4">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-foreground/10">
                        {data.recent_activity.map((event: any, i: number) => (
                            <tr key={i} className="hover:bg-accent/5 transition">
                                <td className="px-8 py-5">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${event.action.includes('CREATED') ? 'bg-green-500/10 text-green-500' : event.action.includes('DELETED') ? 'bg-red-500/10 text-red-500' : 'bg-accent/10 text-accent'}`}>
                                        {event.action}
                                    </span>
                                </td>
                                <td className="px-8 py-5 text-sm font-medium text-foreground/70">{event.resource}</td>
                                <td className="px-8 py-5 text-sm font-mono text-foreground/30">{event.resource_id}</td>
                                <td className="px-8 py-5 text-sm text-foreground/70 font-medium">{event.user_email || 'System'}</td>
                                <td className="px-8 py-5 text-sm text-foreground/50">{new Date(event.timestamp).toLocaleString()}</td>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-primary-dark/80 backdrop-blur-md">
              <motion.div initial={{scale: 0.9, opacity: 0}} animate={{scale: 1, opacity: 1}} className="bg-background w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-10 overflow-y-auto max-h-[90vh] border border-foreground/10">
                  <div className="flex justify-between items-center mb-8">
                      <h2 className="text-2xl font-bold text-foreground">List New Enterprise Property</h2>
                      <button onClick={() => setIsModal(false)} className="p-2 hover:bg-foreground/5 rounded-full text-foreground/30"><XCircle/></button>
                  </div>
                  <form onSubmit={handleCreateProperty} className="grid grid-cols-2 gap-6">
                      <div className="col-span-2">
                          <label className="text-xs font-bold text-foreground/40 uppercase">Property Owner (Admin Only)</label>
                          <select value={newProp.owner_id} onChange={e => setNewProp({...newProp, owner_id: e.target.value})} className="w-full mt-2 bg-foreground/5 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-accent outline-none text-foreground">
                              <option value="" className="bg-background">Myself (Admin)</option>
                              {owners.map(o => (
                                  <option key={o.id} value={o.id} className="bg-background">{o.full_name} ({o.email})</option>
                              ))}
                          </select>
                      </div>
                      <div className="col-span-2">
                          <label className="text-xs font-bold text-foreground/40 uppercase">Property Title</label>
                          <input required type="text" value={newProp.title} onChange={e => setNewProp({...newProp, title: e.target.value})} className="w-full mt-2 bg-foreground/5 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-accent outline-none text-foreground" placeholder="e.g. Skyline Executive Penthouse" />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-foreground/40 uppercase">Currency</label>
                          <select value={newProp.currency} onChange={e => setNewProp({...newProp, currency: e.target.value})} className="w-full mt-2 bg-foreground/5 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-accent outline-none text-foreground">
                              <option value="USD" className="bg-background">USD ($)</option>
                              <option value="RWF" className="bg-background">RWF (FRw)</option>
                              <option value="EUR" className="bg-background">EUR (€)</option>
                              <option value="GBP" className="bg-background">GBP (£)</option>
                          </select>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-foreground/40 uppercase">Asking Price</label>
                          <input required type="number" value={newProp.price} onChange={e => setNewProp({...newProp, price: e.target.value})} className="w-full mt-2 bg-foreground/5 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-accent outline-none text-foreground" placeholder="0.00" />
                      </div>
                      <div className="col-span-2">
                          <label className="text-xs font-bold text-foreground/40 uppercase">Physical Address</label>
                          <input required type="text" value={newProp.address} onChange={e => setNewProp({...newProp, address: e.target.value})} className="w-full mt-2 bg-foreground/5 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-accent outline-none text-foreground" placeholder="Street, City, Country" />
                      </div>
                      <div><label className="text-xs font-bold text-foreground/40 uppercase">Beds</label><input type="number" value={newProp.bedrooms} onChange={e => setNewProp({...newProp, bedrooms: parseInt(e.target.value) || 0})} className="w-full mt-2 bg-foreground/5 border-none rounded-xl px-4 py-3 text-foreground" /></div>
                      <div><label className="text-xs font-bold text-foreground/40 uppercase">Baths</label><input type="number" value={newProp.bathrooms} onChange={e => setNewProp({...newProp, bathrooms: parseInt(e.target.value) || 0})} className="w-full mt-2 bg-foreground/5 border-none rounded-xl px-4 py-3 text-foreground" /></div>
                      <div className="col-span-2">
                          <label className="text-xs font-bold text-foreground/40 uppercase">Description</label>
                          <textarea rows={4} value={newProp.description} onChange={e => setNewProp({...newProp, description: e.target.value})} className="w-full mt-2 bg-foreground/5 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-accent outline-none text-foreground resize-none"></textarea>
                      </div>
                      <div className="col-span-2">
                          <label className="text-xs font-bold text-foreground/40 uppercase flex items-center gap-2">
                             <ImageIcon size={14}/> Property Images (Select Multiple)
                          </label>
                          <input 
                            type="file" 
                            multiple 
                            accept="image/*"
                            onChange={e => setPropImages(e.target.files)}
                            className="w-full mt-2 bg-foreground/5 border border-dashed border-foreground/20 rounded-xl px-4 py-8 text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-primary-dark hover:file:opacity-80 cursor-pointer"
                          />
                          {propImages && (
                              <p className="mt-2 text-xs text-accent font-bold">{propImages.length} images selected</p>
                          )}
                      </div>
                      <button type="submit" className="col-span-2 py-4 bg-accent text-primary-dark rounded-2xl font-bold hover:opacity-90 transition shadow-xl mt-4 uppercase tracking-widest">PUBLISH ENTERPRISE LISTING</button>
                  </form>
              </motion.div>
          </div>
      )}

      {/* User Modal (Add/Edit) */}
      {isUserModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-primary-dark/80 backdrop-blur-md">
              <motion.div initial={{scale: 0.9, opacity: 0}} animate={{scale: 1, opacity: 1}} className="bg-background w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 border border-foreground/10 overflow-y-auto max-h-[90vh]">
                  <div className="flex justify-between items-center mb-8">
                      <h2 className="text-2xl font-bold text-foreground">{isEditingUser ? 'Edit System User' : 'Provision New User'}</h2>
                      <button onClick={() => setIsUserModal(false)} className="p-2 hover:bg-foreground/5 rounded-full text-foreground/30"><XCircle/></button>
                  </div>
                  <form onSubmit={handleSaveUser} className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-foreground/40 uppercase">Full Name</label>
                          <input required type="text" value={userForm.full_name} onChange={e => setUserForm({...userForm, full_name: e.target.value})} className="w-full mt-2 bg-foreground/5 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-accent outline-none text-foreground" placeholder="e.g. Abel Niyigena" />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-foreground/40 uppercase">Email Address</label>
                          <input required type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} className="w-full mt-2 bg-foreground/5 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-accent outline-none text-foreground" placeholder="user@homevista.rw" />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-foreground/40 uppercase">Phone (+250...)</label>
                          <input type="text" value={userForm.phone} onChange={e => setUserForm({...userForm, phone: e.target.value})} className="w-full mt-2 bg-foreground/5 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-accent outline-none text-foreground" placeholder="+250..." />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-foreground/40 uppercase">System Role</label>
                          <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value as any})} className="w-full mt-2 bg-foreground/5 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-accent outline-none text-foreground">
                              <option value="CUSTOMER" className="bg-background">Customer</option>
                              <option value="OWNER" className="bg-background">Owner</option>
                              <option value="ADMIN" className="bg-background">Administrator</option>
                          </select>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-foreground/40 uppercase">{isEditingUser ? 'New Password (Leave blank to keep current)' : 'Initial Password'}</label>
                          <input required={!isEditingUser} type="password" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} className="w-full mt-2 bg-foreground/5 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-accent outline-none text-foreground" placeholder="••••••••" />
                      </div>
                      <button type="submit" className="w-full py-4 bg-accent text-primary-dark rounded-2xl font-bold hover:opacity-90 transition shadow-xl mt-4 uppercase tracking-widest">
                          {isEditingUser ? 'SAVE USER CHANGES' : 'CREATE SYSTEM ACCOUNT'}
                      </button>
                  </form>
              </motion.div>
          </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, icon, color, trend }: any) {
    const colors: any = {
        blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        purple: "bg-purple-500/10 text-purple-500 border-purple-500/20",
        green: "bg-green-500/10 text-green-500 border-green-500/20",
        orange: "bg-orange-500/10 text-orange-500 border-orange-500/20"
    };

    return (
        <div className="glass p-8 rounded-[2rem] border border-foreground/10 shadow-sm relative overflow-hidden group hover:border-accent/30 transition-all duration-300">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${colors[color]}`}>
                {React.cloneElement(icon, { size: 28 })}
            </div>
            <p className="text-foreground/40 text-sm font-medium uppercase tracking-widest mb-1">{label}</p>
            <h4 className="text-3xl font-bold text-foreground">{value}</h4>
            <p className="text-xs mt-4 flex items-center gap-1 font-medium">
                {trend.includes('+') ? <ArrowUpRight size={14} className="text-green-500" /> : <Activity size={14} className="text-orange-500" />}
                <span className={trend.includes('+') ? 'text-green-500' : 'text-orange-500'}>{trend}</span>
            </p>
            <div className="absolute top-0 right-0 w-24 h-24 bg-foreground/5 rounded-full -mr-12 -mt-12 group-hover:bg-accent/5 transition-colors" />
        </div>
    );
}
