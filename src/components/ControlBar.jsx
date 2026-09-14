import React, { useEffect, useState } from "react";
import CoordinateInput from "./CoordinateInput";
import CustomDropdown from "./CustomDropdown";
import Icon from "./icons";
import { useLanguage } from "../context/LanguageContext";

function MobileMenu({ items, selectedValue, onSelect, placeholder }) {
  return (
    <div
      role="listbox"
      aria-label={placeholder}
      className="absolute inset-x-0 top-[calc(100%+4px)] z-dropdown max-h-[168px] overflow-y-auto rounded-lg border border-ink/10 bg-paper p-1.5 shadow-lift
        dark:border-paper/20 dark:bg-paper/[0.07]"
    >
      <div
        role="option"
        aria-selected={selectedValue === ""}
        tabIndex={0}
        onClick={() => onSelect("")}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(""); } }}
        className={`oe-focus-visible flex h-[42px] cursor-pointer items-center rounded-lg px-3 text-[13px] font-semibold
          ${selectedValue === ""
            ? "bg-accent text-white dark:bg-accent"
            : "text-ink hover:bg-ink/[0.06] dark:text-paper dark:hover:bg-paper/10"}`}
      >
        {placeholder}
      </div>
      {items.map((item) => {
        const isSel = String(selectedValue) === String(item.value);
        return (
          <div
            key={String(item.value)}
            role="option"
            aria-selected={isSel}
            tabIndex={0}
            onClick={() => onSelect(item.value)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(item.value); } }}
            className={`oe-focus-visible flex h-[42px] cursor-pointer items-center justify-between rounded-lg px-3 text-[13px] font-semibold
              ${isSel
                ? "bg-accent text-white dark:bg-accent"
                : "text-ink hover:bg-ink/[0.06] dark:text-paper dark:hover:bg-paper/10"}`}
          >
            <span>{item.label}</span>
            {isSel && <Icon name="check" size={14} />}
          </div>
        );
      })}
    </div>
  );
}

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

  const [isMobile, setIsMobile] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 700);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const depthOptions = [];
  for (let value = 0; value <= 1000; value += 50) {
    depthOptions.push(value);
  }

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

  const isDepthDisabled =
    !date || isParameterSelected || (isTypingLocation && !isSidePanelOpen);

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

  const controlBtn = "oe-focus-visible inline-flex h-[42px] items-center justify-between gap-2 rounded-lg border px-3 text-left text-[13px] font-semibold transition-colors cursor-pointer border-ink/10 bg-paper text-ink hover:border-accent dark:border-paper/20 dark:bg-ink dark:text-paper dark:hover:border-paper/30 disabled:cursor-not-allowed disabled:opacity-50";

  const renderMobileTrigger = (key, display, disabled) => (
    <button
      type="button"
      className={`${controlBtn} w-full`}
      disabled={disabled}
      aria-haspopup="listbox"
      aria-expanded={openDropdown === key}
      onClick={() => setOpenDropdown(openDropdown === key ? null : key)}
    >
      <span className="overflow-hidden text-ellipsis">{display}</span>
      <Icon name="chevronDown" size={13} className={`shrink-0 opacity-75 transition-transform ${openDropdown === key ? "rotate-180" : ""}`} />
    </button>
  );

  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-lg border border-ink/10/80 bg-paper/95 p-2 backdrop-blur-md
        dark:border-paper/10 dark:bg-ink/95 dark:shadow-none"
    >
      {isMobile && openDropdown && (
        <div
          className="fixed inset-0 z-[99990] bg-transparent"
          onClick={() => setOpenDropdown(null)}
        />
      )}

      {/* Recenter */}
      <button
        type="button"
        onClick={handleRecenter}
        title={t("recenterToDataset") || t("mapRefreshed") || "Recenter to Dataset"}
        className="oe-focus-visible inline-flex h-[42px] min-w-[60px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent px-3 text-[13px] font-semibold text-white transition-colors hover:brightness-95 sm:flex-none sm:basis-[90px]"
        >
          <Icon name="reset" size={14} />
        <span className="whitespace-nowrap">{t("reset")}</span>
      </button>

      {/* Date */}
      <input
        type="date"
        value={date}
        min={minDate}
        max={maxDate}
        onChange={(e) => {
          setDate(e.target.value);
          setHasSubmitted(false);
        }}
        title={t("chooseDate") || "Select Date"}
        aria-label={t("chooseDate") || "Select Date"}
        className="oe-focus-visible h-[42px] w-full rounded-lg border border-ink/10 bg-paper px-2 text-[13px] font-semibold text-ink sm:w-[120px] sm:min-w-[120px] sm:flex-none
          dark:border-paper/20 dark:bg-ink dark:text-paper"
      />

      {/* Parameter */}
      {isMobile ? (
        <div className="relative w-full">
          {renderMobileTrigger(
            "parameter",
            parameter ? parameterOptions.find((p) => p.id === parameter)?.label : t("chooseParameter") || "Select Parameter",
            isParameterDisabled
          )}
          {openDropdown === "parameter" && (
            <MobileMenu
              items={parameterOptions.map((p) => ({ value: p.id, label: p.label }))}
              selectedValue={parameter}
              placeholder={t("chooseParameter") || "Select Parameter"}
              onSelect={handleParameterChange}
            />
          )}
        </div>
      ) : (
        <div className={`min-w-[170px] flex-1 basis-[170px] ${isParameterDisabled ? "opacity-40" : ""}`}>
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

      {/* Resolution */}
      {showResolutionDropdown &&
        (isMobile ? (
          <div className="relative w-full">
            {renderMobileTrigger(
              "resolution",
              isCurrentLocationOutside && userResolution
                ? `${userResolution}°`
                : !isCurrentLocationOutside
                ? `0.25° (${t("fixed")})`
                : t("selectResolution") || "Select Resolution",
              !isCurrentLocationOutside
            )}
            {openDropdown === "resolution" && isCurrentLocationOutside && (
              <MobileMenu
                items={resolutionOptions.map((res) => ({ value: res, label: `${res}°` }))}
                selectedValue={userResolution}
                placeholder={t("selectResolution") || "Select Resolution"}
                onSelect={(res) => {
                  setUserResolution(res);
                  const template = t("resUpdated") || "Resolution updated to {res}°";
                  triggerNotification(template.replace("{res}", res));
                  setOpenDropdown(null);
                }}
              />
            )}
          </div>
        ) : (
          <div className={`min-w-[110px] flex-1 basis-[110px] ${!isCurrentLocationOutside ? "opacity-60" : ""}`}>
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

      {/* Depth */}
      {isMobile ? (
        <div className="relative w-full">
          {renderMobileTrigger(
            "depth",
            depth !== "" ? `${depth} m` : t("chooseDepth") || "Select Depth",
            isDepthDisabled
          )}
          {openDropdown === "depth" && (
            <MobileMenu
              items={depthOptions.map((val) => ({ value: String(val), label: `${val} m` }))}
              selectedValue={depth}
              placeholder={t("chooseDepth") || "Select Depth"}
              onSelect={handleDepthChange}
            />
          )}
        </div>
      ) : (
        <div className={`min-w-[130px] flex-1 basis-[130px] ${isDepthDisabled ? "opacity-40" : ""}`}>
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

      {/* Coordinates */}
      <div
        className={`flex w-full gap-1.5 sm:min-w-[240px] sm:flex-1 sm:basis-[240px] ${areCoordinatesDisabled ? "pointer-events-none opacity-40" : ""}`}
      >
        <CoordinateInput
          type="latitude"
          value={latitude}
          setValue={setLatitude}
          language={language}
        />
        <CoordinateInput
          type="longitude"
          value={longitude}
          setValue={setLongitude}
          language={language}
        />
      </div>

      {/* GO */}
      <button
        type="button"
        onClick={onGoClick}
        disabled={isGoDisabled}
        className="oe-focus-visible h-[42px] w-full rounded-lg bg-accent text-[13px] font-semibold text-white transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[60px] sm:flex-1"
        >
        {t("go")}
      </button>
    </div>
  );
}
