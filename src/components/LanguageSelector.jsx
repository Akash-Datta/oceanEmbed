import React from "react";
import { useLanguage } from "../context/LanguageContext";

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

  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value)}
      className="about-authors-nav-btn"
      style={{
        background: "#ffffff",
        color: "#0f172a",
        fontWeight: "600",
        cursor: "pointer",
        padding: "6px 10px",
      }}
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.label}
        </option>
      ))}
    </select>
  );
}