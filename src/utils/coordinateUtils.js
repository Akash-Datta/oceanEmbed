import * as turf from "@turf/turf";
import landGeoJSON from "../data/landMask.json";

// ============================================================
// LOCALIZED CARDINAL DIRECTIONS (23 Official Indian Languages)
// ============================================================

const cardinalDirections = {
  en: { N: "N", S: "S", E: "E", W: "W" },
  hi: { N: "उ", S: "द", E: "पू", W: "प" },
  bn: { N: "উ", S: "দ", E: "পূ", W: "প" },
  mr: { N: "उ", S: "द", E: "पू", W: "प" },
  te: { N: "ఉ", S: "ద", E: "తూర్పు", W: "పడమర" },
  ta: { N: "வ", S: "தெ", E: "கி", W: "மே" },
  gu: { N: "ઉ", S: "દ", E: "પૂર્વ", W: "પશ્ચિમ" },
  ur: { N: "شمال", S: "جنوب", E: "مشرق", W: "مغرب" },
  kn: { N: "ಉ", S: "ದ", E: "ಪೂ", W: "ಪ" },
  ml: { N: "വ", S: "തെ", E: "കി", W: "പ" },
  pa: { N: "ਉ", S: "ਦ", E: "ਪੂ", W: "ਪ" },
  or: { N: "ଉ", S: "ଦ", E: "ପୂ", W: "ପ" },
  as: { N: "উ", S: "দ", E: "পূ", W: "প" },
  ne: { N: "उ", S: "द", E: "पू", W: "प" },
  sd: { N: "اتر", S: "दक्षिण", E: "اوڀر", W: "اولهه" },
  kok: { N: "उ", S: "द", E: "उदेंत", W: "अस्तंत" },
  doi: { N: "उ", S: "द", E: "पू", W: "प" },
  mni: { N: "ন", S: "থ", E: "প", W: "ৱ" },
  brx: { N: "উ", S: "দ", E: "পূ", W: "প" },
  sa: { N: "उ", S: "द", E: "पूर्", W: "पश्चिम्" },
  mai: { N: "उ", S: "द", E: "पू", W: "प" },
  sat: { N: "U", S: "D", E: "P", W: "Pa" },
};

// ============================================================
// COORDINATE FORMATTING (Language-Aware)
// ============================================================

