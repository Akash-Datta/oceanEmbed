export function formatLongitude(value) {
  let longitude = value;
  if (longitude > 180) longitude -= 360;
  if (longitude < -180) longitude += 360;
  
  // Use high precision check
  if (Math.abs(longitude) < 0.000001) return "0°";
  
  // Format up to 6 decimal places, parseFloat removes unnecessary trailing zeros
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
  if (type === "longitude" && (result < -180 || result > 180)) return null;

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

  // We still provide whole-number suggestions as quick options, 
  // but if the user is typing decimals, we let them type freely.
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