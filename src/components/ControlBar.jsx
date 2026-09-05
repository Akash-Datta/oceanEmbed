import React, { useRef, useEffect } from "react";
import L from "leaflet";
import CoordinateInput from "./CoordinateInput";
import { useLanguage } from "../context/LanguageContext";

export default function ControlBar({
  startDate, setStartDate, endDate,
  depth, setDepth,
  latitude, setLatitude,
  longitude, setLongitude,
  handleGo,
  isLocationDisabled,
  showSidePanel
}) {
  const { t } = useLanguage();
  const controlRef = useRef(null);

  useEffect(() => {
    if (!controlRef.current) return;
    L.DomEvent.disableClickPropagation(controlRef.current);
    L.DomEvent.disableScrollPropagation(controlRef.current);
  }, []);

  const depthOptions = [];
  for (let value = 0; value <= 1000; value += 50) {
    depthOptions.push(value);
  }

  // LOGIC UPDATE: Disable depth if there's no date, OR if the user is typing 
  // coordinates but hasn't clicked "Go" yet (side panel is hidden).
  const isTypingLocation = (latitude !== "" || longitude !== "");
  const isDepthDisabled = !startDate || (isTypingLocation && !showSidePanel);
  
  // Allow Go click if they only want to drop a map marker without a date yet
  const isGoDisabled = !depth && (!latitude || !longitude);

  return (
    <div ref={controlRef} className="ocean-controls">
      <input
        type="date"
        className="ocean-control"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        title="Starting date"
      />
      <input
        type="date"
        className="ocean-control"
        value={endDate}
        readOnly
        title="Automatically calculated end date"
      />
      
      <select
        className="ocean-control"
        value={depth}
        disabled={isDepthDisabled}
        style={{ opacity: isDepthDisabled ? 0.5 : 1, cursor: isDepthDisabled ? 'not-allowed' : 'pointer' }}
        onChange={(e) => setDepth(e.target.value)}
      >
        <option value="">{t("chooseDepth")}</option>
        {depthOptions.map((val) => (
          <option key={val} value={val}>{val} m</option>
        ))}
      </select>
      
      <CoordinateInput
        type="latitude"
        value={latitude}
        setValue={setLatitude}
        disabled={isLocationDisabled}
      />
      <CoordinateInput
        type="longitude"
        value={longitude}
        setValue={setLongitude}
        disabled={isLocationDisabled}
      />
      
      <button
        type="button"
        className="ocean-go"
        onClick={handleGo}
        disabled={isGoDisabled}
        style={{ opacity: isGoDisabled ? 0.5 : 1, cursor: isGoDisabled ? 'not-allowed' : 'pointer' }}
      >
        {t("go")}
      </button>
    </div>
  );
}