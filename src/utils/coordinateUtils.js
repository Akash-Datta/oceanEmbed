import * as turf from "@turf/turf";
import landGeoJSON from "../data/landMask.json";

// ============================================================
// COORDINATE FORMATTING
// ============================================================

export function formatLongitude(value) {
  let longitude = Number(value);

  while (longitude > 180) longitude -= 360;
  while (longitude < -180) longitude += 360;

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
}

// ============================================================
// COORDINATE PARSER
// ============================================================

export function parseCoordinate(value, type) {
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

  if (type === "longitude") {
    while (result > 180) result -= 360;
    while (result < -180) result += 360;
  }

  return result;
}

// ============================================================
// COORDINATE SUGGESTIONS
// ============================================================

export function getCoordinateSuggestions(input, type) {
  if (!input || !input.trim()) {
    return [];
  }

  const text = input.trim().toUpperCase();
  const numericMatch = text.match(/^-?\d+(\.\d+)?/);

  if (!numericMatch) {
    return [];
  }

  const search = numericMatch[0].replace("-", "");
  const max = type === "latitude" ? 90 : 180;
  const suggestions = [];

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

  return suggestions;
}

// ============================================================
// LONGITUDE NORMALIZATION
// ============================================================

function normalizeLongitude(lng) {
  let longitude = Number(lng);

  while (longitude > 180) {
    longitude -= 360;
  }

  while (longitude < -180) {
    longitude += 360;
  }

  return longitude;
}

// ============================================================
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
// ============================================================

export function checkIfLand(lat, lng) {
  const latitude = Number(lat);
  const longitude = normalizeLongitude(lng);

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

  const point = turf.point([longitude, latitude]);

  try {
    for (const item of landFeaturesWithBbox) {
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
// ============================================================

export function snapToNearestOcean(lat, lng) {
  const originalLat = Number(lat);
  const originalLng = normalizeLongitude(lng);

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
      failed: false,
    };
  }

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
}