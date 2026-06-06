"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { 
  FiBell, FiCheck, FiTrash2, FiClock, 
  FiAlertCircle, FiMessageCircle, FiFileText, FiDollarSign
} from "react-icons/fi";

export default function NotificationCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get("/notifications/");
      setNotifications(res.data.results || res.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();

      // WebSocket Connection for Real-Time Notifications
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const token = localStorage.getItem('access_token');
      const wsUrl = `${protocol}://${window.location.host.replace(':3000', ':8000')}/ws/notifications/?token=${token}`;
      
      const socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setNotifications((prev) => [data, ...prev]);
        
        // Optional: Play sound or show browser notification
        if ("Notification" in window && window.Notification.permission === "granted") {
            new window.Notification(data.title, { body: data.body });
        }
      };

      return () => socket.close();
    }
  }, [user]);

  const markAsRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/`, { is_read: true });
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const markAllRead = async () => {
    try {
      // Assuming a bulk endpoint or we loop (looping for simplicity if no bulk endpoint)
      await Promise.all(notifications.filter(n => !n.is_read).map(n => api.patch(`/notifications/${n.id}/`, { is_read: true })));
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Error marking all read:", error);
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      await api.delete(`/notifications/${id}/`);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const getIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('offer')) return <FiDollarSign className="text-emerald-500" />;
    if (t.includes('contract') || t.includes('agreement')) return <FiFileText className="text-blue-500" />;
    if (t.includes('message')) return <FiMessageCircle className="text-purple-500" />;
    if (t.includes('booking')) return <FiClock className="text-amber-500" />;
    return <FiBell className="text-accent" />;
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pt-24 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-serif mb-2">Notifications</h1>
            <p className="text-foreground/50">Stay updated with your property interactions and deals.</p>
          </div>
          {notifications.some(n => !n.is_read) && (
            <button 
              onClick={markAllRead}
              className="flex items-center gap-2 text-accent font-bold uppercase text-[10px] tracking-widest hover:underline"
            >
              <FiCheck /> Mark all as read
            </button>
          )}
        </header>

        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {notifications.map((notification) => (
              <motion.div 
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`glass p-6 rounded-3xl border transition-all flex items-start gap-6 group ${
                  notification.is_read ? 'border-foreground/5 opacity-60' : 'border-accent/20 bg-accent/5 shadow-lg shadow-accent/5'
                }`}
              >
                <div className={`p-4 rounded-2xl bg-foreground/5 shrink-0 ${notification.is_read ? 'grayscale' : ''}`}>
                  {getIcon(notification.title)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`font-bold truncate ${notification.is_read ? 'text-foreground/60' : 'text-foreground'}`}>
                      {notification.title}
                    </h3>
                    <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest whitespace-nowrap ml-4">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className={`text-sm leading-relaxed mb-4 ${notification.is_read ? 'text-foreground/40' : 'text-foreground/70'}`}>
                    {notification.body}
                  </p>
                  
                  <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notification.is_read && (
                      <button 
                        onClick={() => markAsRead(notification.id)}
                        className="text-[10px] font-black uppercase tracking-widest text-accent hover:underline"
                      >
                        Mark as read
                      </button>
                    )}
                    <button 
                      onClick={() => deleteNotification(notification.id)}
                      className="text-[10px] font-black uppercase tracking-widest text-rose-500/60 hover:text-rose-500"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {notifications.length === 0 && (
            <div className="py-40 text-center border-2 border-dashed border-foreground/10 rounded-[3rem]">
              <FiBell size={64} className="mx-auto text-foreground/10 mb-6" />
              <p className="text-2xl font-serif text-foreground/30">Your inbox is clear.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
