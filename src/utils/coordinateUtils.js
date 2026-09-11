import * as turf from "@turf/turf";
import landGeoJSON from "../data/landMask.json";
<<<<<<< HEAD

// ============================================================
// COORDINATE FORMATTING
// ============================================================

export function formatLongitude(value) {
  let longitude = Number(value);
=======
import marineGeoJSON from "../data/marineRegions.json";

// ============================================================
// COORDINATE PRECISION
// ============================================================

const COORDINATE_DECIMALS = 6;

// ============================================================
// LOCALIZED CARDINAL DIRECTIONS
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
  brx: { N: "उ", S: "द", E: "পূ", W: "प" },
  sa: { N: "उ", S: "द", E: "पूर्", W: "पश्चिम्" },
  mai: { N: "उ", S: "द", E: "पू", W: "प" },
  sat: { N: "U", S: "D", E: "P", W: "Pa" },
};

const negativeMarkers = [];
const positiveMarkers = [];

Object.values(cardinalDirections).forEach((dirs) => {
  if (!positiveMarkers.includes(dirs.N.toUpperCase())) positiveMarkers.push(dirs.N.toUpperCase());
  if (!positiveMarkers.includes(dirs.E.toUpperCase())) positiveMarkers.push(dirs.E.toUpperCase());
  if (!negativeMarkers.includes(dirs.S.toUpperCase())) negativeMarkers.push(dirs.S.toUpperCase());
  if (!negativeMarkers.includes(dirs.W.toUpperCase())) negativeMarkers.push(dirs.W.toUpperCase());
});

positiveMarkers.sort((a, b) => b.length - a.length);
negativeMarkers.sort((a, b) => b.length - a.length);

// ============================================================
// COORDINATE FORMATTERS
// ============================================================

export function formatLongitude(value, lang = "en") {
  let longitude = Number(value);
  if (!Number.isFinite(longitude)) return "";
>>>>>>> origin/main

  while (longitude > 180) longitude -= 360;
  while (longitude < -180) longitude += 360;

<<<<<<< HEAD
  if (Math.abs(longitude) < 0.000001) {
    return "0°";
  }

  const formatted = parseFloat(Math.abs(longitude).toFixed(6));

  return longitude > 0
    ? `${formatted}° E`
    : `${formatted}° W`;
}

export function formatLatitude(value) {
  const latitude = Number(value);

  if (Math.abs(latitude) < 0.000001) {
    return "0°";
  }

  const formatted = parseFloat(Math.abs(latitude).toFixed(6));

  return latitude > 0
    ? `${formatted}° N`
    : `${formatted}° S`;
=======
  if (Math.abs(longitude) < 0.0000005) return "0°";

  const formattedNum = new Intl.NumberFormat(lang === "en" ? "en-US" : "hi-IN", { 
    minimumFractionDigits: 0, maximumFractionDigits: COORDINATE_DECIMALS 
  }).format(Math.abs(longitude));

  const dirs = cardinalDirections[lang] || cardinalDirections.en;
  return longitude > 0 ? `${formattedNum}° ${dirs.E}` : `${formattedNum}° ${dirs.W}`;
}

export function formatLatitude(value, lang = "en") {
  const latitude = Number(value);
  if (!Number.isFinite(latitude)) return "";

  if (Math.abs(latitude) < 0.0000005) return "0°";

  const formattedNum = new Intl.NumberFormat(lang === "en" ? "en-US" : "hi-IN", { 
    minimumFractionDigits: 0, maximumFractionDigits: COORDINATE_DECIMALS 
  }).format(Math.abs(latitude));

  const dirs = cardinalDirections[lang] || cardinalDirections.en;
  return latitude > 0 ? `${formattedNum}° ${dirs.N}` : `${formattedNum}° ${dirs.S}`;
>>>>>>> origin/main
}

// ============================================================
// COORDINATE PARSER
// ============================================================

export function parseCoordinate(value, type) {
<<<<<<< HEAD
  if (!value || !value.trim()) {
    return null;
  }

  let text = value.trim().toUpperCase();
  let direction = null;

  if (/[NSEW]$/.test(text)) {
    direction = text.slice(-1);
    text = text.slice(0, -1).trim();
  }

  text = text.replace(/°/g, "").trim();

  const number = parseFloat(text);

  if (Number.isNaN(number)) {
    return null;
  }

  let result = number;

  if (direction === "S" || direction === "W") {
    result = -Math.abs(number);
  }

  if (direction === "N" || direction === "E") {
    result = Math.abs(number);
  }

  if (type === "latitude") {
    if (result < -90 || result > 90) {
      return null;
    }
  }

=======
  if (value === null || value === undefined) return null;

  const raw = String(value).trim();
  if (!raw) return null;

  const text = raw.toUpperCase();
  const match = text.match(/[-+]?\d+(?:\.\d+)?/);
  if (!match) return null;

  let result = Number.parseFloat(match[0]);
  if (!Number.isFinite(result)) return null;

  const directionText = text.replace(/[-+]?\d+(?:\.\d+)?/g, "").replace(/[°º]/g, "").replace(/[,\s]+/g, "").trim();
  let directionDetected = false;

  if (directionText) {
    for (const marker of negativeMarkers) {
      if (directionText === marker || directionText.endsWith(marker)) {
        result = -Math.abs(result);
        directionDetected = true;
        break;
      }
    }
    if (!directionDetected) {
      for (const marker of positiveMarkers) {
        if (directionText === marker || directionText.endsWith(marker)) {
          result = Math.abs(result);
          directionDetected = true;
          break;
        }
      }
    }
  }

  if (type === "latitude" && (result < -90 || result > 90)) return null;
>>>>>>> origin/main
  if (type === "longitude") {
    while (result > 180) result -= 360;
    while (result < -180) result += 360;
  }

<<<<<<< HEAD
  return result;
=======
  return Number(result.toFixed(COORDINATE_DECIMALS));
>>>>>>> origin/main
}

