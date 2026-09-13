import React, { createContext, useContext, useState, useEffect } from "react";
import  translations  from "../locales/translations";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  // Load last used language from localStorage (fallback to "en")
  const [language, setLanguageState] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ocean_preferred_language") || "en";
    }
    return "en";
  });

  // Persist whenever language changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ocean_preferred_language", language);
    }
  }, [language]);

  const setLanguage = (lang) => {
    setLanguageState(lang);
  };

  const t = (key) => {
    return translations[language]?.[key] || translations["en"][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}