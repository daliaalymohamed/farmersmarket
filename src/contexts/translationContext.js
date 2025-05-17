"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { ar } from "../lib/localization/ar";  
import { en } from "../lib/localization/en";  

const TranslationContext = createContext();

export const TranslationProvider = ({ children }) => {
  const [language, setLanguage] = useState("en"); // Default language

  // to manage tags directions based on language selextion
  useEffect(() => {
    const dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("lang", language);
  }, [language]); // Runs when language changes


  const changeLanguage = (lang) => setLanguage(lang);

  const t = (key) => {
    const translations = language === "en" ? en : ar; // Switch based on language
    return translations[key] || key; // Return key if translation doesn't exist
  };

  return (
    <TranslationContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => useContext(TranslationContext);