// ============================================================
// COORDINATE SUGGESTIONS
// ============================================================

<<<<<<< HEAD
export function getCoordinateSuggestions(input, type) {
  if (!input || !input.trim()) {
    return [];
  }

  const text = input.trim().toUpperCase();
  const numericMatch = text.match(/^-?\d+(\.\d+)?/);

  if (!numericMatch) {
    return [];
  }
=======
export function getCoordinateSuggestions(input, type, lang = "en") {
  if (!input || !String(input).trim()) return [];

  const text = String(input).trim().toUpperCase();
  const numericMatch = text.match(/^-?\d+(?:\.\d+)?/);
  if (!numericMatch) return [];
>>>>>>> origin/main

  const search = numericMatch[0].replace("-", "");
  const max = type === "latitude" ? 90 : 180;
  const suggestions = [];
<<<<<<< HEAD

  for (let value = 0; value <= max; value++) {
    const valueText = String(value);

    if (valueText.startsWith(search)) {
      if (type === "latitude") {
        suggestions.push({
          value: `${value}° N`,
          coordinate: value,
        });

        if (value !== 0) {
          suggestions.push({
            value: `${value}° S`,
            coordinate: -value,
          });
        }
      } else {
        suggestions.push({
          value: `${value}° E`,
          coordinate: value,
        });

        if (value !== 0) {
          suggestions.push({
            value: `${value}° W`,
            coordinate: -value,
          });
        }
      }
    }

    if (suggestions.length >= 18) {
      break;
    }
  }

=======
  const dirs = cardinalDirections[lang] || cardinalDirections.en;

  for (let value = 0; value <= max; value++) {
    const valueText = String(value);
    if (!valueText.startsWith(search)) continue;

    if (type === "latitude") {
      suggestions.push({ value: `${value}° ${dirs.N}`, coordinate: value });
      if (value !== 0) suggestions.push({ value: `${value}° ${dirs.S}`, coordinate: -value });
    } else {
      suggestions.push({ value: `${value}° ${dirs.E}`, coordinate: value });
      if (value !== 0) suggestions.push({ value: `${value}° ${dirs.W}`, coordinate: -value });
    }

    if (suggestions.length >= 18) break;
  }
>>>>>>> origin/main
  return suggestions;
}

// ============================================================
// LONGITUDE NORMALIZATION
// ============================================================

function normalizeLongitude(lng) {
  let longitude = Number(lng);
<<<<<<< HEAD

  while (longitude > 180) {
    longitude -= 360;
  }

  while (longitude < -180) {
    longitude += 360;
  }

=======
  if (!Number.isFinite(longitude)) return longitude;

  while (longitude > 180) longitude -= 360;
  while (longitude < -180) longitude += 360;
>>>>>>> origin/main
  return longitude;
}

// ============================================================
<<<<<<< HEAD
// LAND MASK HELPERS & PERFORMANCE OPTIMIZATION (BBOX CACHING)
// ============================================================

function getLandFeatures() {
  if (!landGeoJSON) {
    return [];
  }

  let rawFeatures = [];

  if (landGeoJSON.type === "FeatureCollection") {
    rawFeatures = (landGeoJSON.features || []).filter(
      (feature) =>
        feature &&
        feature.geometry &&
        (
          feature.geometry.type === "Polygon" ||
          feature.geometry.type === "MultiPolygon"
        )
    );
  } else if (landGeoJSON.type === "Feature" && landGeoJSON.geometry) {
    rawFeatures = [landGeoJSON];
  } else if (
    landGeoJSON.type === "Polygon" ||
    landGeoJSON.type === "MultiPolygon"
  ) {
    rawFeatures = [turf.feature(landGeoJSON)];
  }

  return rawFeatures.map((feature) => ({
    feature,
    bbox: turf.bbox(feature),
  }));
}

const landFeaturesWithBbox = getLandFeatures();

// ============================================================
// LAND DETECTION
=======
// GEOJSON FEATURE EXTRACTION
// ============================================================

function extractPolygonFeatures(geoJSON) {
  if (!geoJSON) return [];

  if (geoJSON.type === "FeatureCollection") {
    return (geoJSON.features || []).filter(
      (feature) => feature && feature.geometry && (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon")
    );
  }
  if (geoJSON.type === "Feature" && geoJSON.geometry && (geoJSON.geometry.type === "Polygon" || geoJSON.geometry.type === "MultiPolygon")) {
    return [geoJSON];
  }
  if (geoJSON.type === "Polygon" || geoJSON.type === "MultiPolygon") {
    return [turf.feature(geoJSON)];
  }
  return [];
}

// ============================================================
// LAND DATA
// ============================================================

const landFeatures = extractPolygonFeatures(landGeoJSON);
const landFeaturesWithBbox = landFeatures.map((feature) => ({
  feature,
  bbox: turf.bbox(feature),
}));

// ============================================================
// MARINE DATA
// ============================================================

const marineFeatures = extractPolygonFeatures(marineGeoJSON);
const marineFeaturesWithBbox = marineFeatures
  .map((feature) => ({ feature, bbox: turf.bbox(feature) }))
  .filter((item) => Array.isArray(item.bbox) && item.bbox.length === 4 && item.bbox.every(Number.isFinite));

// ============================================================
// CACHES
// ============================================================

const landCache = new Map();
const marineCache = new Map();
const waterBodyCache = new Map();

// ============================================================
// BOUNDING BOX TEST
// ============================================================

function pointInsideBbox(longitude, latitude, bbox) {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  return longitude >= minLng && longitude <= maxLng && latitude >= minLat && latitude <= maxLat;
}

// ============================================================
// LAND CHECK
>>>>>>> origin/main
// ============================================================

export function checkIfLand(lat, lng) {
  const latitude = Number(lat);
  const longitude = normalizeLongitude(lng);

<<<<<<< HEAD
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90
  ) {
    return false;
  }

  // Explicit regional safeguard for coastal/peninsula vector artifacts
  if (
    latitude >= 16.0 && latitude <= 26.0 &&
    longitude >= 52.0 && longitude <= 60.0
  ) {
    // Check if it's strictly over water features or land
    // Let bounding boxes handle general regions, but allow coastal waters through
  }

  if (!landFeaturesWithBbox.length) {
    console.error("High-resolution land mask is unavailable.");
    return false;
  }
=======
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90) return false;

  const key = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
  if (landCache.has(key)) return landCache.get(key);
  if (!landFeaturesWithBbox.length) return false;
>>>>>>> origin/main

  const point = turf.point([longitude, latitude]);

  try {
    for (const item of landFeaturesWithBbox) {
<<<<<<< HEAD
      const [minLng, minLat, maxLng, maxLat] = item.bbox;

      if (
        longitude >= minLng &&
        longitude <= maxLng &&
        latitude >= minLat &&
        latitude <= maxLat
      ) {
        if (
          turf.booleanPointInPolygon(point, item.feature, {
            ignoreBoundary: false,
          })
        ) {
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error("Land detection failed:", error);
    return true;
  }
}

// ============================================================
// SAFE OCEAN TEST (COASTAL FRIENDLY)
// ============================================================

function isSafeOceanPoint(lat, lng) {
  if (checkIfLand(lat, lng)) {
    return false;
  }

  /*
   * Reduced to 3 km and 8 directions so coastal waters, 
   * bays, and gulfs are fully accessible without false rejections.
   */
  const safetyRadiusKm = 3;
  const directions = 8;

  for (let angle = 0; angle < 360; angle += 360 / directions) {
    const destination = turf.destination(
      turf.point([lng, lat]),
      safetyRadiusKm,
      angle,
      { units: "kilometers" }
    );

    const [checkLng, checkLat] = destination.geometry.coordinates;

    if (checkIfLand(checkLat, checkLng)) {
      return false;
    }
  }

  return true;
}

// ============================================================
// SNAP LAND LOCATION TO SAFE OCEAN
=======
      if (!pointInsideBbox(longitude, latitude, item.bbox)) continue;
      if (turf.booleanPointInPolygon(point, item.feature, { ignoreBoundary: false })) {
        landCache.set(key, true);
        return true;
      }
    }
  } catch (error) {
    console.error("Land polygon check failed:", error);
  }

  landCache.set(key, false);
  return false;
}

