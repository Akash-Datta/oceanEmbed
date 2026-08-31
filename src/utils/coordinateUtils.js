export function formatLongitude(value) {
  let longitude = value;
  while (longitude > 180) longitude -= 360;
  while (longitude < -180) longitude += 360;
  
  if (Math.abs(longitude) < 0.000001) return "0°";
  
  const formatted = parseFloat(Math.abs(longitude).toFixed(6));
  
  return longitude > 0
    ? `${formatted}° E`
    : `${formatted}° W`;
}

export function formatLatitude(value) {
  if (Math.abs(value) < 0.000001) return "0°";
  
  const formatted = parseFloat(Math.abs(value).toFixed(6));
  
  return value > 0
    ? `${formatted}° N`
    : `${formatted}° S`;
}

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

// ============================================================
// WORLDWIDE OCEAN SNAPPER (EXPANDED LANDMASK)
// ============================================================
export function snapToNearestOcean(lat, lng) {
  let newLat = lat;
  
  let normalizedLng = lng;
  while (normalizedLng > 180) normalizedLng -= 360;
  while (normalizedLng < -180) normalizedLng += 360;
  
  let newLng = normalizedLng;

  // Fully expanded bounding boxes to ensure land clicks redirect to oceans
  const landZones = [
    { minLat: 8, maxLat: 35, minLng: 68, maxLng: 89, snapLat: lat, snapLng: 67.0 }, // India -> Arabian Sea
    { minLat: -35, maxLat: 37, minLng: -18, maxLng: 60, snapLat: 0.0, snapLng: 0.0 }, // Africa/Middle East -> Gulf of Guinea
    { minLat: 35, maxLat: 75, minLng: -10, maxLng: 40, snapLat: 45.0, snapLng: -15.0 }, // Europe -> Atlantic
    { minLat: 35, maxLat: 75, minLng: 40, maxLng: 180, snapLat: lat, snapLng: 150.0 }, // Russia/Northern Asia -> Pacific
    { minLat: 10, maxLat: 35, minLng: 90, maxLng: 130, snapLat: lat, snapLng: 135.0 }, // SE Asia/China -> Pacific
    { minLat: 15, maxLat: 75, minLng: -170, maxLng: -60, snapLat: lat, snapLng: -135.0 }, // North America -> Pacific
    { minLat: -55, maxLat: 15, minLng: -85, maxLng: -35, snapLat: lat, snapLng: -90.0 }, // South America -> Pacific
    { minLat: -45, maxLat: -10, minLng: 110, maxLng: 155, snapLat: lat, snapLng: 105.0 } // Australia -> Indian Ocean
  ];

  for (let zone of landZones) {
    if (lat >= zone.minLat && lat <= zone.maxLat && normalizedLng >= zone.minLng && normalizedLng <= zone.maxLng) {
      newLat = zone.snapLat;
      newLng = zone.snapLng;
      break; 
    }
  }

  return {
    lat: parseFloat(newLat.toFixed(6)),
    lng: parseFloat(newLng.toFixed(6))
  };
}