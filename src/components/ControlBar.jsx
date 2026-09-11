<<<<<<< HEAD
import React, { useRef, useEffect } from "react";
import L from "leaflet";
import CoordinateInput from "./CoordinateInput";

export default function ControlBar({
  startDate, setStartDate, endDate,
  depth, setDepth,
  latitude, setLatitude,
  longitude, setLongitude,
  handleGo,
  isLocationDisabled,
  showSidePanel
}) {
  const controlRef = useRef(null);

=======
import React, { useRef, useEffect, useState } from "react";
import L from "leaflet";
import CoordinateInput from "./CoordinateInput";
import CustomDropdown from "./CustomDropdown";
import { useLanguage } from "../context/LanguageContext";

export default function ControlBar({
  date,
  setDate,
  depth,
  setDepth,
  parameter,
  setParameter,
  latitude,
  setLatitude,
  longitude,
  setLongitude,
  handleGo,
  handleRecenter,
  minDate,
  maxDate,
  isSidePanelOpen,
  userResolution,
  setUserResolution,
  isCurrentLocationOutside,
  triggerNotification
}) {
  const { t, language } = useLanguage();
  const controlRef = useRef(null);

  const [isMobile, setIsMobile] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 700);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

>>>>>>> origin/main
  useEffect(() => {
    if (!controlRef.current) return;
    L.DomEvent.disableClickPropagation(controlRef.current);
    L.DomEvent.disableScrollPropagation(controlRef.current);
  }, []);

  const depthOptions = [];
  for (let value = 0; value <= 1000; value += 50) {
    depthOptions.push(value);
  }

<<<<<<< HEAD
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
        <option value="">Choose depth</option>
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
        Go
=======
  const parameterOptions = [
    { id: "sst", label: t("sstFull") || "Sea Surface Temp (SST)" },
    { id: "ssh", label: t("sshFull") || "Sea Surface Height (SSH)" },
    { id: "sss", label: t("sssFull") || "Sea Surface Salinity (SSS)" },
    { id: "sscu", label: t("sscuFull") || "Eastward Current (SSCU)" },
    { id: "sscv", label: t("sscvFull") || "Northward Current (SSCV)" }
  ];

  const resolutionOptions = [];
  for (let i = 0.20; i <= 1.001; i += 0.05) {
    resolutionOptions.push(i.toFixed(2));
  }
  resolutionOptions.push("1.50", "2.00", "2.50");

  const isParameterSelected = Boolean(parameter);
  const isDepthSelected = Boolean(depth);
  const isTypingLocation = latitude !== "" || longitude !== "";
  
  const hasCoordinates = isSidePanelOpen || isTypingLocation;

  useEffect(() => {
    setHasSubmitted(false);
  }, [parameter, date]);

  const handleParameterChange = (val) => {
    setParameter(val);
    setHasSubmitted(false);

    if (val) {
      setDepth("");
      setLatitude("");
      setLongitude("");
    }

    setOpenDropdown(null);
  };

  const handleDepthChange = (val) => {
    setDepth(val);
    setHasSubmitted(false);

    if (val) {
      setParameter("");
      // FIXED: Removed setLatitude("") and setLongitude("") from here.
      // Selecting a depth will no longer erase your coordinates!
    }

    setOpenDropdown(null);
  };

  const onGoClick = () => {
    setHasSubmitted(true);
    setOpenDropdown(null);
    handleGo();
  };

  const isParameterDisabled =
    !date || isDepthSelected || isSidePanelOpen;

  // Disabled while typing location until the side panel opens
  const isDepthDisabled =
    !date || isParameterSelected || (isTypingLocation && !isSidePanelOpen);

  // FIXED: Coordinates are only disabled if Parameter is selected OR if Depth is selected BEFORE typing coordinates
  const areCoordinatesDisabled =
    isParameterSelected || (isDepthSelected && !hasCoordinates);

  const isResolutionRequiredAndMissing =
    isParameterSelected &&
    isCurrentLocationOutside &&
    !userResolution;

  const isGoDisabled =
    (!parameter && !depth && !isTypingLocation) ||
    isResolutionRequiredAndMissing;

  const showResolutionDropdown =
    isParameterSelected && date && !hasSubmitted;

  const strictItemStyle = {
    height: "42px",
    minHeight: "42px",
    display: "flex",
    alignItems: "center",
    boxSizing: "border-box",
    padding: "0 12px",
    width: "100%"
  };

  const mobileControlStyle = {
    left: "10px",
    right: "10px",
    width: "100%",
    padding: "10px",
    boxSizing: "border-box",
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(16px)",
    borderRadius: "16px",
    position: "relative",
    zIndex: openDropdown ? 99999 : 1000,
    overflow: "visible"
  };

  const desktopControlStyle = {
    left: "10px",
    right: "10px",
    width: "auto",
    maxWidth: "calc(100% - 20px)",
    height: "auto",
    minHeight: "min-content",
    padding: "8px",
    boxSizing: "border-box",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: "8px",
    overflow: "visible",
    position: "relative",
    zIndex: 9999 // Guaranteed elevated z-index for dropdown suggestions to break out cleanly
  };

  return (
    <div
      ref={controlRef}
      className="ocean-controls"
      style={isMobile ? mobileControlStyle : desktopControlStyle}
    >
      {isMobile && openDropdown && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99990,
            background: "transparent"
          }}
          onClick={() => setOpenDropdown(null)}
        />
      )}

      {/* ========================================================
          1. RECENTER / REFRESH BUTTON
      ======================================================== */}
      <button
        type="button"
        className="ocean-control recenter-btn"
        onClick={handleRecenter}
        title={t("recenterToDataset") || t("mapRefreshed") || "Recenter to Dataset"}
        style={
          isMobile
            ? {
                flex: "1 1 60px",
                minWidth: "60px",
                height: "44px",
                padding: "0 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                boxSizing: "border-box",
                borderRadius: "10px",
              }
            : {
                flexGrow: 1,
                flexShrink: 1,
                flexBasis: "90px",
                minWidth: "90px",
                height: "42px",
                padding: "0 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                boxSizing: "border-box",
              }
        }
      >
        <span style={{ fontSize: "20px", lineHeight: 1 }}>↺</span>
        <span style={{ fontSize: "13px", fontWeight: 800, letterSpacing: "0.3px", whiteSpace: "nowrap" }}>{t("reset")}</span>
      </button>

      {/* ========================================================
          2. DATE FIELD WRAPPER
      ======================================================== */}
      <div
        style={
          isMobile
            ? { flex: "1 1 auto", boxSizing: "border-box" }
            : {
                flexGrow: 0,
                flexShrink: 0,
                flexBasis: "120px",
                width: "120px",
                minWidth: "120px",
                boxSizing: "border-box"
              }
        }
      >
        <input
          type="date"
          className="ocean-control"
          value={date}
          min={minDate}
          max={maxDate}
          onChange={(e) => {
            setDate(e.target.value);
            setHasSubmitted(false);
          }}
          title={t("chooseDate") || "Select Date"}
          style={{
            width: "100%",
            minWidth: "100%",
            margin: 0,
            padding: "0 8px",
            fontSize: "13px",
            boxSizing: "border-box"
          }}
        />
      </div>

      {/* ========================================================
          3. PARAMETER SELECTION
      ======================================================== */}
      {isMobile ? (
        <div
          style={{
            position: "relative",
            width: "100%",
            zIndex: openDropdown === "parameter" ? 100000 : 1
          }}
        >
          <button
            type="button"
            className="ocean-control"
            disabled={isParameterDisabled}
            style={{
              width: "100%",
              opacity: isParameterDisabled ? 0.4 : 1,
              cursor: isParameterDisabled ? "not-allowed" : "pointer",
              textAlign: "left",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              position: "relative",
              zIndex: openDropdown === "parameter" ? 100001 : 1
            }}
            onClick={() =>
              setOpenDropdown(
                openDropdown === "parameter" ? null : "parameter"
              )
            }
          >
            <span>
              {parameter
                ? parameterOptions.find((p) => p.id === parameter)?.label
                : t("chooseParameter") || "Select Parameter"}
            </span>
            <span>▾</span>
          </button>

          {openDropdown === "parameter" && (
            <div
              className="mobile-inline-dropdown-list"
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: "calc(100% + 4px)",
                zIndex: 100002,
                pointerEvents: "auto",
                maxHeight: "126px",
                overflowY: "auto"
              }}
            >
              <div
                className={`mobile-inline-dropdown-item ${
                  parameter === "" ? "selected" : ""
                }`}
                style={strictItemStyle}
                onClick={() => handleParameterChange("")}
              >
                {t("chooseParameter") || "Select Parameter"}
              </div>

              {parameterOptions.map((param) => (
                <div
                  key={param.id}
                  className={`mobile-inline-dropdown-item ${
                    parameter === param.id ? "selected" : ""
                  }`}
                  style={strictItemStyle}
                  onClick={() => handleParameterChange(param.id)}
                >
                  {param.label}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            flexGrow: 1,
            flexShrink: 0,
            flexBasis: "170px",
            minWidth: "170px",
            opacity: isParameterDisabled ? 0.4 : 1,
            boxSizing: "border-box",
          }}
        >
          <CustomDropdown
            value={parameter}
            placeholder={t("chooseParameter") || "Select Parameter"}
            options={[
              { value: "", label: t("chooseParameter") || "Select Parameter" },
              ...parameterOptions.map((p) => ({ value: p.id, label: p.label })),
            ]}
            onChange={(val) => handleParameterChange(val)}
            disabled={isParameterDisabled}
            ariaLabel={t("chooseParameter") || "Select Parameter"}
          />
        </div>
      )}

      {/* ========================================================
          4. RESOLUTION SELECTION
      ======================================================== */}
      {showResolutionDropdown &&
        (isMobile ? (
          <div
            style={{
              position: "relative",
              width: "100%",
              zIndex: openDropdown === "resolution" ? 100000 : 1
            }}
          >
            <button
              type="button"
              className="ocean-control"
              disabled={!isCurrentLocationOutside}
              style={{
                width: "100%",
                opacity: !isCurrentLocationOutside ? 0.6 : 1,
                cursor: !isCurrentLocationOutside ? "not-allowed" : "pointer",
                textAlign: "left",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                position: "relative",
                zIndex: openDropdown === "resolution" ? 100001 : 1
              }}
              onClick={() =>
                setOpenDropdown(
                  openDropdown === "resolution" ? null : "resolution"
                )
              }
            >
              <span>
                {isCurrentLocationOutside && userResolution
                  ? `${userResolution}°`
                  : !isCurrentLocationOutside
                  ? `0.25° (${t("fixed")})`
                  : t("selectResolution") || "Select Resolution"}
              </span>
              <span>▾</span>
            </button>

            {openDropdown === "resolution" && isCurrentLocationOutside && (
              <div
                className="mobile-inline-dropdown-list"
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: "calc(100% + 4px)",
                  zIndex: 100002,
                  pointerEvents: "auto",
                  maxHeight: "168px",
                  overflowY: "auto"
                }}
              >
                {resolutionOptions.map((res) => (
                  <div
                    key={res}
                    className={`mobile-inline-dropdown-item ${
                      userResolution === res ? "selected" : ""
                    }`}
                    style={strictItemStyle}
                    onClick={() => {
                      setUserResolution(res);
                      const template =
                        t("resUpdated") || "Resolution updated to {res}°";
                      triggerNotification(template.replace("{res}", res));
                      setOpenDropdown(null);
                    }}
                  >
                    {res}°
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              flexGrow: 1,
              flexShrink: 0,
              flexBasis: "110px",
              minWidth: "110px",
              opacity: !isCurrentLocationOutside ? 0.6 : 1,
              boxSizing: "border-box",
              animation: "fadeIn 0.3s ease",
            }}
          >
            <CustomDropdown
              value={isCurrentLocationOutside ? userResolution : "0.25"}
              placeholder={t("selectResolution") || "Select Resolution"}
              options={
                !isCurrentLocationOutside
                  ? [{ value: "0.25", label: `0.25° (${t("fixed") || "Fixed"})` }]
                  : resolutionOptions.map((res) => ({ value: res, label: `${res}°` }))
              }
              onChange={(val) => {
                setUserResolution(val);
                const template = t("resUpdated") || "Resolution updated to {res}°";
                triggerNotification(template.replace("{res}", val));
              }}
              disabled={!isCurrentLocationOutside}
              height={42}
              fontSize={13}
              ariaLabel={t("selectResolution") || "Select Resolution"}
            />
          </div>
        ))}

      {/* ========================================================
          5. DEPTH SELECTION
      ======================================================== */}
      {isMobile ? (
        <div
          style={{
            position: "relative",
            width: "100%",
            zIndex: openDropdown === "depth" ? 100000 : 1
          }}
        >
          <button
            type="button"
            className="ocean-control"
            disabled={isDepthDisabled}
            style={{
              width: "100%",
              opacity: isDepthDisabled ? 0.4 : 1,
              cursor: isDepthDisabled ? "not-allowed" : "pointer",
              textAlign: "left",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              position: "relative",
              zIndex: openDropdown === "depth" ? 100001 : 1
            }}
            onClick={() =>
              setOpenDropdown(openDropdown === "depth" ? null : "depth")
            }
          >
            <span>
              {depth !== ""
                ? `${depth} m`
                : t("chooseDepth") || "Select Depth"}
            </span>
            <span>▾</span>
          </button>

          {openDropdown === "depth" && (
            <div
              className="mobile-inline-dropdown-list"
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: "calc(100% + 4px)",
                zIndex: 100002,
                pointerEvents: "auto",
                maxHeight: "84px",
                overflowY: "auto"
              }}
            >
              <div
                className={`mobile-inline-dropdown-item ${
                  depth === "" ? "selected" : ""
                }`}
                style={strictItemStyle}
                onClick={() => handleDepthChange("")}
              >
                {t("chooseDepth") || "Select Depth"}
              </div>

              {depthOptions.map((val) => (
                <div
                  key={val}
                  className={`mobile-inline-dropdown-item ${
                    depth === String(val) ? "selected" : ""
                  }`}
                  style={strictItemStyle}
                  onClick={() => handleDepthChange(String(val))}
                >
                  {val} m
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            flexGrow: 1,
            flexShrink: 0,
            flexBasis: "130px",
            minWidth: "130px",
            opacity: isDepthDisabled ? 0.4 : 1,
            boxSizing: "border-box",
          }}
        >
          <CustomDropdown
            value={depth}
            placeholder={t("chooseDepth") || "Select Depth"}
            options={[
              { value: "", label: t("chooseDepth") || "Select Depth" },
              ...depthOptions.map((val) => ({ value: String(val), label: `${val} m` })),
            ]}
            onChange={(val) => handleDepthChange(val)}
            disabled={isDepthDisabled}
            ariaLabel={t("chooseDepth") || "Select Depth"}
          />
        </div>
      )}

      {/* ========================================================
          6. COORDINATE INPUTS
      ======================================================== */}
      <div
        style={
          isMobile
            ? {
                display: "flex",
                gap: "8px",
                width: "100%",
                opacity: areCoordinatesDisabled ? 0.4 : 1,
                pointerEvents: areCoordinatesDisabled ? "none" : undefined,
                boxSizing: "border-box",
                overflow: "visible"
              }
            : {
                flexGrow: 2,
                flexShrink: 0,
                flexBasis: "240px",
                minWidth: "240px",
                opacity: areCoordinatesDisabled ? 0.4 : 1,
                pointerEvents: areCoordinatesDisabled ? "none" : undefined,
                display: "flex",
                gap: "6px",
                boxSizing: "border-box",
                overflow: "visible"
              }
        }
      >
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            position: "relative",
            zIndex: 99999
          }}
        >
          <CoordinateInput
            type="latitude"
            value={latitude}
            setValue={setLatitude}
            language={language}
          />
        </div>

        <div
          style={{
            flex: 1,
            overflow: "visible",
            position: "relative",
            zIndex: 99999
          }}
        >
          <CoordinateInput
            type="longitude"
            value={longitude}
            setValue={setLongitude}
            language={language}
          />
        </div>
      </div>

      {/* ========================================================
          7. GO BUTTON
      ======================================================== */}
      <button
        type="button"
        className="ocean-go"
        onClick={onGoClick}
        disabled={isGoDisabled}
        style={
          isMobile
            ? {
                width: "100%",
                height: "42px",
                opacity: isGoDisabled ? 0.5 : 1,
                cursor: isGoDisabled ? "not-allowed" : "pointer",
                boxSizing: "border-box"
              }
            : {
                flexGrow: 1,
                flexShrink: 0,
                flexBasis: "60px",
                minWidth: "60px",
                opacity: isGoDisabled ? 0.5 : 1,
                cursor: isGoDisabled ? "not-allowed" : "pointer",
                boxSizing: "border-box"
              }
        }
      >
        {t("go")}
>>>>>>> origin/main
      </button>
    </div>
  );
}