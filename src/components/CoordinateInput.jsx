import React, { useState, useMemo, useRef } from "react";
import { getCoordinateSuggestions, parseCoordinate, formatLatitude, formatLongitude } from "../utils/coordinateUtils";
import { useLanguage } from "../context/LanguageContext";

export default function CoordinateInput({ type, value, setValue, disabled }) {
  const { t } = useLanguage();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestions = useMemo(() => getCoordinateSuggestions(value, type), [value, type]);
  const placeholder = type === "latitude" ? (t("latPlaceholder") || "Enter latitude") : (t("lngPlaceholder") || "Enter longitude");

  const isHovering = useRef(false);

  const handleBlur = () => {
    if (isHovering.current) return;

    setShowSuggestions(false);
    
    if (value && value.trim() !== "") {
      const parsed = parseCoordinate(value, type);
      if (parsed !== null) {
        const formatted = type === "latitude" ? formatLatitude(parsed) : formatLongitude(parsed);
        setValue(formatted);
      }
    }
  };

  return (
    <div className="coordinate-wrapper">
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        className="ocean-control"
        disabled={disabled}
        style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'text' }}
        onChange={(event) => {
          setValue(event.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        onBlur={handleBlur}
      />
      {showSuggestions && suggestions.length > 0 && !disabled && (
        <div 
          className="suggestions-box"
          onMouseEnter={() => { isHovering.current = true; }}
          onMouseLeave={() => { isHovering.current = false; }}
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.value}-${index}`}
              className="suggestion-item"
              onClick={() => {
                setValue(suggestion.value);
                setShowSuggestions(false);
                isHovering.current = false;
              }}
            >
              {suggestion.value}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}