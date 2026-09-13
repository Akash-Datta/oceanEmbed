import React, { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import CustomDropdown from "./CustomDropdown";

const languages = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी (Hindi)" },
  { code: "bn", label: "বাংলা (Bengali)" },
  { code: "mr", label: "मराठी (Marathi)" },
  { code: "te", label: "తెలుగు (Telugu)" },
  { code: "ta", label: "தமிழ் (Tamil)" },
  { code: "gu", label: "ગુજરાતી (Gujarati)" },
  { code: "ur", label: "اردو (Urdu)" },
  { code: "kn", label: "ಕನ್ನಡ (Kannada)" },
  { code: "ml", label: "മലയാളം (Malayalam)" },
  { code: "pa", label: "ਪੰਜਾਬੀ (Punjabi)" },
  { code: "or", label: "ଓଡ଼ିଆ (Odia)" },
  { code: "as", label: "অসমীয়া (Assamese)" },
  { code: "mai", label: "मैथिली (Maithili)" },
  { code: "sat", label: "संथाली (Santali)" },
  { code: "ks", label: "कॉशुर (Kashmiri)" },
  { code: "ne", label: "नेपाली (Nepali)" },
  { code: "sd", label: "سنڌي (Sindhi)" },
  { code: "kok", label: "कोंकणी (Konkani)" },
  { code: "doi", label: "डोगरी (Dogri)" },
  { code: "mni", label: "মৈতৈলোন্ (Manipuri)" },
  { code: "brx", label: "बड़ो (Bodo)" },
  { code: "sa", label: "संस्कृतम् (Sanskrit)" },
];

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 700);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const currentLangObj = languages.find((l) => l.code === language) || languages[0];

  if (isMobile) {
    return (
      <div style={{ position: "relative", width: "auto", flexShrink: 1, zIndex: 999999 }}>
        <button
          type="button"
          className="about-authors-nav-btn"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "6px",
            width: "auto",
            whiteSpace: "nowrap",
          }}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>🌐 {currentLangObj.label}</span>
          <span>▾</span>
        </button>

        {isOpen && (
          <>
            <div 
              style={{ position: "fixed", inset: 0, zIndex: 9998, background: "transparent" }} 
              onClick={() => setIsOpen(false)} 
            />
            <div 
              className="mobile-inline-dropdown-list"
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                right: 0,
                left: "auto",
                minWidth: "160px",
                maxHeight: "168px",
                overflowY: "auto",
                background: "#ffffff",
                color: "#0f172a",
                borderRadius: "12px",
                border: "1.5px solid #0ea5e9",
                boxShadow: "0 25px 60px rgba(15, 23, 42, 0.5)",
                zIndex: 999999,
                padding: "6px 6px 14px 6px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {languages.map((lang) => (
                <div
                  key={lang.code}
                  className={`mobile-inline-dropdown-item ${language === lang.code ? "selected" : ""}`}
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  style={{
                    padding: "11px 14px",
                    fontSize: "13px",
                    fontWeight: "700",
                    color: language === lang.code ? "#ffffff" : "#1e293b",
                    background: language === lang.code ? "linear-gradient(135deg, #0284c7, #2563eb)" : "#f8fafc",
                    borderRadius: "8px",
                    cursor: "pointer",
                    border: language === lang.code ? "1.5px solid transparent" : "1px solid #e2e8f0",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {lang.label}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div style={{ minWidth: "150px" }}>
      <CustomDropdown
        value={language}
        placeholder="English"
        options={languages.map((lang) => ({ value: lang.code, label: lang.label }))}
        onChange={(val) => setLanguage(val)}
        height={38}
        fontSize={12}
        ariaLabel="Select language"
      />
    </div>
  );
}