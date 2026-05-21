"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:8000/api/users/login/", {
        email,
        password,
      });
      login(response.data.access, response.data.refresh);
      router.push("/account/dashboard");
    } catch (error) {
      alert("Invalid credentials");
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
      onSubmit={handleSubmit}
    >
      <div>
        <label className="block text-sm font-medium mb-2">Email Address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-white/5 border border-white/10 p-4 rounded-xl focus:border-accent outline-none transition-colors"
          placeholder="email@example.com"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-white/5 border border-white/10 p-4 rounded-xl focus:border-accent outline-none transition-colors"
          placeholder="••••••••"
          required
        />
      </div>
      <button className="w-full bg-accent text-primary-dark font-bold py-4 rounded-xl hover:scale-[1.02] transition-transform">
        SIGN IN
      </button>
    </motion.form>
  );
};

const Register = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "CUSTOMER",
  });
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:8000/api/users/register/", formData);
      alert("Registration successful! Please login.");
      window.location.reload();
    } catch (error) {
      alert("Registration failed");
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
      onSubmit={handleSubmit}
    >
      <div>
        <label className="block text-sm font-medium mb-1">Full Name</label>
        <input
          type="text"
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          className="w-full bg-white/5 border border-white/10 p-4 rounded-xl focus:border-accent outline-none transition-colors"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Email Address</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full bg-white/5 border border-white/10 p-4 rounded-xl focus:border-accent outline-none transition-colors"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="w-full bg-white/5 border border-white/10 p-4 rounded-xl focus:border-accent outline-none transition-colors"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Role</label>
        <select
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          className="w-full bg-white/5 border border-white/10 p-4 rounded-xl focus:border-accent outline-none transition-colors appearance-none"
        >
          <option value="CUSTOMER">Customer</option>
          <option value="OWNER">Owner</option>
        </select>
      </div>
      <button className="w-full bg-accent text-primary-dark font-bold py-4 rounded-xl hover:scale-[1.02] transition-transform">
        CREATE ACCOUNT
      </button>
    </motion.form>
  );
};

export default function AccountPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { user, logout } = useAuth();

  if (user) {
    return (
      <div className="py-24 px-6 max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-serif mb-8">Welcome, {user.full_name}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass p-8 rounded-3xl text-left">
            <h3 className="text-xl font-bold mb-4 text-accent">Account Details</h3>
            <p className="mb-2"><strong>Email:</strong> {user.email}</p>
            <p className="mb-4"><strong>Role:</strong> {user.role}</p>
            <button 
              onClick={logout}
              className="text-red-500 border-b border-red-500 pb-1"
            >
              Sign Out
            </button>
          </div>
          <div className="glass p-8 rounded-3xl flex flex-col items-center justify-center">
             <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
             <div className="flex flex-col gap-4 w-full">
               <Link 
                 href={user.role === 'ADMIN' ? "/dashboard/admin" : "/account/dashboard"}
                 className="bg-accent text-primary-dark text-center font-bold px-8 py-3 rounded-xl hover:scale-105 transition-transform"
               >
                 GO TO DASHBOARD
               </Link>
               <Link 
                 href="/account/transactions"
                 className="bg-white/5 border border-white/10 text-center font-bold px-8 py-3 rounded-xl hover:bg-white/10 transition-all"
               >
                 VIEW TRANSACTIONS
               </Link>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-24 px-6 flex items-center justify-center min-h-[80vh]">
      <div className="glass w-full max-w-md p-10 rounded-[2rem] border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-accent" />
        
        <div className="flex justify-between mb-10">
          <button
            onClick={() => setIsLogin(true)}
            className={`text-lg font-serif tracking-widest ${isLogin ? "text-accent border-b-2 border-accent" : "text-foreground/40"}`}
          >
            LOGIN
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`text-lg font-serif tracking-widest ${!isLogin ? "text-accent border-b-2 border-accent" : "text-foreground/40"}`}
          >
            REGISTER
          </button>
        </div>

        <AnimatePresence mode="wait">
          {isLogin ? <Login key="login" /> : <Register key="register" />}
        </AnimatePresence>
      </div>
    </div>
  );
}
