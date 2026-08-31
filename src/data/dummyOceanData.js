// ============================================================
// SECTION 1: ARABIAN SEA & BAY OF BENGAL (REGIONAL)
// ============================================================
export const regionalTemperatureData = [
  { depth: 0, argo: 26.2, convformer: 27.5 },
  { depth: 50, argo: 26.8, convformer: 27.2 },
  { depth: 100, argo: 25.5, convformer: 26.8 },
  { depth: 200, argo: 15.0, convformer: 14.8 },
  { depth: 300, argo: 12.1, convformer: 11.5 },
  { depth: 400, argo: 11.0, convformer: 11.8 },
  { depth: 500, argo: 10.2, convformer: 10.8 },
  { depth: 600, argo: 9.5, convformer: 10.1 },
  { depth: 700, argo: 9.0, convformer: 9.5 },
  { depth: 800, argo: 8.7, convformer: 8.9 },
  { depth: 900, argo: 8.4, convformer: 8.5 },
  { depth: 1000, argo: 8.2, convformer: 8.1 }, 
];

// ============================================================
// SECTION 2: REST OF THE WORLD (FUTURE SCOPE)
// ============================================================
const globalDummyData = [
  { depth: 0, argo: 15.2, convformer: 15.0 },
  { depth: 200, argo: 13.5, convformer: 13.1 },
  { depth: 400, argo: 9.1, convformer: 9.4 },
  { depth: 600, argo: 7.6, convformer: 7.9 },
  { depth: 1000, argo: 4.2, convformer: 4.5 },
];

// ============================================================
// DATA EXPORT HELPERS (For Location Side Panel)
// ============================================================
export const getLocationMetrics = (lat, lng) => {
  const isRegional = lat >= 0 && lat <= 30 && lng >= 50 && lng <= 100;
  
  return {
    profileData: isRegional ? regionalTemperatureData : globalDummyData,
    surfaceData: isRegional 
      ? { sst: 26.2, sss: 35.4, ssh: 0.45, sla: 0.12 }
      : { sst: 15.2, sss: 34.1, ssh: 0.20, sla: -0.05 } 
  };
};

// Fallback export for the graph
export const dummyTemperatureData = regionalTemperatureData;

// ============================================================
// SPATIAL MAPS API (BACKEND INTEGRATION POINT)
// ============================================================
export const fetchSpatialMaps = async (depth) => {
  // Simulating network delay for the UI loading state
  await new Promise(resolve => setTimeout(resolve, 600));

  // BACKEND DEVELOPER: 
  // Replace these local .jpeg paths with the actual Base64 strings 
  // returned from the ConvFormer API model.
  return {
    argo: '/argo.jpeg',
    convformer: '/pred.jpeg',
    error: '/error.jpeg'
  };
};