// ============================================================
// MARINE FEATURE NAME EXTRACTION
// ============================================================

function getMarineFeatureName(feature) {
  if (!feature) return null;
  const properties = feature.properties || {};
  const candidates = [
    properties.name, properties.NAME, properties.name_en, properties.NAME_EN,
    properties.name_long, properties.NAME_LONG, properties.nameascii, properties.NAMEASCII,
    properties.name_english, properties.NAME_ENGLISH,
  ];

  for (const name of candidates) {
    if (typeof name === "string" && name.trim()) return name.trim();
  }
  return null;
}

// ============================================================
// MARINE NAME NORMALIZATION
// ============================================================

function normalizeMarineName(name) {
  if (!name) return null;

  let clean = String(name)
    .replace(/\([^)]*\)/g, "") 
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") 
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^The\s+/i, "");

  const aliases = {
    // ARCTIC / BERING / ALASKA
    "Arctic Ocean": "Arctic Ocean",
    "Beaufort Sea": "Beaufort Sea",
    "Chukchi Sea": "Chukchi Sea",
    "East Siberian Sea": "East Siberian Sea",
    "Laptev Sea": "Laptev Sea",
    "Kara Sea": "Kara Sea",
    "Barents Sea": "Barents Sea",
    "White Sea": "White Sea",
    "Greenland Sea": "Greenland Sea",
    "Norwegian Sea": "Norwegian Sea",
    "Iceland Sea": "Iceland Sea",
    "Irminger Sea": "Irminger Sea",
    "Bering Sea": "Bering Sea",
    "Bering Strait": "Bering Strait",
    "Gulf of Alaska": "Gulf of Alaska",
    "Gulf of Anadyr": "Gulf of Anadyr",
    "Bristol Bay": "Bristol Bay",
    "Norton Sound": "Norton Sound",
    "Cook Inlet": "Cook Inlet",
    "Prince William Sound": "Prince William Sound",
    "Shelikhov Gulf": "Shelikhov Gulf",
    "Shelikhov Bay": "Shelikhov Bay",
    "Shelikova Gulf": "Shelikova Gulf",
    "Shelikova Bay": "Shelikova Bay",
    "Shelikof Bay": "Shelikof Bay",
    "Shelikof Strait": "Shelikof Strait",
    "Gulf of Ob": "Gulf of Ob",
    "Gulf of Ob'": "Gulf of Ob",
    "Ob Gulf": "Gulf of Ob",

    // NORTH AMERICA
    "Hudson Bay": "Hudson Bay",
    "Hudson Strait": "Hudson Strait",
    "Baffin Bay": "Baffin Bay",
    "Davis Strait": "Davis Strait",
    "Labrador Sea": "Labrador Sea",
    "Gulf of St. Lawrence": "Gulf of St. Lawrence",
    "Gulf of Maine": "Gulf of Maine",
    "Bay of Fundy": "Bay of Fundy",
    "Gulf of Mexico": "Gulf of Mexico",
    "Caribbean Sea": "Caribbean Sea",
    "Gulf of California": "Gulf of California",

    // ATLANTIC / EUROPE
    "North Atlantic Ocean": "North Atlantic Ocean",
    "South Atlantic Ocean": "South Atlantic Ocean",
    "North Pacific Ocean": "North Pacific Ocean",
    "South Pacific Ocean": "South Pacific Ocean",
    "Bay of Biscay": "Bay of Biscay",
    "Gulf of Cadiz": "Gulf of Cadiz",
    "English Channel": "English Channel",
    "Irish Sea": "Irish Sea",
    "Celtic Sea": "Celtic Sea",
    "Bristol Channel": "Bristol Channel",
    "North Channel": "North Channel",
    "Sea of the Hebrides": "Sea of the Hebrides",
    "Inner Seas off the West Coast of Scotland": "Inner Seas",
    "Inner Seas": "Inner Seas",
    "North Sea": "North Sea",
    "Skagerrak": "Skagerrak",
    "Kattegat": "Kattegat",
    "Oresund": "Oresund",
    "Mecklenburg Bucht": "Mecklenburg Bucht",
    "Kaliningrad": "Kaliningrad",
    "Gulf of Bothnia": "Gulf of Bothnia",
    "Gulf of Finland": "Gulf of Finland",
    "Gulf of Riga": "Gulf of Riga",

    // MEDITERRANEAN / NORTH AFRICA
    "Mediterranean Sea": "Mediterranean Sea",
    "Alboran Sea": "Alboran Sea",
    "Balearic Sea": "Balearic Sea",
    "Ligurian Sea": "Ligurian Sea",
    "Tyrrhenian Sea": "Tyrrhenian Sea",
    "Adriatic Sea": "Adriatic Sea",
    "Ionian Sea": "Ionian Sea",
    "Aegean Sea": "Aegean Sea",
    "Sea of Crete": "Sea of Crete",
    "Sea of Marmara": "Sea of Marmara",
    "Black Sea": "Black Sea",
    "Sea of Azov": "Sea of Azov",
    "Gulf of Lion": "Gulf of Lion",
    "Golfe du Lion": "Gulf of Lion",
    "Gulf of Valencia": "Gulf of Valencia",
    "Gulf of Sidra": "Gulf of Sidra",
    "Gulf of Sirte": "Gulf of Sidra", 
    "Gulf of Gabes": "Gulf of Gabes",

    // MIDDLE EAST / INDIAN OCEAN
    "Red Sea": "Red Sea",
    "Gulf of Suez": "Gulf of Suez",
    "Gulf of Aqaba": "Gulf of Aqaba",
    "Gulf of Aden": "Gulf of Aden",
    "Gulf of Tadjoura": "Gulf of Tadjoura",
    "Gulf of Oman": "Gulf of Oman",
    "Persian Gulf": "Persian Gulf",
    "Strait of Hormuz": "Strait of Hormuz",
    "Indian Ocean": "Indian Ocean",
    "Arabian Sea": "Arabian Sea",
    "Bay of Bengal": "Bay of Bengal",
    "Laccadive Sea": "Laccadive Sea",
    "Gulf of Kachchh": "Gulf of Kachchh",
    "Gulf of Kutch": "Gulf of Kachchh",
    "Gulf of Khambhat": "Gulf of Khambhat",
    "Gulf of Khambat": "Gulf of Khambhat", 
    "Gulf of Cambay": "Gulf of Khambhat",
    "Gulf of Mannar": "Gulf of Mannar",
    "Palk Strait": "Palk Strait",
    "Andaman Sea": "Andaman Sea",
    "Gulf of Martaban": "Gulf of Martaban",
    "Mozambique Channel": "Mozambique Channel",
    "Gulf of Masira": "Gulf of Masira",
    "Masirah Bay": "Gulf of Masira",

    // SOUTHEAST ASIA
    "Strait of Malacca": "Strait of Malacca",
    "Gulf of Thailand": "Gulf of Thailand",
    "Gulf of Tonkin": "Gulf of Tonkin",
    "South China Sea": "South China Sea",
    "East China Sea": "East China Sea",
    "Yellow Sea": "Yellow Sea",
    "Bohai Sea": "Bohai Sea",
    "Bohai Gulf": "Bohai Gulf",
    "Taiwan Strait": "Taiwan Strait",
    "Korea Strait": "Korea Strait",
    "Sulu Sea": "Sulu Sea",
    "Celebes Sea": "Celebes Sea",
    "Molucca Sea": "Molucca Sea",
    "Halmahera Sea": "Halmahera Sea",
    "Seram Sea": "Seram Sea",
    "Ceram Sea": "Ceram Sea",
    "Banda Sea": "Banda Sea",
    "Flores Sea": "Flores Sea",
    "Bali Sea": "Bali Sea",
    "Java Sea": "Java Sea",
    "Timor Sea": "Timor Sea",
    "Arafura Sea": "Arafura Sea",
    "Makassar Strait": "Makassar Strait",
    "Lombok Strait": "Lombok Strait",
    "Sunda Strait": "Sunda Strait",
    "Torres Strait": "Torres Strait",

    // AUSTRALIA / PACIFIC
    "Gulf of Carpentaria": "Gulf of Carpentaria",
    "Gulf of Papua": "Gulf of Papua",
    "Coral Sea": "Coral Sea",
    "Tasman Sea": "Tasman Sea",
    "Solomon Sea": "Solomon Sea",
    "Bismarck Sea": "Bismarck Sea",
    "Great Australian Bight": "Great Australian Bight",
    "Bass Strait": "Bass Strait",
    "Cook Strait": "Cook Strait",
    "Philippine Sea": "Philippine Sea",

    // SOUTHERN OCEAN
    "Southern Ocean": "Southern Ocean",
    "Weddell Sea": "Weddell Sea",
    "Ross Sea": "Ross Sea",
    "Amundsen Sea": "Amundsen Sea",
    "Bellingshausen Sea": "Bellingshausen Sea",
    "Lazarev Sea": "Lazarev Sea",
    "Riiser-Larsen Sea": "Riiser-Larsen Sea",
    "Cosmonauts Sea": "Cosmonauts Sea",
    "Cooperation Sea": "Cooperation Sea",
    "Davis Sea": "Davis Sea",
    "Mawson Sea": "Mawson Sea",
    "D'Urville Sea": "D'Urville Sea",
    "Somov Sea": "Somov Sea",
    "Drake Passage": "Drake Passage",
    "Scotia Sea": "Scotia Sea",
    "Argentine Sea": "Argentine Sea",
    "Chilean Sea": "Chilean Sea"
  };

  const lowerClean = clean.toLowerCase();
  for (const [key, value] of Object.entries(aliases)) {
    if (key.toLowerCase() === lowerClean) {
      return value;
    }
  }

  return clean;
}

