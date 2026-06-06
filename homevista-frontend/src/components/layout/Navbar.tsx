"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FiMenu, FiX, FiMoon, FiSun, FiGlobe, FiBell } from "react-icons/fi";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import api from "@/utils/api";

import { useAuth } from "@/context/AuthContext";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { lang: currentLang, setLang, t } = useLanguage();
  const { user } = useAuth();

  const getDashboardPath = () => {
    if (!user) return "/account";
    if (user.role === 'ADMIN') return "/dashboard/admin";
    if (user.role === 'OWNER') return "/dashboard/owner";
    return "/dashboard/customer";
  };

  const navItems = [
    { name: t("nav.home"), path: "/" },
    { name: t("nav.properties"), path: "/properties" },
    { name: t("nav.gallery"), path: "/gallery" },
    { name: t("nav.services"), path: "/services" },
    { name: t("nav.dashboard"), path: getDashboardPath() },
    { name: t("nav.account"), path: "/account" },
    { name: t("nav.contact"), path: "/contact" },
  ];

  const languages = [
    { code: 'en', name: 'EN' },
    { code: 'fr', name: 'FR' },
    { code: 'rw', name: 'RW' },
    { code: 'zh', name: 'ZH' },
    { code: 'hi', name: 'HI' },
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (user) {
        // Initial Fetch
        api.get("/notifications/").then(res => {
            const data = res.data.results || res.data;
            setUnreadCount(data.filter((n: any) => !n.is_read).length);
        });

        // WebSocket for live updates
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const token = localStorage.getItem('access_token');
        const wsUrl = `${protocol}://${window.location.host.replace(':3000', ':8000')}/ws/notifications/?token=${token}`;
        
        const socket = new WebSocket(wsUrl);
        socket.onmessage = () => {
            setUnreadCount(prev => prev + 1);
        };
        return () => socket.close();
    }
  }, [user]);

  return (
    <nav className={cn("fixed top-0 left-0 w-full z-50 transition-all duration-300 px-6 py-4", scrolled ? "glass py-2" : "bg-transparent")}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-2xl font-serif font-bold tracking-tighter text-accent">
          HOMEVISTA
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-4">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.path}
              className={cn(
                "text-[11px] font-medium tracking-widest transition-colors hover:text-accent uppercase",
                pathname === item.path ? "text-accent" : "text-foreground/80"
              )}
            >
              {item.name}
            </Link>
          ))}
          
          <div className="relative">
            <button 
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1 text-[11px] font-medium hover:text-accent transition-colors uppercase"
            >
              <FiGlobe /> {currentLang}
            </button>
            <AnimatePresence>
              {langOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full right-0 mt-2 glass rounded-xl p-2 w-24 border border-white/10"
                >
                  {languages.map((l) => (
                    <button 
                      key={l.code}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-accent/10 rounded-lg transition-colors"
                      onClick={() => { setLang(l.code); setLangOpen(false); }}
                    >
                      {l.name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {user && (
            <Link href="/notifications" className="relative p-2 rounded-full hover:bg-accent/10 transition-colors">
              <FiBell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-accent text-primary-dark text-[8px] font-black rounded-full flex items-center justify-center border-2 border-background">
                    {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          )}

          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-accent/10 transition-colors"
          >
            {theme === "light" ? <FiMoon size={18} /> : <FiSun size={18} />}
          </button>
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden flex items-center space-x-4">
          {user && (
            <Link href="/notifications" className="relative p-2">
                <FiBell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-accent text-primary-dark text-[8px] font-black rounded-full flex items-center justify-center border-2 border-background">
                        {unreadCount}
                    </span>
                )}
            </Link>
          )}
          <button onClick={toggleTheme} className="p-2">
            {theme === "light" ? <FiMoon size={20} /> : <FiSun size={20} />}
          </button>
          <button onClick={() => setIsOpen(!isOpen)} className="text-foreground">
            {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 w-full glass md:hidden flex flex-col p-6 space-y-4"
          >
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "text-lg font-medium tracking-widest transition-colors",
                  pathname === item.path ? "text-accent" : "text-foreground"
                )}
              >
                {item.name}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
