import React, { useEffect, useRef, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import Icon from "./icons";
import { sendOceanChat } from "../utils/oceanChat";

const SUGGESTIONS = [
  "What is sea surface temperature?",
  "How do ARGO floats work?",
  "What causes ocean currents?",
  "Why is the Arabian Sea so warm?",
];

export default function OceanChatBot() {
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

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label={title}
          className="fixed bottom-[84px] right-4 z-modal flex min-h-[380px] w-[min(380px,calc(100vw-32px))] flex-col overflow-hidden rounded-lg border font-sans
            border-ink/10 bg-paper/95 shadow-lift backdrop-blur-lg
            dark:border-paper/20 dark:bg-ink/95 dark:shadow-none"
          style={{ height: "min(540px, calc(100dvh - 180px))" }}
        >
          <div className="flex shrink-0 items-center justify-between bg-accent px-3.5 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-white">
                <Icon name="waves" size={16} />
              </span>
              <div>
                <div className="font-display text-[15px] font-bold text-white">{title}</div>
                <div className="flex items-center gap-1.5 text-[11px] text-white/80">
                  <span className="h-[6px] w-[6px] rounded-full bg-white" />
                  {subtitle}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              title="Close"
              aria-label="Close chat"
              className="oe-focus-visible flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-white/15 text-white hover:bg-white/25"
            >
              <Icon name="close" size={13} />
            </button>
          </div>

          <div
            ref={scrollRef}
            className="flex flex-1 flex-col gap-2 overflow-y-auto p-3"
            aria-live="polite"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={m.role === "user"
                  ? "max-w-[85%] self-end rounded-lg rounded-br bg-accent px-3 py-2 text-[13px] leading-relaxed text-white "
                  : "max-w-[85%] self-start whitespace-pre-wrap break-words rounded-lg rounded-bl border border-ink/10 bg-ink/[0.04] px-3 py-2 text-[13px] leading-relaxed text-ink dark:border-paper/10 dark:bg-paper/[0.05] dark:text-paper"}
              >
                {m.content}
              </div>
            ))}
            {thinking && (
              <div className="flex items-center gap-1.5 self-start rounded-lg rounded-bl border border-ink/10 bg-paper px-3.5 py-3 text-accent dark:border-paper/20 dark:bg-paper/[0.05] dark:text-paper">
                <span className="h-[7px] w-[7px] animate-bounce rounded-full bg-current" />
                <span className="h-[7px] w-[7px] animate-bounce rounded-full bg-current [animation-delay:0.15s]" />
                <span className="h-[7px] w-[7px] animate-bounce rounded-full bg-current [animation-delay:0.3s]" />
              </div>
            )}
            {messages.length <= 1 && !thinking && (
              <div className="mt-0.5 flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="oe-focus-visible cursor-pointer rounded-lg border border-ink/10 bg-transparent px-2.5 py-1.5 text-[12px] font-semibold text-accent hover:bg-ink/[0.04]
                      dark:border-paper/15 dark:text-paper dark:hover:bg-paper/10"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex shrink-0 gap-2 p-2.5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              placeholder={placeholder}
              disabled={thinking}
              aria-label={placeholder}
              className="oe-focus-visible h-[42px] min-w-0 flex-1 rounded-lg border border-ink/10 bg-paper px-3.5 text-[13px] text-ink outline-none
                dark:border-paper/20 dark:bg-ink dark:text-paper"
            />
            <button
              type="button"
              onClick={() => send()}
              disabled={thinking || !input.trim()}
              title="Send"
              aria-label="Send message"
              className="oe-focus-visible h-[42px] w-[42px] shrink-0 cursor-pointer rounded-lg bg-accent text-white disabled:cursor-not-allowed disabled:opacity-50
                "
            >
              <span className="flex items-center justify-center">
                <Icon name="send" size={17} />
              </span>
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={title}
        aria-label={open ? "Close ocean chat" : "Open ocean chat"}
        aria-expanded={open}
        className="oe-focus-visible fixed bottom-4 right-4 z-modal flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-ink/10 bg-accent p-0 text-white shadow-lift transition-transform hover:scale-105
          dark:border-paper/20"
      >
        <span className="relative flex items-center justify-center">
          <Icon name={open ? "close" : "chat"} size={20} />
        </span>
      </button>
    </>
  );
}