// ============================================================
// PREPARED MARINE FEATURES
// ============================================================

const preparedMarineRegions = marineFeaturesWithBbox
  .map((item) => {
    const name = normalizeMarineName(getMarineFeatureName(item.feature));
    if (!name) return null;
    return { feature: item.feature, bbox: item.bbox, name };
  })
  .filter(Boolean);

// ============================================================
// EXACT MARINE POLYGON LOOKUP
// ============================================================

export function getExactMarineRegion(lat, lng) {
  const latitude = Number(lat);
  const longitude = normalizeLongitude(lng);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90) return null;

  const key = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
  if (marineCache.has(key)) return marineCache.get(key);
  if (checkIfLand(latitude, longitude)) {
    marineCache.set(key, null);
    return null;
  }

  const point = turf.point([longitude, latitude]);

  try {
    for (const region of preparedMarineRegions) {
      if (!pointInsideBbox(longitude, latitude, region.bbox)) continue;
      if (turf.booleanPointInPolygon(point, region.feature, { ignoreBoundary: false })) {
        const result = { name: region.name, feature: region.feature };
        marineCache.set(key, result);
        return result;
      }
    }
  } catch (error) {
    console.error("Marine polygon lookup failed:", error);
  }

  marineCache.set(key, null);
  return null;
}

