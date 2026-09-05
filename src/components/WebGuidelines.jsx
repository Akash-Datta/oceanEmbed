import React from "react";
import { useLanguage } from "../context/LanguageContext";

export default function WebGuidelines({ onClose }) {
  const { t } = useLanguage();

  return (
    <div className="about-authors-backdrop" onClick={onClose}>
      <div className="about-authors-panel" onClick={(e) => e.stopPropagation()}>
        <div className="about-panel-header">
          <div className="header-title-wrapper">
            <span className="header-icon">🧭</span>
            <h3>{t("guidelinesTitle")}</h3>
          </div>
          <button className="close-btn" onClick={onClose} title="Close">×</button>
        </div>
        <div className="about-panel-body">
          <div className="team-section-glow">
            <span className="team-label">{t("platformOverview")}</span>
            <h4 className="team-name-badge">{t("navigationGuide")}</h4>
            <p className="team-subtitle">{t("guidelinesSubtitle")}</p>
          </div>

          <div className="contributors-divider">
            <span>{t("stepInstructions")}</span>
          </div>

          <div className="guidelines-list">
            <div className="guideline-card">
              <div className="guideline-step-icon">📅</div>
              <div className="guideline-content">
                <h5>{t("step1Title")}</h5>
                <p>{t("step1Desc")}</p>
              </div>
            </div>

            <div className="guideline-card">
              <div className="guideline-step-icon">📍</div>
              <div className="guideline-content">
                <h5>{t("step2Title")}</h5>
                <p>{t("step2Desc")}</p>
              </div>
            </div>

            <div className="guideline-card">
              <div className="guideline-step-icon">📊</div>
              <div className="guideline-content">
                <h5>{t("step3Title")}</h5>
                <p>{t("step3Desc")}</p>
              </div>
            </div>

            <div className="guideline-card">
              <div className="guideline-step-icon">🗺️</div>
              <div className="guideline-content">
                <h5>{t("step4Title")}</h5>
                <p>{t("step4Desc")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}