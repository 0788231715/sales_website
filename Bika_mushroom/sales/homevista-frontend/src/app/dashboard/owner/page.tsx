"use client";

import { useEffect, useState } from "react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, Cell
} from "recharts";
import { 
  Home, Eye, CheckCircle, TrendingUp, AlertCircle, Clock, 
  ArrowUpRight, Download, ShieldCheck, Calendar as CalendarIcon
} from "lucide-react";
import axios from "axios";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function OwnerDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analytics' | 'calendar'>('analytics');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await axios.get(`${API_URL}/analytics/owner_dashboard/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (err) {
        console.error("Error fetching analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading Enterprise Dashboard...</div>;
  if (!stats) return <div className="p-8 text-center text-red-500">Failed to load dashboard data.</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold text-gray-800">Owner Enterprise Console</h1>
            <div className="flex gap-4 mt-4">
                <button 
                    onClick={() => setActiveTab('analytics')}
                    className={`pb-2 px-2 font-medium transition ${activeTab === 'analytics' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Performance Analytics
                </button>
                <button 
                    onClick={() => setActiveTab('calendar')}
                    className={`pb-2 px-2 font-medium transition ${activeTab === 'calendar' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Booking Calendar
                </button>
            </div>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          <Download size={18} /> Export Report
        </button>
      </div>

      {activeTab === 'analytics' ? (
        <>
            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <Eye size={24} />
                    </div>
                    <span className="text-green-500 flex items-center gap-1 text-sm font-medium">
                    +12% <ArrowUpRight size={14} />
                    </span>
                </div>
                <h3 className="text-gray-500 text-sm font-medium">Total Property Views</h3>
                <p className="text-2xl font-bold text-gray-800">{stats.total_views}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                    <CheckCircle size={24} />
                    </div>
                    <span className="text-green-500 flex items-center gap-1 text-sm font-medium">
                    +5% <ArrowUpRight size={14} />
                    </span>
                </div>
                <h3 className="text-gray-500 text-sm font-medium">Total Bookings</h3>
                <p className="text-2xl font-bold text-gray-800">{stats.total_bookings}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                    <TrendingUp size={24} />
                    </div>
                </div>
                <h3 className="text-gray-500 text-sm font-medium">Conversion Rate</h3>
                <p className="text-2xl font-bold text-gray-800">{stats.conversion_rate}%</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-green-100 rounded-lg text-green-600">
                    <ShieldCheck size={24} />
                    </div>
                </div>
                <h3 className="text-gray-500 text-sm font-medium">Trust Score</h3>
                <p className="text-2xl font-bold text-gray-800">92/100</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Interaction Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-6">Visitor Engagement (Daily)</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.daily_interactions}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#3b82f6" 
                        strokeWidth={3} 
                        dot={{ r: 4, fill: "#3b82f6" }}
                        activeDot={{ r: 6 }}
                        />
                    </LineChart>
                    </ResponsiveContainer>
                </div>
                </div>

                {/* Property Performance */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-6">Top Performing Properties</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.property_ranking} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" />
                        <YAxis dataKey="title" type="category" width={100} />
                        <Tooltip />
                        <Bar dataKey="views_count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                    </ResponsiveContainer>
                </div>
                </div>
            </div>

            {/* Alerts & Tasks */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Pending Actions</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="text-yellow-600" />
                        <div>
                        <p className="font-medium text-gray-800">2 Contracts Pending Signature</p>
                        <p className="text-sm text-gray-500">Action required to finalize deals</p>
                        </div>
                    </div>
                    <button className="text-yellow-600 font-bold hover:underline">View Contracts</button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-3">
                        <Clock className="text-blue-600" />
                        <div>
                        <p className="font-medium text-gray-800">3 New Viewing Requests</p>
                        <p className="text-sm text-gray-500">Approve or reschedule bookings</p>
                        </div>
                    </div>
                    <button className="text-blue-600 font-bold hover:underline">Manage Bookings</button>
                    </div>
                </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">AI Insight</h3>
                    <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 italic text-indigo-800 mb-4">
                        "Properties with virtual tours in Kigali are seeing 45% more engagement this week. Consider adding one to your 'Sunset Villa' listing."
                    </div>
                    <button className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                        Apply Optimization
                    </button>
                </div>
            </div>
        </>
      ) : (
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Appointment Management</h2>
                    <p className="text-gray-500">Manage viewing schedules and property availability</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="w-3 h-3 bg-blue-500 rounded-full"></span> Confirmed
                    </div>
                    <div className="flex items-center gap-2 text-sm">
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
                        { title: 'Viewing: Sunset Villa', date: '2026-05-22', color: '#3b82f6' },
                        { title: 'Contract Signing', date: '2026-05-24', color: '#10b981' },
                        { title: 'Pending: Hillside Condo', date: '2026-05-22', color: '#f59e0b' },
                    ]}
                    height="600px"
                    eventClick={(info) => alert('Event: ' + info.event.title)}
                />
            </div>

            <style jsx global>{`
                .fc { --fc-border-color: #f3f4f6; --fc-button-bg-color: #3b82f6; --fc-button-border-color: #3b82f6; }
                .fc-toolbar-title { font-size: 1.25rem !important; font-weight: bold; color: #1f2937; }
                .fc-daygrid-day { transition: background 0.2s; }
                .fc-daygrid-day:hover { background: #f9fafb; }
            `}</style>
        </div>
      )}
    </div>
  );
}
