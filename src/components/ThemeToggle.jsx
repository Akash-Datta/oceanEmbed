import React from "react";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle theme"
      className={`theme-toggle-btn ${isDark ? "is-dark" : "is-light"}`}
    >
      <style>{`
        .theme-toggle-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 38px;
          padding: 0 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          cursor: pointer;
          white-space: nowrap;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          -webkit-tap-highlight-color: transparent;
        }
        .theme-toggle-btn.is-light {
          background: linear-gradient(135deg, #1e1b4b, #6d28d9, #a855f7);
          border: 1px solid rgba(168, 85, 247, 0.6);
          color: #f5f3ff;
          box-shadow: 0 4px 18px rgba(124, 58, 237, 0.35), inset 0 1px 0 rgba(255,255,255,0.25);
        }
        .theme-toggle-btn.is-light:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(168, 85, 247, 0.55), 0 0 18px rgba(217, 70, 239, 0.45);
          filter: brightness(1.1);
        }
        .theme-toggle-btn.is-dark {
          background: rgba(10, 6, 24, 0.85);
          border: 1px solid rgba(217, 70, 239, 0.7);
          color: #f0abfc;
          box-shadow: 0 0 16px rgba(168, 85, 247, 0.45), inset 0 0 12px rgba(168, 85, 247, 0.15);
          text-shadow: 0 0 8px rgba(240, 171, 252, 0.8);
        }
        .theme-toggle-btn.is-dark:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 28px rgba(217, 70, 239, 0.7), inset 0 0 16px rgba(217, 70, 239, 0.25);
          background: rgba(30, 10, 50, 0.95);
        }
        .theme-toggle-btn:active { transform: scale(0.94); }
        .theme-toggle-icon {
          font-size: 15px;
          line-height: 1;
          display: inline-block;
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .theme-toggle-btn:hover .theme-toggle-icon { transform: rotate(25deg) scale(1.2); }
        .theme-toggle-btn.is-dark::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(110deg, transparent 30%, rgba(217,70,239,0.25) 50%, transparent 70%);
          animation: themeSheen 2.6s linear infinite;
          pointer-events: none;
        }
        @keyframes themeSheen {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @media (max-width: 700px) {
          .theme-toggle-btn { height: 34px !important; padding: 0 10px !important; font-size: 11px !important; }
        }
      `}</style>
      <span className="theme-toggle-icon">{isDark ? "☀️" : "🌙"}</span>
      <span>{isDark ? "Light" : "Dark"}</span>
      <span
        style={{
          width: "32px",
          height: "18px",
          borderRadius: "999px",
          background: isDark ? "rgba(217,70,239,0.3)" : "rgba(255,255,255,0.25)",
          border: `1px solid ${isDark ? "rgba(240,171,252,0.7)" : "rgba(255,255,255,0.5)"}`,
          position: "relative",
          display: "inline-block",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "2px",
            left: isDark ? "16px" : "2px",
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            background: isDark ? "#f0abfc" : "#fff",
            boxShadow: isDark ? "0 0 8px #e879f9" : "0 1px 4px rgba(0,0,0,0.3)",
            transition: "left 0.3s cubic-bezier(0.16,1,0.3,1)",
          }}
        />
      </span>
    </button>
  );
}
