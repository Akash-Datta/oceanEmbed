// ============================================================
<<<<<<< HEAD
// SECTION 1: ARABIAN SEA & BAY OF BENGAL (REGIONAL)
// ============================================================

export const regionalTemperatureData = [
  {
    depth: 0,
    argo: 26.2,
    convformer: 27.5,
  },
  {
    depth: 50,
    argo: 26.8,
    convformer: 27.2,
  },
  {
    depth: 100,
    argo: 25.5,
    convformer: 26.8,
  },
  {
    depth: 200,
    argo: 15.0,
    convformer: 14.8,
  },
  {
    depth: 300,
    argo: 12.1,
    convformer: 11.5,
  },
  {
    depth: 400,
    argo: 11.0,
    convformer: 11.8,
  },
  {
    depth: 500,
    argo: 10.2,
    convformer: 10.8,
  },
  {
    depth: 600,
    argo: 9.5,
    convformer: 10.1,
  },
  {
    depth: 700,
    argo: 9.0,
    convformer: 9.5,
  },
  {
    depth: 800,
    argo: 8.7,
    convformer: 8.9,
  },
  {
    depth: 900,
    argo: 8.4,
    convformer: 8.5,
  },
  {
    depth: 1000,
    argo: 8.2,
    convformer: 8.1,
  },
=======
// SECTION 1: ARABIAN SEA (BACKEND INTEGRATION READY)
// ============================================================

export const arabianSeaTemperatureData = [
  { depth: 0, argo: 27.0, transformer: 27.4 },
  { depth: 50, argo: 26.5, transformer: 26.9 },
  { depth: 100, argo: 24.8, transformer: 25.2 },
  { depth: 200, argo: 16.0, transformer: 15.8 },
  { depth: 300, argo: 12.5, transformer: 12.1 },
  { depth: 400, argo: 11.2, transformer: 11.0 },
  { depth: 500, argo: 10.4, transformer: 10.2 },
  { depth: 600, argo: 9.7, transformer: 9.6 },
  { depth: 700, argo: 9.2, transformer: 9.1 },
  { depth: 800, argo: 8.8, transformer: 8.7 },
  { depth: 900, argo: 8.5, transformer: 8.4 },
  { depth: 1000, argo: 8.3, transformer: 8.2 },
>>>>>>> origin/main
];


// ============================================================
<<<<<<< HEAD
// SECTION 2: REST OF THE WORLD
// ============================================================

const globalDummyData = [
  {
    depth: 0,
    argo: 15.2,
    convformer: 15.0,
  },
  {
    depth: 200,
    argo: 13.5,
    convformer: 13.1,
  },
  {
    depth: 400,
    argo: 9.1,
    convformer: 9.4,
  },
  {
    depth: 600,
    argo: 7.6,
    convformer: 7.9,
  },
  {
    depth: 1000,
    argo: 4.2,
    convformer: 4.5,
  },
=======
// SECTION 2: BAY OF BENGAL (BACKEND INTEGRATION READY)
// ============================================================

export const bayOfBengalTemperatureData = [
  { depth: 0, argo: 28.2, transformer: 28.6 },
  { depth: 50, argo: 27.4, transformer: 27.8 },
  { depth: 100, argo: 25.1, transformer: 25.5 },
  { depth: 200, argo: 14.5, transformer: 14.2 },
  { depth: 300, argo: 11.8, transformer: 11.5 },
  { depth: 400, argo: 10.8, transformer: 10.6 },
  { depth: 500, argo: 10.0, transformer: 9.8 },
  { depth: 600, argo: 9.4, transformer: 9.2 },
  { depth: 700, argo: 8.9, transformer: 8.8 },
  { depth: 800, argo: 8.6, transformer: 8.5 },
  { depth: 900, argo: 8.3, transformer: 8.2 },
  { depth: 1000, argo: 8.0, transformer: 7.9 },
];


// ============================================================
// SECTION 3: REST OF THE WORLD (DUMMY DATA)
// ============================================================

const globalDummyData = [
  { depth: 0, argo: 15.2, transformer: 15.0 },
  { depth: 200, argo: 13.5, transformer: 13.1 },
  { depth: 400, argo: 9.1, transformer: 9.4 },
  { depth: 600, argo: 7.6, transformer: 7.9 },
  { depth: 1000, argo: 4.2, transformer: 4.5 },
>>>>>>> origin/main
];


// ============================================================
// DATA EXPORT HELPERS
// ============================================================

<<<<<<< HEAD
export const getLocationMetrics = (
  lat,
  lng
) => {

  const isRegional =
    lat >= 0 &&
    lat <= 30 &&
    lng >= 50 &&
    lng <= 100;

  return {
    profileData: isRegional
      ? regionalTemperatureData
      : globalDummyData,

    surfaceData: isRegional
      ? {
          sst: 26.2,
          sss: 35.4,
          ssh: 0.45,
          sla: 0.12,
        }
      : {
          sst: 15.2,
          sss: 34.1,
          ssh: 0.20,
          sla: -0.05,
        },
=======
export const getLocationMetrics = (lat, lng) => {
  const isArabianSea =
    lat >= 5 && lat <= 25 && lng >= 55 && lng <= 75;

  const isBayOfBengal =
    lat >= 5 && lat <= 22 && lng >= 80 && lng <= 95;

  let profileData = globalDummyData;
  let surfaceData = {
    sst: 15.2,
    sss: 34.1,
    ssh: 0.20,
    uo: 0.05,
    vo: -0.02,
  };

  if (isArabianSea) {
    profileData = arabianSeaTemperatureData;
    surfaceData = {
      sst: 27.0,
      sss: 36.2,
      ssh: 0.48,
      uo: 0.12,
      vo: 0.04,
    };
  } else if (isBayOfBengal) {
    profileData = bayOfBengalTemperatureData;
    surfaceData = {
      sst: 28.2,
      sss: 33.5,
      ssh: 0.52,
      uo: -0.08,
      vo: 0.10,
    };
  }

  return {
    profileData,
    surfaceData,
>>>>>>> origin/main
  };
};


// ============================================================
// FALLBACK EXPORT
// ============================================================

<<<<<<< HEAD
export const dummyTemperatureData =
  regionalTemperatureData;
=======
export const dummyTemperatureData = arabianSeaTemperatureData;
>>>>>>> origin/main


// ============================================================
// SPATIAL MAPS
// ============================================================

<<<<<<< HEAD
export const fetchSpatialMaps = async (
  depth
) => {

  /*
   * Simulate backend loading.
   *
   * Later, replace this function with your
   * actual ConvFormer API call.
   */

  await new Promise((resolve) =>
    setTimeout(resolve, 600)
  );


  /*
   * IMPORTANT:
   *
   * These files are assumed to be inside:
   *
   * public/
   *
   * Therefore Vite serves them from the root.
   *
   * Correct:
   *     /argo.jpeg
   *     /pred.jpeg
   *     /error.jpeg
   *
   * NOT:
   *     ../public/argo.jpeg
   */

  return {
    argo: "/argo.jpeg",

    convformer: "/pred.jpeg",

    error: "/error.jpeg",
  };
=======
export const fetchSpatialMaps = async (depth) => {
  await new Promise((resolve) => setTimeout(resolve, 600));

  return {
    argo: "/argo.jpeg",
    transformer: "/pred.jpeg",
    error: "/error.jpeg",
  };
};
// ============================================================
// SECTION 5: VIRIDIS COLOR SCALE & GRID DATA GENERATOR
// ============================================================

// Maps a normalized value (0.0 to 1.0) to a Viridis hex color
export const getViridisColor = (value, min, max) => {
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
  
  // Viridis color stops
  const colors = [
    { pct: 0.0, color: [68, 1, 84] },     // Dark Purple
    { pct: 0.25, color: [59, 82, 139] },  // Blue
    { pct: 0.5, color: [33, 145, 140] },  // Teal
    { pct: 0.75, color: [94, 201, 98] },  // Green
    { pct: 1.0, color: [253, 231, 37] }   // Yellow
  ];

  let lower = colors[0];
  let upper = colors[colors.length - 1];

  for (let i = 0; i < colors.length - 1; i++) {
    if (normalized >= colors[i].pct && normalized <= colors[i + 1].pct) {
      lower = colors[i];
      upper = colors[i + 1];
      break;
    }
  }

  const range = upper.pct - lower.pct;
  const rangePct = range === 0 ? 0 : (normalized - lower.pct) / range;

  const r = Math.round(lower.color[0] + (upper.color[0] - lower.color[0]) * rangePct);
  const g = Math.round(lower.color[1] + (upper.color[1] - lower.color[1]) * rangePct);
  const b = Math.round(lower.color[2] + (upper.color[2] - lower.color[2]) * rangePct);

  return `rgb(${r}, ${g}, ${b})`;
};

// Generates dummy grid data covering the requested bounds
export const generateGridData = (latMin, latMax, lngMin, lngMax, resolution = 0.5) => {
  const grid = [];
  
  // Base values for our dummy generation
  const baseSST = 26.5; 
  const baseSSH = 0.3;
  const baseSSS = 34.5;

  for (let lat = latMin; lat <= latMax; lat += resolution) {
    for (let lng = lngMin; lng <= lngMax; lng += resolution) {
      // Create some pseudo-realistic variance using sine waves based on coordinates
      const variance = Math.sin(lat * 0.5) * Math.cos(lng * 0.5);
      
      grid.push({
        lat: Number(lat.toFixed(2)),
        lng: Number(lng.toFixed(2)),
        sst: Number((baseSST + variance * 4).toFixed(2)),
        ssh: Number((baseSSH + variance * 0.2).toFixed(2)),
        sss: Number((baseSSS + variance * 1.5).toFixed(2)),
        sscu: Number((variance * 0.15).toFixed(3)),
        sscv: Number((Math.cos(lat) * 0.1).toFixed(3))
      });
    }
  }
  return grid;
>>>>>>> origin/main
};