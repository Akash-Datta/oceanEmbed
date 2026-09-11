import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "../context/ThemeContext";

/**
 * Theme-aware custom dropdown (replaces native <select>).
 * Desktop: full animated list. Mobile: capped list height (~4 items).
 */
export default function CustomDropdown({
  value,
  placeholder = "Select",
  options = [],
  onChange,
  disabled = false,
  height = 42,
  fontSize = 13,
  minWidth = 0,
  ariaLabel,
}) {
  const { isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open ]);

  const selected = options.find((o) => String(o.value) === String(value));

  const light = !isDark;
  const triggerBg = disabled
    ? light ? "#f1f5f9" : "rgba(30,16,64,0.6)"
    : light ? "#ffffff" : "rgba(24, 14, 52, 0.95)";
  const triggerBorder = light ? "1px solid #bae6fd" : "1px solid rgba(168, 85, 247, 0.5)";
  const triggerColor = disabled
    ? light ? "#94a3b8" : "#6d5a8f"
    : light ? "#0f172a" : "#f5f3ff";

  return (
    <div ref={rootRef} className="custom-dropdown" style={{ position: "relative", width: "100%", minWidth }}>
      {open && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 99990, background: "transparent", cursor: "default" }}
          onClick={() => setOpen(false)}
        />
      )}
      <button
        type="button"
        aria-label={ariaLabel || placeholder}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`custom-dropdown-trigger ${open ? "open" : ""} ${isDark ? "dd-dark" : "dd-light"}`}
        style={{
          width: "100%",
          height,
          padding: "0 12px",
          borderRadius: "12px",
          border: triggerBorder,
          background: triggerBg,
          color: triggerColor,
          fontSize,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.55 : 1,
          boxSizing: "border-box",
          textAlign: "left",
          position: "relative",
          zIndex: open ? 99991 : 1,
          transition: "border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease",
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="custom-dropdown-chevron" style={{ flexShrink: 0, fontSize: "11px", opacity: 0.75 }}>▾</span>
      </button>

      {open && !disabled && (
        <div className={`custom-dropdown-list ${isDark ? "dd-dark" : "dd-light"}`}>
          {options.map((opt) => {
            const isSel = String(opt.value) === String(value);
            return (
              <div
                key={String(opt.value)}
                className={`custom-dropdown-item ${isSel ? "selected" : ""} ${isDark ? "dd-dark" : "dd-light"}`}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{opt.label}</span>
                {isSel && <span style={{ flexShrink: 0 }}>✓</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
