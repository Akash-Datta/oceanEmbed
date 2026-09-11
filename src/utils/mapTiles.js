/**
 * Shared basemap tile URL builder.
 * Both themes go through the authenticated rastertiles endpoint so the
 * VITE_MAP_API_KEY is always sent (light = voyager, dark = dark_all).
 */
export function getTileUrl(isDark) {
  const key = import.meta.env.VITE_MAP_API_KEY;
  if (isDark) {
    return `https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png?key=${key}`;
  }
  return `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${key}`;
}