export function formatLongitude(value, lang = "en") {
  let longitude = Number(value);
  while (longitude > 180) longitude -= 360;
  while (longitude < -180) longitude += 360;
  if (Math.abs(longitude) < 0.000001) return "0°";
  
  const formattedNum = new Intl.NumberFormat(lang === "en" ? "en-US" : "hi-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  }).format(Math.abs(longitude));

  const dirs = cardinalDirections[lang] || cardinalDirections.en;
  return longitude > 0 ? `${formattedNum}° ${dirs.E}` : `${formattedNum}° ${dirs.W}`;
}

export function formatLatitude(value, lang = "en") {
  const latitude = Number(value);
  if (Math.abs(latitude) < 0.000001) return "0°";

  const formattedNum = new Intl.NumberFormat(lang === "en" ? "en-US" : "hi-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  }).format(Math.abs(latitude));

  const dirs = cardinalDirections[lang] || cardinalDirections.en;
  return latitude > 0 ? `${formattedNum}° ${dirs.N}` : `${formattedNum}° ${dirs.S}`;
}

// ============================================================
// COORDINATE PARSER & SUGGESTIONS
// ============================================================

export function parseCoordinate(value, type) {
  if (!value || !value.trim()) return null;
  let text = value.trim().toUpperCase();
  let direction = null;
  if (/[NSEW]$/.test(text)) {
    direction = text.slice(-1);
    text = text.slice(0, -1).trim();
  }
  text = text.replace(/°/g, "").trim();
  const number = parseFloat(text);
  if (Number.isNaN(number)) return null;
  let result = number;
  if (direction === "S" || direction === "W") result = -Math.abs(number);
  if (direction === "N" || direction === "E") result = Math.abs(number);
  if (type === "latitude" && (result < -90 || result > 90)) return null;
  if (type === "longitude") {
    while (result > 180) result -= 360;
    while (result < -180) result += 360;
  }
  return result;
}

export function getCoordinateSuggestions(input, type) {
  if (!input || !input.trim()) return [];
  const text = input.trim().toUpperCase();
  const numericMatch = text.match(/^-?\d+(\.\d+)?/);
  if (!numericMatch) return [];
  const search = numericMatch[0].replace("-", "");
  const max = type === "latitude" ? 90 : 180;
  const suggestions = [];
  for (let value = 0; value <= max; value++) {
    const valueText = String(value);
    if (valueText.startsWith(search)) {
      if (type === "latitude") {
        suggestions.push({ value: `${value}° N`, coordinate: value });
        if (value !== 0) suggestions.push({ value: `${value}° S`, coordinate: -value });
      } else {
        suggestions.push({ value: `${value}° E`, coordinate: value });
        if (value !== 0) suggestions.push({ value: `${value}° W`, coordinate: -value });
      }
    }
    if (suggestions.length >= 18) break;
  }
  return suggestions;
}

function normalizeLongitude(lng) {
  let longitude = Number(lng);
  while (longitude > 180) longitude -= 360;
  while (longitude < -180) longitude += 360;
  return longitude;
}

// ============================================================
// LAND MASK HELPERS & PERFORMANCE OPTIMIZATION (BBOX CACHING)
// ============================================================

function getLandFeatures() {
  if (!landGeoJSON) return [];
  let rawFeatures = [];
  if (landGeoJSON.type === "FeatureCollection") {
    rawFeatures = (landGeoJSON.features || []).filter(
      (feature) => feature && feature.geometry && (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon")
    );
  } else if (landGeoJSON.type === "Feature" && landGeoJSON.geometry) {
    rawFeatures = [landGeoJSON];
  } else if (landGeoJSON.type === "Polygon" || landGeoJSON.type === "MultiPolygon") {
    rawFeatures = [turf.feature(landGeoJSON)];
  }
  return rawFeatures.map((feature) => ({ feature, bbox: turf.bbox(feature) }));
}

const landFeaturesWithBbox = getLandFeatures();

export function checkIfLand(lat, lng) {
  const latitude = Number(lat);
  const longitude = normalizeLongitude(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90) return false;
  if (!landFeaturesWithBbox.length) return false;
  const point = turf.point([longitude, latitude]);
  try {
    for (const item of landFeaturesWithBbox) {
      const [minLng, minLat, maxLng, maxLat] = item.bbox;
      if (longitude >= minLng && longitude <= maxLng && latitude >= minLat && latitude <= maxLat) {
        if (turf.booleanPointInPolygon(point, item.feature, { ignoreBoundary: false })) return true;
      }
    }
    return false;
  } catch (error) {
    return true;
  }
}

function isSafeOceanPoint(lat, lng) {
  if (checkIfLand(lat, lng)) return false;
  const safetyRadiusKm = 3;
  const directions = 8;
  for (let angle = 0; angle < 360; angle += 360 / directions) {
    const destination = turf.destination(turf.point([lng, lat]), safetyRadiusKm, angle, { units: "kilometers" });
    const [checkLng, checkLat] = destination.geometry.coordinates;
    if (checkIfLand(checkLat, checkLng)) return false;
  }
  return true;
}

export function snapToNearestOcean(lat, lng) {
  const originalLat = Number(lat);
  const originalLng = normalizeLongitude(lng);
  if (!Number.isFinite(originalLat) || !Number.isFinite(originalLng) || originalLat < -90 || originalLat > 90) {
    return { lat: originalLat, lng: originalLng, redirected: false, failed: true };
  }
  if (!checkIfLand(originalLat, originalLng)) {
    return { lat: originalLat, lng: originalLng, redirected: false, failed: false };
  }
  const directions = 16;
  const searchDistances = [2, 5, 10, 15, 20, 30, 45, 60, 80, 100, 130, 170, 220, 280, 350, 450, 600, 800, 1000, 1500, 2000, 3000];
  let bestCandidate = null;
  for (const distance of searchDistances) {
    for (let angle = 0; angle < 360; angle += 360 / directions) {
      const destination = turf.destination(turf.point([originalLng, originalLat]), distance, angle, { units: "kilometers" });
      const [candidateLng, candidateLat] = destination.geometry.coordinates;
      if (candidateLat < -90 || candidateLat > 90) continue;
      const normalizedLng = normalizeLongitude(candidateLng);
      if (checkIfLand(candidateLat, normalizedLng)) continue;
      if (!isSafeOceanPoint(candidateLat, normalizedLng)) continue;
      bestCandidate = { lat: Number(candidateLat.toFixed(6)), lng: Number(normalizedLng.toFixed(6)), redirected: true, failed: false };
      break;
    }
    if (bestCandidate) break;
  }
  if (bestCandidate) {
    if (checkIfLand(bestCandidate.lat, bestCandidate.lng)) {
      return { lat: originalLat, lng: originalLng, redirected: false, failed: true };
    }
    return bestCandidate;
  }
  return { lat: originalLat, lng: originalLng, redirected: false, failed: true };
}

// ============================================================
// FULL-PHRASE GLOBAL WATER BODY & CHANNEL TRANSLATOR
// ============================================================

// ============================================================
// FULL-PHRASE GLOBAL WATER BODY & CHANNEL TRANSLATOR
// ============================================================

// ============================================================
// FULL-PHRASE GLOBAL WATER BODY & CHANNEL TRANSLATOR
// ============================================================

export function parseAndTranslateApiSeaName(name, t) {
  if (!name || name.includes("Loading")) {
    return t("loadingSeaName") || "Loading sea name...";
  }
  if (name === "Open Ocean") {
    return t("openOcean") || "Open Ocean";
  }

  // Strip out messy geopolitical wrapper text (e.g., "Spanish part of the...")
  let cleanName = name;
  const partIndex = name.toLowerCase().indexOf("part of the");
  if (partIndex !== -1) {
    cleanName = name.substring(partIndex + 11).trim();
  } else {
    cleanName = name.replace(/\([^)]*\)/g, "").trim();
  }

  const upper = cleanName.toUpperCase();

  // Full-phrase matching mapped directly to translation keys including important channels
  if (upper.includes("NORTH ATLANTIC")) return t("northAtlanticOcean") || cleanName;
  if (upper.includes("SOUTH ATLANTIC")) return t("southAtlanticOcean") || cleanName;
  if (upper.includes("NORTH PACIFIC")) return t("northPacificOcean") || cleanName;
  if (upper.includes("SOUTH PACIFIC")) return t("southPacificOcean") || cleanName;
  if (upper.includes("INDIAN OCEAN")) return t("indianOcean") || cleanName;
  if (upper.includes("PACIFIC OCEAN") || upper.includes("PACIFIC")) return t("pacificOcean") || cleanName;
  if (upper.includes("ATLANTIC OCEAN") || upper.includes("ATLANTIC")) return t("atlanticOcean") || cleanName;
  if (upper.includes("SOUTHERN OCEAN") || upper.includes("ANTARCTIC")) return t("southernOcean") || cleanName;
  if (upper.includes("ARCTIC OCEAN") || upper.includes("ARCTIC")) return t("arcticOcean") || cleanName;
  
  if (upper.includes("ARABIAN")) return t("arabianSea") || cleanName;
  if (upper.includes("BENGAL")) return t("bayOfBengal") || cleanName;
  if (upper.includes("ANDAMAN")) return t("andamanSea") || cleanName;
  if (upper.includes("RED SEA")) return t("redSea") || cleanName;
  if (upper.includes("MEDITERRANEAN")) return t("mediterraneanSea") || cleanName;
  if (upper.includes("CARIBBEAN")) return t("caribbeanSea") || cleanName;
  if (upper.includes("GULF OF MEXICO")) return t("gulfOfMexico") || cleanName;
  if (upper.includes("PERSIAN")) return t("persianGulf") || cleanName;
  if (upper.includes("JAPAN SEA") || upper.includes("SEA OF JAPAN")) return t("seaOfJapan") || cleanName;
  if (upper.includes("SOUTH CHINA")) return t("southChinaSea") || cleanName;
  if (upper.includes("EAST CHINA")) return t("eastChinaSea") || cleanName;
  if (upper.includes("YELLOW SEA")) return t("yellowSea") || cleanName;
  if (upper.includes("BERING")) return t("beringSea") || cleanName;
  if (upper.includes("OKHOTSK")) return t("seaOfOkhotsk") || cleanName;
  if (upper.includes("PHILIPPINE")) return t("philippineSea") || cleanName;
  if (upper.includes("CORAL")) return t("coralSea") || cleanName;
  if (upper.includes("TASMAN")) return t("tasmanSea") || cleanName;
  if (upper.includes("SULU")) return t("suluSea") || cleanName;
  if (upper.includes("CELEBES")) return t("celebesSea") || cleanName;
  if (upper.includes("JAVA")) return t("javaSea") || cleanName;
  if (upper.includes("BANDA")) return t("bandaSea") || cleanName;
  if (upper.includes("SOLOMON")) return t("solomonSea") || cleanName;
  if (upper.includes("LACCADIVE")) return t("laccadiveSea") || cleanName;
  if (upper.includes("TIMOR")) return t("timorSea") || cleanName;
  if (upper.includes("ARAFURA")) return t("arafuraSea") || cleanName;
  if (upper.includes("BARENTS")) return t("barentsSea") || cleanName;
  if (upper.includes("KARA")) return t("karaSea") || cleanName;
  if (upper.includes("LAPTEV")) return t("laptevSea") || cleanName;
  if (upper.includes("SIBERIAN")) return t("eastSiberianSea") || cleanName;
  if (upper.includes("CHUKCHI")) return t("chukchiSea") || cleanName;
  if (upper.includes("WHITE SEA")) return t("whiteSea") || cleanName;
  if (upper.includes("BEAUFORT")) return t("beaufortSea") || cleanName;
  if (upper.includes("CASPIAN")) return t("caspianSea") || cleanName;
  if (upper.includes("ARAL")) return t("aralSea") || cleanName;
  if (upper.includes("DEAD SEA")) return t("deadSea") || cleanName;
  if (upper.includes("BLACK SEA")) return t("blackSea") || cleanName;
  if (upper.includes("BALTIC")) return t("balticSea") || cleanName;
  if (upper.includes("NORTH SEA")) return t("northSea") || cleanName;
  if (upper.includes("SARGASSO")) return t("sargassoSea") || cleanName;
  if (upper.includes("NORWEGIAN")) return t("norwegianSea") || cleanName;
  if (upper.includes("LABRADOR")) return t("labradorSea") || cleanName;
  if (upper.includes("IRISH")) return t("irishSea") || cleanName;
  if (upper.includes("MARMARA")) return t("seaOfMarmara") || cleanName;
  
  // Important Channels & Straits
  if (upper.includes("MOZAMBIQUE")) return t("mozambiqueChannel") || cleanName;
  if (upper.includes("ENGLISH CHANNEL") || upper.includes("ENGLISH")) return t("englishChannel") || cleanName;
  if (upper.includes("YUCATAN")) return t("yucatanStrait") || cleanName;
  if (upper.includes("DAVIS")) return t("davisStrait") || cleanName;
  if (upper.includes("DANISH")) return t("danishStrait") || cleanName;
  if (upper.includes("MALACCA")) return t("malaccaStrait") || cleanName;
  if (upper.includes("HORMUZ")) return t("hormuzStrait") || cleanName;
  if (upper.includes("GIBRALTAR")) return t("gibraltarStrait") || cleanName;
  if (upper.includes("BASS")) return t("bassStrait") || cleanName;
  if (upper.includes("COOK")) return t("cookStrait") || cleanName;
  if (upper.includes("FLORIDA")) return t("floridaStrait") || cleanName;
  if (upper.includes("TAIWAN")) return t("taiwanStrait") || cleanName;

  // Gulfs & Bays
  if (upper.includes("GUINEA")) return t("gulfOfGuinea") || cleanName;
  if (upper.includes("ADEN")) return t("gulfOfAden") || cleanName;
  if (upper.includes("CALIFORNIA")) return t("gulfOfCalifornia") || cleanName;
  if (upper.includes("THAILAND")) return t("gulfOfThailand") || cleanName;
  if (upper.includes("ALASKA")) return t("gulfOfAlaska") || cleanName;
  if (upper.includes("CARPENTARIA")) return t("gulfOfCarpentaria") || cleanName;
  if (upper.includes("HUDSON")) return t("hudsonBay") || cleanName;
  if (upper.includes("AUSTRALIAN BIGHT")) return t("greatAustralianBight") || cleanName;
  // Mediterranean & Surrounding Regional Seas
  if (upper.includes("AEGEAN")) return t("aegeanSea") || cleanName;
  if (upper.includes("IONIAN") || upper.includes("IRONIAN")) return t("ionianSea") || cleanName;
  if (upper.includes("CRETE") || upper.includes("CRETAN")) return t("creteSea") || cleanName;
  if (upper.includes("MARMARA")) return t("seaOfMarmara") || cleanName;
  return t("openOcean") || "Open Ocean";
}