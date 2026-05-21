"use client";

import React from "react";
import { motion } from "framer-motion";
import { FiPhone, FiMail, FiMapPin, FiSend } from "react-icons/fi";

export default function ContactPage() {
  return (
    <div className="py-24 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-20">
         <h2 className="text-accent text-sm font-bold tracking-[0.3em] mb-4 uppercase">GET IN TOUCH</h2>
         <h1 className="text-5xl font-serif">Contact Our <span className="italic text-accent">Kigali Office</span></h1>
         <p className="text-foreground/60 mt-4 max-w-2xl mx-auto">HomeVista is proudly developed and headquartered in the heart of Rwanda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
         {/* Contact Info */}
         <div className="space-y-8">
            <div className="glass p-8 rounded-3xl border border-white/10">
               <div className="w-12 h-12 bg-accent/10 text-accent rounded-xl flex items-center justify-center mb-6">
                  <FiPhone size={24} />
               </div>
               <h3 className="text-xl font-bold mb-2">Phone</h3>
               <p className="text-foreground/60 font-light">+250 798 780 022</p>
               <p className="text-foreground/60 font-light">Abel Niyigena</p>
            </div>
            <div className="glass p-8 rounded-3xl border border-white/10">
               <div className="w-12 h-12 bg-accent/10 text-accent rounded-xl flex items-center justify-center mb-6">
                  <FiMail size={24} />
               </div>
               <h3 className="text-xl font-bold mb-2">Email</h3>
               <p className="text-foreground/60 font-light">abeliniyigena@gmail.com</p>
               <p className="text-foreground/60 font-light">contact@homevista.rw</p>
            </div>
            <div className="glass p-8 rounded-3xl border border-white/10">
               <div className="w-12 h-12 bg-accent/10 text-accent rounded-xl flex items-center justify-center mb-6">
                  <FiMapPin size={24} />
               </div>
               <h3 className="text-xl font-bold mb-2">Office</h3>
               <p className="text-foreground/60 font-light">Kigali Heights, 4th Floor</p>
               <p className="text-foreground/60 font-light">Kigali, Rwanda</p>
            </div>
         </div>

         {/* Contact Form */}
         <div className="lg:col-span-2">
            <div className="glass p-12 rounded-[3rem] border border-white/10">
               <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-1">
                     <label className="block text-sm font-medium mb-2">Full Name</label>
                     <input type="text" className="w-full bg-white/5 border border-white/10 p-4 rounded-xl focus:border-accent outline-none" placeholder="Enter your name" />
                  </div>
                  <div className="col-span-1">
                     <label className="block text-sm font-medium mb-2">Email Address</label>
                     <input type="email" className="w-full bg-white/5 border border-white/10 p-4 rounded-xl focus:border-accent outline-none" placeholder="your@email.com" />
                  </div>
                  <div className="col-span-2">
                     <label className="block text-sm font-medium mb-2">Subject</label>
                     <input type="text" className="w-full bg-white/5 border border-white/10 p-4 rounded-xl focus:border-accent outline-none" placeholder="How can we help?" />
                  </div>
                  <div className="col-span-2">
                     <label className="block text-sm font-medium mb-2">Message</label>
                     <textarea rows={6} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl focus:border-accent outline-none resize-none" placeholder="Tell us more..."></textarea>
                  </div>
                  <div className="col-span-2">
                     <button className="bg-accent text-primary-dark font-bold px-12 py-5 rounded-2xl flex items-center justify-center gap-2 w-full md:w-auto hover:scale-105 transition-transform">
                        <FiSend /> SEND MESSAGE
                     </button>
                  </div>
               </form>
            </div>
         </div>
      </div>
    </div>
  );
}
