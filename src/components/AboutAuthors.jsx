import React from "react";
import { useLanguage } from "../context/LanguageContext";

export default function AboutAuthors({ onClose }) {
  const { t } = useLanguage();

  return (
    <div className="about-authors-backdrop" onClick={onClose}>
      <div className="about-authors-panel" onClick={(e) => e.stopPropagation()}>
        <div className="about-panel-header">
          <div className="header-title-wrapper">
            <span className="header-icon">🌊</span>
            <h3>{t("aboutTitle")}</h3>
          </div>
          <button className="close-btn" onClick={onClose} title="Close">×</button>
        </div>
        <div className="about-panel-body">
          <div className="team-section-glow">
            <span className="team-label">{t("presentedBy")}</span>
            <h4 className="team-name-badge">{t("teamName")}</h4>
            <p className="team-subtitle">{t("teamSubtitle")}</p>
          </div>
          
          <div className="contributors-divider">
            <span>{t("contributors")}</span>
          </div>

          <div className="contributors-grid">
            <div className="member-card">
              <div className="member-avatar">
                <img src="/Aadi.png" alt="Aaditya Sardar" className="member-img" />
              </div>
              <h5>{t("aadiName")}</h5>
              <p className="member-role">{t("teamLeader")}</p>
              <a href="https://github.com/Aaditya288" target="_blank" rel="noreferrer" className="github-link">
                <span>{t("githubProfile")}</span>
              </a>
            </div>

            <div className="member-card">
              <div className="member-avatar">
                <img src="/Teesta.jpeg" alt="Teesta Mukherjee" className="member-img" />
              </div>
              <h5>{t("teestaName")}</h5>
              <p className="member-role">{t("fullStackRole")}</p>
              <a href="https://github.com/Teesta-Mukherjee" target="_blank" rel="noreferrer" className="github-link">
                <span>{t("githubProfile")}</span>
              </a>
            </div>

            <div className="member-card">
              <div className="member-avatar">
                <img src="/akash.jpeg" alt="Akash Datta" className="member-img" />
              </div>
              <h5>{t("akashName")}</h5>
              <p className="member-role">{t("frontendRole")}</p>
              <a href="https://github.com/AkashDatta" target="_blank" rel="noreferrer" className="github-link">
                <span>{t("githubProfile")}</span>
              </a>
            </div>

            <div className="member-card">
              <div className="member-avatar">
                <img src="/ayush.jpeg" alt="Ayush Mondal" className="member-img" />
              </div>
              <h5>{t("ayushName")}</h5>
              <p className="member-role">{t("designRole")}</p>
              <a href="https://github.com/A-y-u-s-h-9" target="_blank" rel="noreferrer" className="github-link">
                <span>{t("githubProfile")}</span>
              </a>
            </div>

            <div className="member-card">
              <div className="member-avatar">
                <img src="/anuvab.jpeg" alt="Anuvab Kundu" className="member-img" />
              </div>
              <h5>{t("anuvabName")}</h5>
              <p className="member-role">{t("mlArchitectExec")}</p>
              <a href="https://github.com/anuvab12370" target="_blank" rel="noreferrer" className="github-link">
                <span>{t("githubProfile")}</span>
              </a>
            </div>

            <div className="member-card">
              <div className="member-avatar">
                <img src="/jishnu.jpeg" alt="Jishnu Pal" className="member-img" />
              </div>
              <h5>{t("jishnuName")}</h5>
              <p className="member-role">{t("mlArchitectDesign")}</p>
              <a href="https://github.com/patrikLM10" target="_blank" rel="noreferrer" className="github-link">
                <span>{t("githubProfile")}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}