// ============================================================
// HYBRID FALLBACK
// ============================================================

function getFallbackWaterBody(latitude, longitude) {
  // Localized precise gulfs
  if (latitude >= 9.1 && latitude <= 11.0 && longitude >= 78.5 && longitude <= 80.5) return "Palk Strait";
  if (latitude >= 7.5 && latitude < 9.1 && longitude >= 77.5 && longitude <= 80.0) return "Gulf of Mannar";
  if (latitude >= 20.0 && latitude <= 22.5 && longitude >= 71.5 && longitude <= 73.0) return "Gulf of Khambhat";
  if (latitude >= 22.1 && latitude <= 23.2 && longitude >= 68.8 && longitude <= 70.5) return "Gulf of Kachchh";
  if (latitude >= 19.0 && latitude <= 21.0 && longitude >= 57.5 && longitude <= 59.5) return "Gulf of Masira";
  if (latitude >= 24.0 && latitude <= 30.0 && longitude >= 48.0 && longitude <= 56.0) return "Persian Gulf";
  if (latitude >= 22.0 && latitude < 26.0 && longitude > 56.0 && longitude <= 60.0) return "Gulf of Oman";
  if (latitude >= 12.0 && latitude <= 30.0 && longitude >= 32.0 && longitude <= 44.0) return "Red Sea";
  if (latitude >= 10.0 && latitude < 16.0 && longitude >= 43.0 && longitude <= 52.0) return "Gulf of Aden";
  if (latitude >= 5.0 && latitude <= 23.0 && longitude > 77.0 && longitude <= 95.0) return "Bay of Bengal";
  if (latitude >= 8.0 && latitude <= 26.0 && longitude >= 50.0 && longitude < 77.0) return "Arabian Sea";
  if (latitude >= -25.0 && latitude <= -10.0 && longitude >= 30.0 && longitude <= 50.0) return "Mozambique Channel";
  if (latitude >= 5.0 && latitude <= 15.0 && longitude >= 92.0 && longitude <= 99.0) return "Andaman Sea";
  if (latitude >= 30.5 && latitude <= 33.5 && longitude >= 15.0 && longitude <= 20.5) return "Gulf of Sidra";

  // Absolute Major Ocean Catch-alls
  if (latitude >= 66.5) return "Arctic Ocean";
  if (latitude <= -60.0) return "Southern Ocean";
  
  if (longitude >= 20.0 && longitude <= 147.0) {
    if (latitude <= 30.0) return "Indian Ocean";
  }
  
  if (longitude > -65.0 && longitude <= 20.0) {
    if (latitude > 0) return "North Atlantic Ocean";
    return "South Atlantic Ocean";
  }
  
  if (latitude > 0) return "North Pacific Ocean";
  return "South Pacific Ocean";
}

