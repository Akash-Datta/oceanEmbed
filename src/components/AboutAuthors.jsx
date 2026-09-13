import React, { useState } from "react";
import { useLanguage } from "../context/LanguageContext";

export default function AboutAuthors({ onClose }) {
  const { t } = useLanguage();
  const [zoomedMember, setZoomedMember] = useState(null); 
  const [mobileZoomed, setMobileZoomed] = useState(null); 

  const handleAvatarClick = (img, nameKey) => {
    if (window.innerWidth > 700) {
      setZoomedMember(nameKey);
    } else {
      setMobileZoomed({ img, nameKey });
    }
  };

  const renderLocalZoomOverlay = (img, nameKey) => {
    if (zoomedMember !== nameKey) return null;
    return (
      <div 
        onClick={(e) => { e.stopPropagation(); setZoomedMember(null); }}
        style={{
          position: "absolute",
          top: "-8px",
          left: "-8px",
          right: "-8px",
          bottom: "-8px",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          borderRadius: "16px",
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
          animation: "fadeIn 0.2s ease-out",
          cursor: "pointer",
        }}
      >
        <img 
          src={img} 
          alt={t(nameKey)}
          style={{
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            objectFit: "cover",
            border: "3px solid #0ea5e9",
            boxShadow: "0 6px 16px rgba(14, 165, 233, 0.25)",
            marginBottom: "12px",
          }}
        />
        <h5 style={{ margin: "0 0 4px 0", color: "#0f172a", fontSize: "14px", fontWeight: "800", textAlign: "center" }}>
          {t(nameKey)}
        </h5>
        <span style={{ fontSize: "10px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>
          ✕ {t("close")}
        </span>
      </div>
    );
  };

  const renderMobileZoomModal = () => {
    if (!mobileZoomed) return null;
    return (
      <div className="photo-zoom-backdrop" onClick={() => setMobileZoomed(null)}>
        <div className="photo-zoom-content" onClick={(e) => e.stopPropagation()}>
          <button className="zoom-back-btn" onClick={() => setMobileZoomed(null)}>
            ← {t("close")}
          </button>
          <div className="zoomed-image-wrapper">
            <img 
              src={mobileZoomed.img} 
              alt={t(mobileZoomed.nameKey)} 
              className="zoomed-target-img" 
            />
          </div>
          <div className="zoomed-person-name">
            {t(mobileZoomed.nameKey)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="about-authors-backdrop" onClick={onClose}>
        <div className="about-authors-panel" onClick={(e) => e.stopPropagation()}>
          <div className="about-panel-header">
            <div className="header-title-wrapper">
              <span className="header-icon">🌊</span>
              <h3>{t("aboutTitle")}</h3>
            </div>
            <button className="close-btn" onClick={onClose} title={t("close")}>×</button>
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
              <div className="member-card" style={{ position: "relative", zIndex: zoomedMember === "aadiName" ? 20 : 1 }}>
                {renderLocalZoomOverlay("/Aadi.png", "aadiName")}
                <div 
                  className="member-avatar clickable-avatar" 
                  onClick={() => handleAvatarClick("/Aadi.png", "aadiName")}
                >
                  <img src="/Aadi.png" alt="Aaditya Sardar" className="member-img" />
                </div>
                <h5>{t("aadiName")}</h5>
                <p className="member-role">{t("teamLeader")}</p>
                <a href="https://github.com/Aaditya288" target="_blank" rel="noreferrer" className="github-link">
                  <span>{t("githubProfile")}</span>
                </a>
              </div>

              <div className="member-card" style={{ position: "relative", zIndex: zoomedMember === "teestaName" ? 20 : 1 }}>
                {renderLocalZoomOverlay("/Teesta.jpeg", "teestaName")}
                <div 
                  className="member-avatar clickable-avatar" 
                  onClick={() => handleAvatarClick("/Teesta.jpeg", "teestaName")}
                >
                  <img src="/Teesta.jpeg" alt="Teesta Mukherjee" className="member-img" />
                </div>
                <h5>{t("teestaName")}</h5>
                <p className="member-role">{t("fullStackRole")}</p>
                <a href="https://github.com/Teesta-Mukherjee" target="_blank" rel="noreferrer" className="github-link">
                  <span>{t("githubProfile")}</span>
                </a>
              </div>

              <div className="member-card" style={{ position: "relative", zIndex: zoomedMember === "akashName" ? 20 : 1 }}>
                {renderLocalZoomOverlay("/akash.jpeg", "akashName")}
                <div 
                  className="member-avatar clickable-avatar" 
                  onClick={() => handleAvatarClick("/akash.jpeg", "akashName")}
                >
                  <img src="/akash.jpeg" alt="Akash Datta" className="member-img" />
                </div>
                <h5>{t("akashName")}</h5>
                <p className="member-role">{t("frontendRole")}</p>
                <a href="https://github.com/AkashDatta" target="_blank" rel="noreferrer" className="github-link">
                  <span>{t("githubProfile")}</span>
                </a>
              </div>

              <div className="member-card" style={{ position: "relative", zIndex: zoomedMember === "ayushName" ? 20 : 1 }}>
                {renderLocalZoomOverlay("/ayush.jpeg", "ayushName")}
                <div 
                  className="member-avatar clickable-avatar" 
                  onClick={() => handleAvatarClick("/ayush.jpeg", "ayushName")}
                >
                  <img src="/ayush.jpeg" alt="Ayush Mondal" className="member-img" />
                </div>
                <h5>{t("ayushName")}</h5>
                <p className="member-role">{t("designRole")}</p>
                <a href="https://github.com/A-y-u-s-h-9" target="_blank" rel="noreferrer" className="github-link">
                  <span>{t("githubProfile")}</span>
                </a>
              </div>

              <div className="member-card" style={{ position: "relative", zIndex: zoomedMember === "anuvabName" ? 20 : 1 }}>
                {renderLocalZoomOverlay("/anuvab.jpeg", "anuvabName")}
                <div 
                  className="member-avatar clickable-avatar" 
                  onClick={() => handleAvatarClick("/anuvab.jpeg", "anuvabName")}
                >
                  <img src="/anuvab.jpeg" alt="Anuvab Kundu" className="member-img" />
                </div>
                <h5>{t("anuvabName")}</h5>
                <p className="member-role">{t("mlArchitectExec")}</p>
                <a href="https://github.com/anuvab12370" target="_blank" rel="noreferrer" className="github-link">
                  <span>{t("githubProfile")}</span>
                </a>
              </div>

              <div className="member-card" style={{ position: "relative", zIndex: zoomedMember === "jishnuName" ? 20 : 1 }}>
                {renderLocalZoomOverlay("/jishnu.jpeg", "jishnuName")}
                <div 
                  className="member-avatar clickable-avatar" 
                  onClick={() => handleAvatarClick("/jishnu.jpeg", "jishnuName")}
                >
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

      {renderMobileZoomModal()}
    </>
  );
}