import React, { useState, useMemo } from "react";
import { getCoordinateSuggestions, parseCoordinate, formatLatitude, formatLongitude } from "../utils/coordinateUtils";

export default function CoordinateInput({ type, value, setValue, disabled }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestions = useMemo(() => getCoordinateSuggestions(value, type), [value, type]);
  const placeholder = type === "latitude" ? "Enter latitude" : "Enter longitude";

  const selectSuggestion = (suggestion) => {
    setValue(suggestion.value);
    setShowSuggestions(false);
  };

  // Format the input value when the user clicks away
  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
      
      if (value && value.trim() !== "") {
        const parsed = parseCoordinate(value, type);
        if (parsed !== null) {
          const formatted = type === "latitude" ? formatLatitude(parsed) : formatLongitude(parsed);
          setValue(formatted);
        }
      }
    }, 180); // Slight delay allows clicking a suggestion to register first
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
        <div className="suggestions-box">
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.value}-${index}`}
              className="suggestion-item"
              onMouseDown={() => selectSuggestion(suggestion)}
              onTouchStart={() => selectSuggestion(suggestion)}
            >
              {suggestion.value}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}