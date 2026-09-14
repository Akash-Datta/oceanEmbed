import React, { useState, useMemo, useRef } from "react";
import { getCoordinateSuggestions, parseCoordinate, formatLatitude, formatLongitude } from "../utils/coordinateUtils";
import { useLanguage } from "../context/LanguageContext";

export default function CoordinateInput({ type, value, setValue, disabled }) {
  const { t, language } = useLanguage();
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = useMemo(() => getCoordinateSuggestions(value, type, language), [value, type, language]);

  const placeholder = type === "latitude" ? (t("latPlaceholder") || "Enter latitude") : (t("lngPlaceholder") || "Enter longitude");

  const isHovering = useRef(false);

  const handleBlur = () => {
    if (isHovering.current) return;

    setShowSuggestions(false);

    if (value && value.trim() !== "") {
      const parsed = parseCoordinate(value, type);
      if (parsed !== null) {
        const formatted = type === "latitude" ? formatLatitude(parsed, language) : formatLongitude(parsed, language);
        setValue(formatted);
      }
    }
  };

  return (
    <div className="relative flex-1">
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        disabled={disabled}
        onChange={(event) => {
          setValue(event.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        onBlur={handleBlur}
        className="oe-focus-visible h-[42px] w-full rounded-lg border border-ink/10 bg-paper px-3 text-[13px] font-semibold text-ink placeholder:font-normal placeholder:text-ink/40
          dark:border-paper/20 dark:bg-ink dark:text-paper dark:placeholder:text-paper/40
          disabled:cursor-not-allowed disabled:opacity-50"
      />
      {showSuggestions && suggestions.length > 0 && !disabled && (
        <div
          role="listbox"
          className="absolute inset-x-0 top-[calc(100%+6px)] z-dropdown max-h-44 overflow-y-auto rounded-lg border border-ink/10 bg-paper p-1.5 shadow-lift
            dark:border-paper/20 dark:bg-paper/[0.07]"
          onMouseEnter={() => { isHovering.current = true; }}
          onMouseLeave={() => { isHovering.current = false; }}
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.value}-${index}`}
              role="option"
              aria-selected={false}
              onClick={() => {
                setValue(suggestion.value);
                setShowSuggestions(false);
                isHovering.current = false;
              }}
              className="cursor-pointer rounded-lg px-3 py-2 text-[13px] font-semibold text-ink hover:bg-ink/[0.06]
                dark:text-paper dark:hover:bg-paper/10"
            >
              {suggestion.value}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
