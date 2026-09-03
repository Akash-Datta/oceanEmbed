// ============================================================
// SECTION 1: ARABIAN SEA (BACKEND INTEGRATION READY)
// ============================================================

export const arabianSeaTemperatureData = [
  { depth: 0, argo: 27.0, convformer: 27.4 },
  { depth: 50, argo: 26.5, convformer: 26.9 },
  { depth: 100, argo: 24.8, convformer: 25.2 },
  { depth: 200, argo: 16.0, convformer: 15.8 },
  { depth: 300, argo: 12.5, convformer: 12.1 },
  { depth: 400, argo: 11.2, convformer: 11.0 },
  { depth: 500, argo: 10.4, convformer: 10.2 },
  { depth: 600, argo: 9.7, convformer: 9.6 },
  { depth: 700, argo: 9.2, convformer: 9.1 },
  { depth: 800, argo: 8.8, convformer: 8.7 },
  { depth: 900, argo: 8.5, convformer: 8.4 },
  { depth: 1000, argo: 8.3, convformer: 8.2 },
];


// ============================================================
// SECTION 2: BAY OF BENGAL (BACKEND INTEGRATION READY)
// ============================================================

export const bayOfBengalTemperatureData = [
  { depth: 0, argo: 28.2, convformer: 28.6 },
  { depth: 50, argo: 27.4, convformer: 27.8 },
  { depth: 100, argo: 25.1, convformer: 25.5 },
  { depth: 200, argo: 14.5, convformer: 14.2 },
  { depth: 300, argo: 11.8, convformer: 11.5 },
  { depth: 400, argo: 10.8, convformer: 10.6 },
  { depth: 500, argo: 10.0, convformer: 9.8 },
  { depth: 600, argo: 9.4, convformer: 9.2 },
  { depth: 700, argo: 8.9, convformer: 8.8 },
  { depth: 800, argo: 8.6, convformer: 8.5 },
  { depth: 900, argo: 8.3, convformer: 8.2 },
  { depth: 1000, argo: 8.0, convformer: 7.9 },
];


// ============================================================
// SECTION 3: REST OF THE WORLD (DUMMY DATA)
// ============================================================

const globalDummyData = [
  { depth: 0, argo: 15.2, convformer: 15.0 },
  { depth: 200, argo: 13.5, convformer: 13.1 },
  { depth: 400, argo: 9.1, convformer: 9.4 },
  { depth: 600, argo: 7.6, convformer: 7.9 },
  { depth: 1000, argo: 4.2, convformer: 4.5 },
];


// ============================================================
// DATA EXPORT HELPERS
// ============================================================

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
  };
};


// ============================================================
// FALLBACK EXPORT
// ============================================================

export const dummyTemperatureData = arabianSeaTemperatureData;


// ============================================================
// SPATIAL MAPS
// ============================================================

export const fetchSpatialMaps = async (depth) => {
  await new Promise((resolve) => setTimeout(resolve, 600));

  return {
    argo: "/argo.jpeg",
    convformer: "/pred.jpeg",
    error: "/error.jpeg",
  };
};