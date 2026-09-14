# OceanEmbed — Marine Intelligence

Interactive ocean forecasting for the North Indian Ocean: live vertical
temperature profiles, surface parameters (SST/SSS/SSH/UO/VO) and whole-domain
heatmaps, plus an ocean Q&A assistant.

## Setup

```bash
npm install
npm run dev        # frontend → http://localhost:5173

cd backend
npm install
npm start          # backend → http://localhost:5000
```

Copy env examples and fill in keys (never commit `.env` files):

- Frontend: `VITE_BACKEND_API_URL`, `VITE_GEMINI_API_KEY`, `VITE_MAP_API_KEY`
- Backend: `MODEL_API_URL` (upstream model host), `PORT`, `MODEL_TIMEOUT_MS`

`npm run build` / `npm run lint` / `npm run preview` work from the repo root.

## Backend API (proxied 1:1 from the upstream model)

| Route | Purpose |
|---|---|
| `GET /api/health` | Liveness + route manifest (`build` tag — restart the backend whenever routes change; Node loads them once at startup) |
| `GET\|POST /api/profile` | Vertical profile for a 0.25° grid (`grid_id` or `lat`+`lng`, `forecast_date`) |
| `GET\|POST /api/surface` | Surface point values (`sw/ne` bounds or `lat`+`lng`, `date`) |
| `GET\|POST /api/surface/map` | Whole-domain heatmap cells for `sst\|sss\|zos\|uo\|vo` + UI aliases (`ssh\|sscu\|sscv`) |

## Design system (UI overhaul)

- **Stack:** Tailwind CSS (utilities) + `src/styles/tokens.css` (CSS vars) +
  `src/styles/leaflet.css` (Leaflet-only companion — the only other global CSS).
- **Type:** Fraunces (display/headlines) + Public Sans (body/data, tabular
  numerals). Never Inter/Roboto/Arial/Space Grotesk.
- **Color — exactly 3 hexes:** paper `#F7F4ED`, ink `#132730`, accent `#0C6E5E`.
  All neutrals/hairlines derive via opacity (`ink/10`, `paper/15`…); dark-mode
  tints via `color-mix`. White appears only as on-accent text/canvas utility.
  Chart series + viridis scale keep data-encoding hues (functional, not brand).
- **Shape:** 8px (`rounded-lg`) everywhere; pills/circles only where functional
  (dots, avatars, toggles). Hairline borders carry elevation; one restrained
  shadow, floating layers only.
- **Voice:** sentence case, semibold max weight for UI chrome, 12–13px icons
  tight to text. No uppercase labels, no gradient buttons, no glow.
- **Tailwind config** mirrors the tokens. `sm` is **701px** (not the 640px
  default) to match the JS `isMobile` breakpoint — keep them in sync.
- **Theming:** one `dark` class on `<html>` drives `dark:` variants +
  `.dark` vars. No per-component palettes, no `!important` theme overrides.
- **Icons** (`src/components/icons.jsx`): stroke SVG set, `currentColor`,
  `aria-hidden` by default. No emoji as UI icons.
- **Modals** (`Modal.jsx` + `ModalHeader`): `role=dialog`, focus trap,
  Escape, focus return, scroll lock. Drawers close on Escape.
  Notifications use `role="status"`; chat uses `aria-live="polite"`.
- **Dropdowns**: listbox semantics, `aria-expanded`, Escape/Enter/Space,
  visible focus rings (`.oe-focus-visible`). Live data uses `.oe-live-badge`
  (12px text + 6px dot, no pills).

### Adding a component — rules

1. Tailwind utilities + `dark:` variants only; raw hex/rgba belongs in
   `tokens.css`, never inline (status colors already exist as vars/badges).
2. Spacing/radii from the scale; z-index from the named scale
   (`z-control/panel/dropdown/toast/modal/boot`).
3. Interactive elements: keyboard-operable, `:focus-visible` ring
   (`.oe-focus-visible`), `aria-label` where icon-only.
4. Live vs fallback data: green `● Live` / amber `○ Fallback` via
   `.oe-live-badge.is-live/.is-fallback`, with retry affordance on errors.
5. Keep the JS `isMobile` (700px) and Tailwind `sm` (701px) aligned;
   test 360px → desktop in both themes.
