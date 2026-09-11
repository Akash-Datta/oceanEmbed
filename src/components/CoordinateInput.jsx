import React, { useState, useMemo, useRef } from "react";
import { getCoordinateSuggestions, parseCoordinate, formatLatitude, formatLongitude } from "../utils/coordinateUtils";
<<<<<<< HEAD

export default function CoordinateInput({ type, value, setValue, disabled }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestions = useMemo(() => getCoordinateSuggestions(value, type), [value, type]);
  const placeholder = type === "latitude" ? "Enter latitude" : "Enter longitude";

  // THE SHIELD: Tracks if the mouse is physically over the dropdown box
  const isHovering = useRef(false);

  const handleBlur = () => {
    // If the mouse is over the dropdown, ABORT the blur formatting completely.
    // This allows the click event to happen undisturbed.
=======
import { useLanguage } from "../context/LanguageContext";

export default function CoordinateInput({ type, value, setValue, disabled }) {
  const { t, language } = useLanguage();
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const suggestions = useMemo(() => getCoordinateSuggestions(value, type, language), [value, type, language]);
  
  const placeholder = type === "latitude" ? (t("latPlaceholder") || "Enter latitude") : (t("lngPlaceholder") || "Enter longitude");

  const isHovering = useRef(false);

  const handleBlur = () => {
>>>>>>> origin/main
    if (isHovering.current) return;

    setShowSuggestions(false);
    
    if (value && value.trim() !== "") {
      const parsed = parseCoordinate(value, type);
      if (parsed !== null) {
<<<<<<< HEAD
        const formatted = type === "latitude" ? formatLatitude(parsed) : formatLongitude(parsed);
=======
        const formatted = type === "latitude" ? formatLatitude(parsed, language) : formatLongitude(parsed, language);
>>>>>>> origin/main
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
<<<<<<< HEAD
          // Activate the shield when the mouse enters the box
          onMouseEnter={() => { isHovering.current = true; }}
          // Deactivate the shield if they move the mouse away without clicking
=======
          onMouseEnter={() => { isHovering.current = true; }}
>>>>>>> origin/main
          onMouseLeave={() => { isHovering.current = false; }}
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.value}-${index}`}
              className="suggestion-item"
              onClick={() => {
                setValue(suggestion.value);
                setShowSuggestions(false);
<<<<<<< HEAD
                isHovering.current = false; // Reset shield after successful click
=======
                isHovering.current = false;
>>>>>>> origin/main
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