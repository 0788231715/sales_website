"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type LanguageContextType = {
  lang: string;
  setLang: (lang: string) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState("en");
  const [translations, setTranslations] = useState<any>({});

  const loadTranslations = async (l: string) => {
    try {
      // In a real app, this would fetch from public/locales
      // For this optimized demo, I will simulate the fetch with a direct import structure
      // or a simple dynamic require if possible.
      const response = await fetch(`/locales/${l}/common.json`);
      const data = await response.json();
      setTranslations(data);
    } catch (error) {
      console.error("Failed to load translations", error);
    }
  };

  useEffect(() => {
    loadTranslations(lang);
  }, [lang]);

  const t = (key: string) => {
    const keys = key.split(".");
    let result = translations;
    for (const k of keys) {
      if (result && result[k]) {
        result = result[k];
      } else {
        return key; // Fallback to key name
      }
    }
    return typeof result === "string" ? result : key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