// ============================================================
// EXACT WATER BODY NAME
// ============================================================

export function getWaterBodyName(lat, lng) {
  const latitude = Number(lat);
  const longitude = normalizeLongitude(lng);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90) return null;

  const key = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
  if (waterBodyCache.has(key)) return waterBodyCache.get(key);

  if (checkIfLand(latitude, longitude)) {
    waterBodyCache.set(key, null);
    return null;
  }

  const region = getExactMarineRegion(latitude, longitude);
  if (region?.name) {
    waterBodyCache.set(key, region.name);
    return region.name;
  }

  const fallbackName = getFallbackWaterBody(latitude, longitude);
  waterBodyCache.set(key, fallbackName);
  return fallbackName;
}

// ============================================================
// SNAP TO NEAREST OCEAN (Robust 2000km Radial Search)
>>>>>>> origin/main
// ============================================================

export function snapToNearestOcean(lat, lng) {
  const originalLat = Number(lat);
  const originalLng = normalizeLongitude(lng);

<<<<<<< HEAD
  if (
    !Number.isFinite(originalLat) ||
    !Number.isFinite(originalLng) ||
    originalLat < -90 ||
    originalLat > 90
  ) {
    return {
      lat: originalLat,
      lng: originalLng,
      redirected: false,
      failed: true,
    };
  }

  if (!checkIfLand(originalLat, originalLng)) {
    return {
      lat: originalLat,
      lng: originalLng,
      redirected: false,
=======
  if (!Number.isFinite(originalLat) || !Number.isFinite(originalLng) || originalLat < -90 || originalLat > 90) {
    return { lat: originalLat, lng: originalLng, redirected: false, failed: true };
  }

  if (!checkIfLand(originalLat, originalLng)) {
    return { lat: originalLat, lng: originalLng, redirected: false, failed: false };
  }

  const directions = 48;
  const searchDistances = [
    0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10,
    12.5, 15, 20, 25, 30, 40, 50, 65, 80, 100, 130, 160, 200,
    250, 300, 400, 500, 650, 800, 1000, 1300, 1600, 2000
  ];

  let bestCandidate = null;
  let minDistance = Infinity;
  let bestAngle = 0;

  for (const distance of searchDistances) {
    for (let angle = 0; angle < 360; angle += 360 / directions) {
      const destination = turf.destination(turf.point([originalLng, originalLat]), distance, angle, { units: "kilometers" });
      const [candidateLng, candidateLat] = destination.geometry.coordinates;
      
      if (candidateLat < -90 || candidateLat > 90) continue;
      
      const normalizedLng = normalizeLongitude(candidateLng);

      if (!checkIfLand(candidateLat, normalizedLng)) {
        if (distance < minDistance) {
          minDistance = distance;
          bestCandidate = { lat: candidateLat, lng: normalizedLng };
          bestAngle = angle;
        }
      }
    }
    if (bestCandidate) break;
  }

  if (bestCandidate) {
    let finalLat = bestCandidate.lat;
    let finalLng = bestCandidate.lng;

    const pushDist = Math.min(1.5, Math.max(0.2, minDistance * 0.05));
    const offshoreDest = turf.destination(
      turf.point([bestCandidate.lng, bestCandidate.lat]),
      pushDist,
      bestAngle,
      { units: "kilometers" }
    );
    
    const [offshoreLng, offshoreLat] = offshoreDest.geometry.coordinates;
    const normalizedOffshoreLng = normalizeLongitude(offshoreLng);
    
    if (offshoreLat >= -90 && offshoreLat <= 90 && !checkIfLand(offshoreLat, normalizedOffshoreLng)) {
      finalLat = offshoreLat;
      finalLng = normalizedOffshoreLng;
    }

    return {
      lat: Number(finalLat.toFixed(6)),
      lng: Number(finalLng.toFixed(6)),
      redirected: true,
>>>>>>> origin/main
      failed: false,
    };
  }

<<<<<<< HEAD
  const directions = 16;
  const searchDistances = [
    2, 5, 10, 15, 20, 30, 45, 60, 80, 100, 130, 170, 220, 280, 350, 450,
    600, 800, 1000, 1300, 1600, 2000, 2500, 3000,
  ];

  let bestCandidate = null;

  for (const distance of searchDistances) {
    for (let angle = 0; angle < 360; angle += 360 / directions) {
      const destination = turf.destination(
        turf.point([originalLng, originalLat]),
        distance,
        angle,
        { units: "kilometers" }
      );

      const [candidateLng, candidateLat] = destination.geometry.coordinates;

      if (candidateLat < -90 || candidateLat > 90) {
        continue;
      }

      const normalizedLng = normalizeLongitude(candidateLng);

      if (checkIfLand(candidateLat, normalizedLng)) {
        continue;
      }

      if (!isSafeOceanPoint(candidateLat, normalizedLng)) {
        continue;
      }

      bestCandidate = {
        lat: Number(candidateLat.toFixed(6)),
        lng: Number(normalizedLng.toFixed(6)),
        redirected: true,
        failed: false,
      };

      break;
    }

    if (bestCandidate) {
      break;
    }
  }

  if (bestCandidate) {
    if (checkIfLand(bestCandidate.lat, bestCandidate.lng)) {
      return {
        lat: originalLat,
        lng: originalLng,
        redirected: false,
        failed: true,
      };
    }

    return bestCandidate;
  }

  return {
    lat: originalLat,
    lng: originalLng,
    redirected: false,
    failed: true,
  };
}

// ============================================================
// REGIONAL WATER BODY DETECTION
// ============================================================

export function getRegionalWaterBodyName(lat, lng) {
  const latitude = Number(lat);
  const longitude = normalizeLongitude(lng);

  if (
    latitude >= 5 &&
    latitude <= 30 &&
    longitude >= 50 &&
    longitude <= 78
  ) {
    return "Arabian Sea";
  }

  if (
    latitude >= 5 &&
    latitude <= 25 &&
    longitude > 78 &&
    longitude <= 100
  ) {
    return "Bay of Bengal";
  }

  if (
    latitude >= 5 &&
    latitude <= 18 &&
    longitude > 96 &&
    longitude <= 101
  ) {
    return "Andaman Sea";
  }

  return "Indian Ocean";
=======
  return { lat: originalLat, lng: originalLng, redirected: false, failed: true };
}

// ============================================================
// TRANSLATION KEY MAP
// ============================================================

const EXACT_WATER_BODY_KEYS = {
  // Southern Ocean
  "Weddell Sea": "weddellSea",
  "Ross Sea": "rossSea",
  "Amundsen Sea": "amundsenSea",
  "Bellingshausen Sea": "bellingshausenSea",
  "Southern Ocean": "southernOcean",
  "Lazarev Sea": "lazarevSea",
  "Riiser-Larsen Sea": "riiserLarsenSea",
  "Cosmonauts Sea": "cosmonautsSea",
  "Cooperation Sea": "cooperationSea",
  "Davis Sea": "davisSea",
  "Mawson Sea": "mawsonSea",
  "D'Urville Sea": "durvilleSea",
  "Somov Sea": "somovSea",
  "Drake Passage": "drakePassage",
  "Scotia Sea": "scotiaSea",

  // Arctic / North Pacific
  "Arctic Ocean": "arcticOcean",
  "Greenland Sea": "greenlandSea",
  "Norwegian Sea": "norwegianSea",
  "Iceland Sea": "icelandSea",
  "Irminger Sea": "irmingerSea",
  "Barents Sea": "barentsSea",
  "White Sea": "whiteSea",
  "Kara Sea": "karaSea",
  "Laptev Sea": "laptevSea",
  "East Siberian Sea": "eastSiberianSea",
  "Chukchi Sea": "chukchiSea",
  "Beaufort Sea": "beaufortSea",
  "Bering Sea": "beringSea",
  "Bering Strait": "beringStrait",
  "Sea of Okhotsk": "seaOfOkhotsk",
  "Sea of Japan": "seaOfJapan",
  "Gulf of Ob": "gulfOfOb",

  // Alaska
  "Gulf of Alaska": "gulfOfAlaska",
  "Gulf of Anadyr": "gulfOfAnadyr",
  "Bristol Bay": "bristolBay",
  "Norton Sound": "nortonSound",
  "Cook Inlet": "cookInlet",
  "Prince William Sound": "princeWilliamSound",
  "Shelikhov Gulf": "shelikhovGulf",
  "Shelikhov Bay": "shelikhovBay",
  "Shelikova Gulf": "shelikovaGulf",
  "Shelikova Bay": "shelikovaBay",
  "Shelikof Bay": "shelikofBay",
  "Shelikof Strait": "shelikofStrait",

  // North America
  "Hudson Bay": "hudsonBay",
  "Hudson Strait": "hudsonStrait",
  "Baffin Bay": "baffinBay",
  "Davis Strait": "davisStrait",
  "Labrador Sea": "labradorSea",
  "Gulf of St. Lawrence": "gulfOfStLawrence",
  "Gulf of Maine": "gulfOfMaine",
  "Bay of Fundy": "bayOfFundy",
  "Gulf of Mexico": "gulfOfMexico",
  "Caribbean Sea": "caribbeanSea",
  "Gulf of California": "gulfOfCalifornia",

  // Atlantic / Europe
  "North Atlantic Ocean": "northAtlanticOcean",
  "South Atlantic Ocean": "southAtlanticOcean",
  "North Sea": "northSea",
  "English Channel": "englishChannel",
  "Irish Sea": "irishSea",
  "Celtic Sea": "celticSea",
  "Bristol Channel": "bristolChannel",
  "Bay of Biscay": "bayOfBiscay",
  "Gulf of Cadiz": "gulfOfCadiz",
  "Skagerrak": "skagerrak",
  "Kattegat": "kattegat",
  "Oresund": "oresund",
  "Mecklenburg Bucht": "mecklenburgBucht",
  "Kaliningrad": "kaliningrad",
  "Gulf of Bothnia": "gulfOfBothnia",
  "Gulf of Finland": "gulfOfFinland",
  "Gulf of Riga": "gulfOfRiga",
  "North Channel": "northChannel",
  "Sea of the Hebrides": "seaOfTheHebrides",
  "Inner Seas": "innerSeas",

  // Mediterranean
  "Mediterranean Sea": "mediterraneanSea",
  "Alboran Sea": "alboranSea",
  "Balearic Sea": "balearicSea",
  "Ligurian Sea": "ligurianSea",
  "Tyrrhenian Sea": "tyrrhenianSea",
  "Adriatic Sea": "adriaticSea",
  "Ionian Sea": "ionianSea",
  "Aegean Sea": "aegeanSea",
  "Sea of Crete": "seaOfCrete",
  "Sea of Marmara": "seaOfMarmara",
  "Black Sea": "blackSea",
  "Sea of Azov": "seaOfAzov",
  "Gulf of Lion": "gulfOfLion",
  "Gulf of Valencia": "gulfOfValencia",
  "Gulf of Sidra": "gulfOfSidra",
  "Gulf of Gabes": "gulfOfGabes",

  // Middle East
  "Red Sea": "redSea",
  "Gulf of Suez": "gulfOfSuez",
  "Gulf of Aqaba": "gulfOfAqaba",
  "Gulf of Aden": "gulfOfAden",
  "Gulf of Tadjoura": "gulfOfTadjoura",
  "Gulf of Oman": "gulfOfOman",
  "Persian Gulf": "persianGulf",
  "Strait of Hormuz": "straitOfHormuz",

  // Indian Ocean
  "Indian Ocean": "indianOcean",
  "Arabian Sea": "arabianSea",
  "Bay of Bengal": "bayOfBengal",
  "Laccadive Sea": "laccadiveSea",
  "Gulf of Kachchh": "gulfOfKachchh",
  "Gulf of Khambhat": "gulfOfKhambhat",
  "Gulf of Mannar": "gulfOfMannar",
  "Palk Strait": "palkStrait",
  "Andaman Sea": "andamanSea",
  "Gulf of Martaban": "gulfOfMartaban",
  "Mozambique Channel": "mozambiqueChannel",
  "Gulf of Masira": "gulfOfMasira",

  // Southeast Asia
  "Strait of Malacca": "straitOfMalacca",
  "Gulf of Thailand": "gulfOfThailand",
  "Gulf of Tonkin": "gulfOfTonkin",
  "South China Sea": "southChinaSea",
  "East China Sea": "eastChinaSea",
  "Yellow Sea": "yellowSea",
  "Bohai Sea": "bohaiSea",
  "Bohai Gulf": "bohaiGulf",
  "Taiwan Strait": "taiwanStrait",
  "Korea Strait": "koreaStrait",
  "Sulu Sea": "suluSea",
  "Celebes Sea": "celebesSea",
  "Molucca Sea": "moluccaSea",
  "Halmahera Sea": "halmaheraSea",
  "Seram Sea": "seramSea",
  "Ceram Sea": "ceramSea",
  "Banda Sea": "bandaSea",
  "Flores Sea": "floresSea",
  "Bali Sea": "baliSea",
  "Java Sea": "javaSea",
  "Timor Sea": "timorSea",
  "Arafura Sea": "arafuraSea",
  "Makassar Strait": "makassarStrait",
  "Lombok Strait": "lombokStrait",
  "Sunda Strait": "sundaStrait",
  "Torres Strait": "torresStrait",

  // Australia / Pacific
  "Gulf of Carpentaria": "gulfOfCarpentaria",
  "Gulf of Papua": "gulfOfPapua",
  "Coral Sea": "coralSea",
  "Tasman Sea": "tasmanSea",
  "Solomon Sea": "solomonSea",
  "Bismarck Sea": "bismarckSea",
  "Great Australian Bight": "greatAustralianBight",
  "Bass Strait": "bassStrait",
  "Cook Strait": "cookStrait",
  "Philippine Sea": "philippineSea",

  // Existing project keys
  "Argentine Sea": "argentineSea",
  "Chilean Sea": "chileanSea",
  "Gulf of Guinea": "gulfOfGuinea",
};

// ============================================================
// TRANSLATION FUNCTION (Now fully case-insensitive & normalized)
// ============================================================

export function parseAndTranslateApiSeaName(name, t) {
  if (!name || String(name).toLowerCase().includes("loading")) {
    return t("loadingSeaName") || "Loading sea name...";
  }

  const normalized = normalizeMarineName(name);

  if (normalized) {
    const lowerNormalized = normalized.toLowerCase();
    const exactKeyMatch = Object.keys(EXACT_WATER_BODY_KEYS).find(
      (k) => k.toLowerCase() === lowerNormalized
    );

    if (exactKeyMatch) {
      const translationKey = EXACT_WATER_BODY_KEYS[exactKeyMatch];
      return t(translationKey) || exactKeyMatch;
    }
  }

  const cleanName = String(name).replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
  return cleanName;
>>>>>>> origin/main
}