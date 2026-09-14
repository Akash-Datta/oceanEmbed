import React, { useEffect, useRef } from "react";
import Icon from "./icons";

/**
 * Shared accessible modal shell: backdrop click + Escape to close,
 * initial focus into the dialog, focus return on unmount, scroll lock.
 */
export default function Modal({ label, onClose, children, wide = false }) {
  const panelRef = useRef(null);
  const prevFocus = useRef(null);

  useEffect(() => {
    prevFocus.current = document.activeElement;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => {
      panelRef.current?.querySelector("[data-autofocus]")?.focus?.();
      panelRef.current?.focus?.();
    }, 30);
    const onKey = (e) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      // Focus trap: keep Tab cycling inside the dialog (WCAG 2.4.3).
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        const items = Array.from(focusables).filter((el) => el.offsetParent !== null);
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      clearTimeout(t);
      prevFocus.current?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-modal flex items-center justify-center bg-slate-900/60 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`oe-focus-visible flex max-h-full w-full flex-col overflow-hidden rounded-lg border border-ink/10 bg-paper shadow-lift outline-none
          dark:border-paper/10 dark:bg-ink
          ${wide ? "max-w-3xl" : "max-w-xl"}`}
      >
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({ icon, title, onClose, closeLabel }) {
  return (
    <div className="flex shrink-0 items-center justify-between border-b border-ink/10 px-4 py-3 dark:border-paper/10">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <Icon name={icon} size={15} />
        </span>
        <h3 className="m-0 font-display text-[17px] font-bold text-ink dark:text-paper">{title}</h3>
      </div>
      <button
        type="button"
        onClick={onClose}
        title={closeLabel}
        aria-label={closeLabel}
        data-autofocus
        className="oe-focus-visible flex h-8 w-8 items-center justify-center rounded-lg border border-ink/10 text-ink/70 hover:bg-ink/[0.05]
          dark:border-paper/15 dark:text-paper/70 dark:hover:bg-paper/10"
      >
          <Icon name="close" size={13} />
      </button>
    </div>
  );
}
