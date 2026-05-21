"use client";

import React from "react";
import { motion } from "framer-motion";
import { FiCalculator, FiCamera, FiCalendar, FiMap, FiCheckCircle } from "react-icons/fi";

const services = [
  {
    title: "Mortgage Calculator",
    description: "Plan your finances with our advanced mortgage calculation tool.",
    icon: <FiCalculator size={32} />,
    color: "bg-blue-500/10 text-blue-500",
  },
  {
    title: "Virtual Tours",
    description: "Experience properties from the comfort of your home with 360° tours.",
    icon: <FiCamera size={32} />,
    color: "bg-purple-500/10 text-purple-500",
  },
  {
    title: "Appointment Booking",
    description: "Schedule visits easily with our integrated calendar system.",
    icon: <FiCalendar size={32} />,
    color: "bg-accent/10 text-accent",
  },
  {
    title: "Interactive Maps",
    description: "Explore neighborhoods and nearby amenities with Google Maps.",
    icon: <FiMap size={32} />,
    color: "bg-green-500/10 text-green-500",
  },
  {
    title: "Property Evaluation",
    description: "Get professional assessments of your property's market value.",
    icon: <FiCheckCircle size={32} />,
    color: "bg-red-500/10 text-red-500",
  },
];

export default function ServicesPage() {
  return (
    <div className="py-24 px-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-20"
      >
        <h2 className="text-accent text-sm font-bold tracking-[0.3em] mb-4">OUR EXPERTISE</h2>
        <h1 className="text-5xl font-serif mb-6">World Class Services</h1>
        <p className="text-foreground/60 max-w-2xl mx-auto text-lg font-light">
          We provide a comprehensive suite of luxury real estate services tailored to your needs.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {services.map((service, index) => (
          <motion.div
            key={service.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -10 }}
            className="glass p-10 rounded-3xl border border-white/10 group cursor-pointer"
          >
            <div className={`w-16 h-16 rounded-2xl ${service.color} flex items-center justify-center mb-8 transition-transform group-hover:scale-110`}>
              {service.icon}
            </div>
            <h3 className="text-2xl font-serif mb-4 group-hover:text-accent transition-colors">{service.title}</h3>
            <p className="text-foreground/60 font-light leading-relaxed">
              {service.description}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
