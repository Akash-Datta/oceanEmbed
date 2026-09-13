// Tracks the real window size in CSS custom properties so the layout stays
// dynamic as the window is resized or mobile browser chrome shows/hides.
//
// `--app-vh` = 1% of window.innerHeight in px (accurate unlike 100vh on mobile).
// `--app-vw` = 1% of window.innerWidth in px.
// Usage in CSS: `height: calc(var(--app-vh, 1vh) * 100);`
// The `1vh` fallback keeps styles valid before JS runs or if it fails.

function updateViewportVars() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--app-vh", `${window.innerHeight * 0.01}px`);
  root.style.setProperty("--app-vw", `${window.innerWidth * 0.01}px`);
}

export function initViewportVars() {
  updateViewportVars();

  let rafId = null;
  const scheduleUpdate = () => {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      updateViewportVars();
    });
  };

  window.addEventListener("resize", scheduleUpdate, { passive: true });
  window.addEventListener("orientationchange", scheduleUpdate, { passive: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", scheduleUpdate, { passive: true });
  }

  return () => {
    if (rafId !== null) cancelAnimationFrame(rafId);
    window.removeEventListener("resize", scheduleUpdate);
    window.removeEventListener("orientationchange", scheduleUpdate);
    if (window.visualViewport) {
      window.visualViewport.removeEventListener("resize", scheduleUpdate);
    }
  };
}
