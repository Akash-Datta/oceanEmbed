import React, { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import CustomDropdown from "./CustomDropdown";
import Icon from "./icons";

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
      <div className="relative w-auto shrink">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className="oe-focus-visible inline-flex h-9 items-center justify-between gap-1.5 whitespace-nowrap rounded-lg border border-ink/10 bg-paper px-3 text-[13px] font-semibold text-ink
            dark:border-paper/15 dark:bg-paper/[0.05] dark:text-paper"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="flex items-center gap-1">
            <Icon name="globe" size={13} />
            {currentLangObj.label}
          </span>
          <Icon name="chevronDown" size={12} className={`opacity-75 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-[9998] bg-transparent"
              onClick={() => setIsOpen(false)}
            />
            <div
              role="listbox"
              aria-label="Select language"
              className="absolute right-0 top-[calc(100%+6px)] z-modal flex min-w-[160px] max-h-44 flex-col gap-1 overflow-y-auto rounded-lg border border-ink/10 bg-paper p-1.5 text-ink shadow-lift
                dark:border-paper/20 dark:bg-paper/[0.07] dark:text-paper"
            >
              {languages.map((lang) => {
                const isSel = language === lang.code;
                return (
                  <div
                    key={lang.code}
                    role="option"
                    aria-selected={isSel}
                    tabIndex={0}
                    onClick={() => {
                      setLanguage(lang.code);
                      setIsOpen(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setLanguage(lang.code);
                        setIsOpen(false);
                      }
                    }}
                    className={`cursor-pointer whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-bold
                      ${isSel
                        ? "bg-accent text-white dark:bg-accent"
                        : "bg-ink/[0.03] text-ink hover:bg-ink/[0.06] dark:bg-transparent dark:text-paper dark:hover:bg-paper/10"}`}
                  >
                    {lang.label}
                  </div>
                );
              })}
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