import React, { useEffect, useRef, useState } from "react";
import Icon from "./icons";

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
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const listId = useRef(`dd-list-${Math.random().toString(36).slice(2, 8)}`);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open ]);

  const selected = options.find((o) => String(o.value) === String(value));

  return (
    <div ref={rootRef} className="relative w-full" style={{ minWidth }}>
      {open && (
        <div
          className="fixed inset-0 z-dropdown cursor-default bg-transparent"
          onClick={() => setOpen(false)}
        />
      )}
      <button
        type="button"
        aria-label={ariaLabel || placeholder}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId.current}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        style={{ height, fontSize }}
        className="oe-focus-visible relative z-[1] flex w-full items-center justify-between gap-2 overflow-hidden whitespace-nowrap rounded-lg border px-3 text-left font-semibold transition-colors
          border-ink/10 bg-paper text-ink hover:border-accent
          dark:border-paper/20 dark:bg-ink dark:text-paper dark:hover:border-paper/30
          disabled:cursor-not-allowed disabled:opacity-55"
      >
        <span className="overflow-hidden text-ellipsis">
          {selected ? selected.label : placeholder}
        </span>
        <Icon
          name="chevronDown"
          size={13}
          className={`shrink-0 opacity-75 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && !disabled && (
        <div
          id={listId.current}
          role="listbox"
          aria-label={ariaLabel || placeholder}
          className="absolute inset-x-0 top-[calc(100%+6px)] z-dropdown max-h-44 overflow-y-auto rounded-lg border p-1.5 shadow-lift
            border-ink/10 bg-paper
            dark:border-paper/20 dark:bg-paper/[0.07]"
        >
          {options.map((opt) => {
            const isSel = String(opt.value) === String(value);
            return (
              <div
                key={String(opt.value)}
                role="option"
                aria-selected={isSel}
                tabIndex={0}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onChange(opt.value);
                    setOpen(false);
                  }
                }}
                className={`oe-focus-visible flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold
                  ${isSel
                    ? "bg-accent text-white dark:bg-accent dark:text-paper"
                    : "text-ink hover:bg-ink/[0.06] dark:text-paper dark:hover:bg-paper/10"}`}
              >
                <span className="overflow-hidden text-ellipsis">{opt.label}</span>
                {isSel && <Icon name="check" size={14} className="shrink-0" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
