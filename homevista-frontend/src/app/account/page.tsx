"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import api from "@/utils/api";
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
      const response = await api.post("/users/login/", {
        email,
        password,
      });
      login(response.data.access, response.data.refresh);
      
      const profileRes = await api.get("/users/profile/", {
        headers: { Authorization: `Bearer ${response.data.access}` }
      });
      
      const role = profileRes.data.role;
      if (role === 'ADMIN') router.push("/dashboard/admin");
      else if (role === 'OWNER') router.push("/dashboard/owner");
      else router.push("/");
      
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
        <label className="block text-sm font-medium mb-2 text-foreground">Email Address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-foreground/5 border border-foreground/10 p-4 rounded-xl focus:border-accent outline-none transition-colors text-foreground"
          placeholder="email@example.com"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2 text-foreground">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-foreground/5 border border-foreground/10 p-4 rounded-xl focus:border-accent outline-none transition-colors text-foreground"
          placeholder="••••••••"
          required
        />
      </div>
      <button className="w-full bg-accent text-primary-dark font-bold py-4 rounded-xl hover:scale-[1.02] transition-transform uppercase tracking-widest">
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
    phone: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/users/register/", formData);
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
        <label className="block text-sm font-medium mb-1 text-foreground">Full Name</label>
        <input
          type="text"
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          className="w-full bg-foreground/5 border border-foreground/10 p-4 rounded-xl focus:border-accent outline-none transition-colors text-foreground"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-foreground">Email Address</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full bg-foreground/5 border border-foreground/10 p-4 rounded-xl focus:border-accent outline-none transition-colors text-foreground"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-foreground">Phone (+250...)</label>
        <input
          type="text"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full bg-foreground/5 border border-foreground/10 p-4 rounded-xl focus:border-accent outline-none transition-colors text-foreground"
          placeholder="+250..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-foreground">Password</label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="w-full bg-foreground/5 border border-foreground/10 p-4 rounded-xl focus:border-accent outline-none transition-colors text-foreground"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-foreground">Role</label>
        <select
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          className="w-full bg-foreground/5 border border-foreground/10 p-4 rounded-xl focus:border-accent outline-none transition-colors appearance-none text-foreground"
        >
          <option value="CUSTOMER" className="bg-background">Customer</option>
          <option value="OWNER" className="bg-background">Owner</option>
        </select>
      </div>
      <button className="w-full bg-accent text-primary-dark font-bold py-4 rounded-xl hover:scale-[1.02] transition-transform uppercase tracking-widest">
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
      <div className="py-24 px-6 max-w-4xl mx-auto text-center min-h-[80vh]">
        <h1 className="text-4xl font-serif mb-8 text-foreground">Welcome, {user.full_name}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass p-8 rounded-3xl text-left border border-foreground/10 shadow-xl">
            <h3 className="text-xl font-bold mb-4 text-accent uppercase tracking-widest">Account Details</h3>
            <div className="space-y-2">
                <p className="text-foreground/80 font-medium"><strong>Email:</strong> {user.email}</p>
                <p className="text-foreground/80 font-medium"><strong>Role:</strong> {user.role}</p>
                <p className="text-foreground/80 font-medium"><strong>Joined:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
            </div>
            <button 
              onClick={logout}
              className="mt-6 text-red-500 border-b border-red-500/30 hover:border-red-500 transition-all pb-1 font-bold"
            >
              Sign Out
            </button>
          </div>
          <div className="glass p-8 rounded-3xl flex flex-col items-center justify-center border border-foreground/10 shadow-xl">
             <h3 className="text-xl font-bold mb-6 text-foreground uppercase tracking-widest">Quick Actions</h3>
             <div className="flex flex-col gap-4 w-full">
               <Link 
                 href={user.role === 'ADMIN' ? "/dashboard/admin" : user.role === 'OWNER' ? "/dashboard/owner" : "/"}
                 className="bg-accent text-primary-dark text-center font-bold px-8 py-4 rounded-xl hover:scale-105 transition-transform shadow-lg shadow-accent/20"
               >
                 GO TO DASHBOARD
               </Link>
               <Link 
                 href="/account/transactions"
                 className="bg-foreground/5 border border-foreground/10 text-center font-bold px-8 py-4 rounded-xl hover:bg-foreground/10 transition-all text-foreground"
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
    <div className="py-24 px-6 flex items-center justify-center min-h-[90vh] bg-background">
      <div className="glass w-full max-w-md p-10 rounded-[2.5rem] border border-foreground/10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-2 bg-accent" />
        
        <div className="flex justify-between mb-10 border-b border-foreground/5 pb-4">
          <button
            onClick={() => setIsLogin(true)}
            className={`text-lg font-serif font-bold tracking-widest transition-all ${isLogin ? "text-accent scale-110" : "text-foreground/30 hover:text-foreground/60"}`}
          >
            LOGIN
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`text-lg font-serif font-bold tracking-widest transition-all ${!isLogin ? "text-accent scale-110" : "text-foreground/30 hover:text-foreground/60"}`}
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
