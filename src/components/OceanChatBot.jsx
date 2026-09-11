import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { sendOceanChat } from "../utils/oceanChat";

const SUGGESTIONS = [
  "What is sea surface temperature?",
  "How do ARGO floats work?",
  "What causes ocean currents?",
  "Why is the Arabian Sea so warm?",
];

export default function OceanChatBot() {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef(null);

  const title = t("chatTitle") === "chatTitle" ? "Ocean Assistant" : t("chatTitle");
  const subtitle =
    t("chatSubtitle") === "chatSubtitle" ? "Ask anything about oceans" : t("chatSubtitle");
  const placeholder =
    t("chatPlaceholder") === "chatPlaceholder" ? "Ask an ocean question…" : t("chatPlaceholder");
  const greeting =
    t("chatGreeting") === "chatGreeting"
      ? "🌊 Hi! I'm your ocean assistant. Ask me about SST, currents, ARGO floats, marine life, or anything ocean-related!"
      : t("chatGreeting");

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: "assistant", content: greeting }]);
    }
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, thinking, open]);

  const errorText = (code, detail) => {
    if (code === "missing_key") {
      return (
        t("chatErrorKey") === "chatErrorKey"
          ? "⚠️ Chat is not configured yet. Add VITE_GEMINI_API_KEY to your .env file and restart the app."
          : t("chatErrorKey")
      );
    }
    if (code === "unauthorized")
      return detail
        ? `🔑 Request failed: ${detail}`
        : "🔑 The chat API key was rejected. Please check VITE_GEMINI_API_KEY.";
    if (code === "rate_limited") return "⏳ Too many requests right now. Please try again in a moment.";
    if (code === "blocked") return "🚫 That message was blocked. Please rephrase your question.";
    if (code === "network") return "🌐 Network error reaching the chat service. Check your connection.";
    return t("chatErrorGeneral") === "chatErrorGeneral"
      ? "😕 Sorry, something went wrong. Please try again."
      : t("chatErrorGeneral");
  };

  const send = async (text) => {
    const clean = (text ?? input).trim();
    if (!clean || thinking) return;
    const userMsg = { role: "user", content: clean };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setThinking(true);
    try {
      const reply = await sendOceanChat(next);
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages([...next, { role: "assistant", content: errorText(e.code, e.detail), isError: true }]);
    } finally {
      setThinking(false);
    }
  };

  const pal = isDark
    ? {
        fabBg: "linear-gradient(135deg, #7c3aed, #d946ef)",
        fabShadow: "0 0 24px rgba(217, 70, 239, 0.6)",
        panelBg: "rgba(16, 10, 36, 0.97)",
        panelBorder: "1px solid rgba(168, 85, 247, 0.5)",
        headerBg: "linear-gradient(135deg, rgba(76,29,149,0.6), rgba(112,26,117,0.45))",
        titleColor: "#f0abfc",
        subColor: "#c4b5fd",
        userBg: "linear-gradient(135deg, #7c3aed, #d946ef)",
        botBg: "rgba(30, 16, 64, 0.9)",
        botBorder: "1px solid rgba(168, 85, 247, 0.35)",
        botColor: "#f5f3ff",
        inputBg: "rgba(10, 6, 24, 0.9)",
        inputBorder: "1px solid rgba(168, 85, 247, 0.45)",
        inputColor: "#f5f3ff",
        chipBg: "rgba(124, 58, 237, 0.2)",
        chipBorder: "1px solid rgba(168, 85, 247, 0.5)",
        chipColor: "#e9d5ff",
      }
    : {
        fabBg: "linear-gradient(135deg, #0284c7, #2563eb)",
        fabShadow: "0 8px 24px rgba(2, 132, 199, 0.45)",
        panelBg: "rgba(255, 255, 255, 0.97)",
        panelBorder: "1px solid rgba(186, 230, 253, 0.9)",
        headerBg: "linear-gradient(135deg, #0284c7, #2563eb)",
        titleColor: "#ffffff",
        subColor: "rgba(255,255,255,0.85)",
        userBg: "linear-gradient(135deg, #0284c7, #2563eb)",
        botBg: "#f0f9ff",
        botBorder: "1px solid #bae6fd",
        botColor: "#0f172a",
        inputBg: "#ffffff",
        inputBorder: "1px solid #bae6fd",
        inputColor: "#0f172a",
        chipBg: "#e0f2fe",
        chipBorder: "1px solid #bae6fd",
        chipColor: "#0369a1",
      };

  const waveBlue =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='20' viewBox='0 0 56 20'%3E%3Cpath d='M0,10 Q7,0 14,10 T28,10 T42,10 T56,10 V20 H0 Z' fill='%233B82F6'/%3E%3C/svg%3E";
  const waveMagenta =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='20' viewBox='0 0 56 20'%3E%3Cpath d='M0,10 Q7,0 14,10 T28,10 T42,10 T56,10 V20 H0 Z' fill='%23E879F9'/%3E%3C/svg%3E";
  const waveTeal =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='20' viewBox='0 0 56 20'%3E%3Cpath d='M0,10 Q7,0 14,10 T28,10 T42,10 T56,10 V20 H0 Z' fill='%232DD4BF'/%3E%3C/svg%3E";
  const waveBlend = isDark ? "screen" : "multiply";

  return (
    <>
      <style>{`
        @keyframes chatFabPulse {
          0% { box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.5); }
          70% { box-shadow: 0 0 0 14px rgba(34, 211, 238, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 211, 238, 0); }
        }
        @keyframes chatFabSlide {
          from { transform: translateX(0); }
          to { transform: translateX(-56px); }
        }
        @keyframes chatFabBob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        @keyframes chatPanelPop {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes chatDotBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        .chat-fab-wave {
          position: absolute;
          left: 0;
          top: 50%;
          width: 200%;
          height: 30px;
          margin-top: -15px;
          background-repeat: repeat-x;
          background-size: 56px 30px;
          background-position: 0 0;
          animation: chatFabSlide 3.6s linear infinite;
        }
        .chat-fab-wave.chat-fab-w2 {
          height: 26px;
          margin-top: -19px;
          background-size: 56px 26px;
          animation-duration: 6.4s;
          animation-direction: reverse;
        }
        .chat-fab-wave.chat-fab-w3 {
          height: 24px;
          margin-top: -5px;
          background-size: 56px 24px;
          animation-duration: 5.1s;
        }
        .chat-thinking-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: currentColor;
          animation: chatDotBounce 1.2s ease-in-out infinite;
        }
        .chat-thinking-dot:nth-child(2) { animation-delay: 0.15s; }
        .chat-thinking-dot:nth-child(3) { animation-delay: 0.3s; }
      `}</style>

      {open && (
        <div
          style={{
            position: "fixed",
            right: "16px",
            bottom: "84px",
            zIndex: 60000,
            width: "min(380px, calc(100vw - 32px))",
            height: "min(540px, calc(100dvh - 180px))",
            minHeight: "380px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRadius: "18px",
            background: pal.panelBg,
            border: pal.panelBorder,
            boxShadow: isDark
              ? "0 0 32px rgba(168, 85, 247, 0.4), 0 24px 60px rgba(0,0,0,0.6)"
              : "0 24px 60px rgba(2, 132, 199, 0.25)",
            backdropFilter: "blur(18px)",
            animation: "chatPanelPop 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            fontFamily: "Inter, Arial, sans-serif",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 14px",
              background: pal.headerBg,
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "22px" }}>🌊</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: "14px", color: pal.titleColor }}>{title}</div>
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: pal.subColor,
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <span
                    style={{
                      width: "7px",
                      height: "7px",
                      borderRadius: "50%",
                      background: "#22c55e",
                      boxShadow: "0 0 6px #22c55e",
                    }}
                  />
                  {subtitle}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              title="Close"
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.35)",
                background: "rgba(255,255,255,0.15)",
                color: "#fff",
                fontSize: "15px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ×
            </button>
          </div>

          <div
            ref={scrollRef}
            style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  padding: "9px 12px",
                  borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  background: m.role === "user" ? pal.userBg : pal.botBg,
                  border: m.role === "user" ? "none" : pal.botBorder,
                  color: m.role === "user" ? "#fff" : pal.botColor,
                  fontSize: "13px",
                  lineHeight: 1.55,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {m.content}
              </div>
            ))}
            {thinking && (
              <div
                style={{
                  alignSelf: "flex-start",
                  padding: "12px 14px",
                  borderRadius: "14px 14px 14px 4px",
                  background: pal.botBg,
                  border: pal.botBorder,
                  color: isDark ? "#d8b4fe" : "#0284c7",
                  display: "flex",
                  gap: "5px",
                }}
              >
                <span className="chat-thinking-dot" />
                <span className="chat-thinking-dot" />
                <span className="chat-thinking-dot" />
              </div>
            )}
            {messages.length <= 1 && !thinking && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "2px" }}>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: "999px",
                      background: pal.chipBg,
                      border: pal.chipBorder,
                      color: pal.chipColor,
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "8px", padding: "10px 12px", flexShrink: 0 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              placeholder={placeholder}
              disabled={thinking}
              style={{
                flex: 1,
                minWidth: 0,
                height: "42px",
                padding: "0 14px",
                borderRadius: "12px",
                border: pal.inputBorder,
                background: pal.inputBg,
                color: pal.inputColor,
                fontSize: "13px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <button
              type="button"
              onClick={() => send()}
              disabled={thinking || !input.trim()}
              title="Send"
              style={{
                width: "42px",
                height: "42px",
                flexShrink: 0,
                borderRadius: "12px",
                border: "none",
                background: pal.fabBg,
                color: "#fff",
                fontSize: "17px",
                cursor: thinking || !input.trim() ? "not-allowed" : "pointer",
                opacity: thinking || !input.trim() ? 0.5 : 1,
                boxShadow: pal.fabShadow,
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={title}
        aria-label="Open ocean chat"
        style={{
          position: "fixed",
          right: "16px",
          bottom: "16px",
          zIndex: 60001,
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          border: "none",
          background: "transparent",
          padding: 0,
          cursor: "pointer",
          animation: open ? "none" : "chatFabPulse 2.4s ease-out infinite",
          transition: "transform 0.2s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        {/* Diamond badge with equal sides + layered translucent waves */}
        <span
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: "42px",
            height: "42px",
            transform: "translate(-50%, -50%) rotate(45deg)",
            borderRadius: "9px",
            overflow: "hidden",
            background: isDark ? "rgba(24, 12, 52, 0.6)" : "rgba(255, 255, 255, 0.65)",
            border: isDark ? "1px solid rgba(216, 180, 254, 0.6)" : "1px solid #CBD5E1",
            boxShadow: isDark
              ? "0 0 18px rgba(34, 211, 238, 0.35)"
              : "0 4px 16px rgba(59, 130, 246, 0.35)",
          }}
        >
          <span
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: "64px",
              height: "64px",
              transform: "translate(-50%, -50%) rotate(-45deg)",
            }}
          >
            <span
              className="chat-fab-wave chat-fab-w2"
              style={{ backgroundImage: `url("${waveTeal}")`, opacity: 0.55, mixBlendMode: waveBlend }}
            />
            <span
              className="chat-fab-wave chat-fab-w3"
              style={{ backgroundImage: `url("${waveMagenta}")`, opacity: 0.6, mixBlendMode: waveBlend }}
            />
            <span
              className="chat-fab-wave chat-fab-w1"
              style={{ backgroundImage: `url("${waveBlue}")`, opacity: 0.8, mixBlendMode: waveBlend }}
            />
          </span>
        </span>
      </button>
    </>
  );
}
