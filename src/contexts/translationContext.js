"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { ar } from "../lib/localization/ar";  
import { en } from "../lib/localization/en";  

const TranslationContext = createContext();

export const TranslationProvider = ({ children }) => {
  const [language, setLanguage] = useState("en"); // Default language
  const [mounted, setMounted] = useState(false);

  // Load language from localStorage after mount
  useEffect(() => {
    setMounted(true);
    const savedLanguage = localStorage.getItem('language') || 'en';
    setLanguage(savedLanguage);
  }, []);

  // Update direction and save to localStorage
  useEffect(() => {
    if (mounted) {
      const dir = language === "ar" ? "rtl" : "ltr";
      document.documentElement.setAttribute("dir", dir);
      document.documentElement.setAttribute("lang", language);
      localStorage.setItem('language', language);
    }
  }, [language, mounted]);
 // Runs when language changes


  const changeLanguage = (lang) => setLanguage(lang);

  const t = (key) => {
    const translations = language === "en" ? en : ar; // Switch based on language
    return translations[key] || key; // Return key if translation doesn't exist
  };

  // Prevent hydration mismatch by showing consistent state during SSR
  if (!mounted) {
    return (
      <TranslationContext.Provider value={{ language: "en", changeLanguage: () => {}, t: (key) => key }}>
        {children}
      </TranslationContext.Provider>
    );
  }

  return (
    <TranslationContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => useContext(TranslationContext);
