import React from "react";

export default function AboutAuthors({ onClose }) {
  return (
    <div className="about-authors-backdrop" onClick={onClose}>
      <div className="about-authors-panel" onClick={(e) => e.stopPropagation()}>
        <div className="about-panel-header">
          <div className="header-title-wrapper">
            <span className="header-icon">🌊</span>
            <h3>About the Authors & Team</h3>
          </div>
          <button className="close-btn" onClick={onClose} title="Close">×</button>
        </div>
        <div className="about-panel-body">
          <div className="team-section-glow">
            <span className="team-label">Proudly Presented By</span>
            <h4 className="team-name-badge">Team Convoyagers</h4>
            <p className="team-subtitle">Spatiotemporal Ocean Intelligence & Marine Profiling System</p>
          </div>
          
          <div className="contributors-divider">
            <span>Contributors & Core Members</span>
          </div>

          <div className="contributors-grid">
            <div className="member-card">
              <div className="member-avatar">
                <img src="/Aadi.png" alt="Aaditya Sardar" className="member-img" />
              </div>
              <h5>Aaditya Sardar</h5>
              <p className="member-role">Team Leader</p>
              <a href="https://github.com/Aaditya288" target="_blank" rel="noreferrer" className="github-link">
                <span>GitHub Profile</span>
              </a>
            </div>

            <div className="member-card">
              <div className="member-avatar">
                <img src="/Teesta.jpeg" alt="Teesta Mukherjee" className="member-img" />
              </div>
              <h5>Teesta Mukherjee</h5>
              <p className="member-role">Full-Stack & ML Integration</p>
              <a href="https://github.com/Teesta-Mukherjee" target="_blank" rel="noreferrer" className="github-link">
                <span>GitHub Profile</span>
              </a>
            </div>

            <div className="member-card">
              <div className="member-avatar">
                <img src="/akash.jpeg" alt="Akash Datta" className="member-img" />
              </div>
              <h5>Akash Datta</h5>
              <p className="member-role">Frontend Developer & MERN Stack</p>
              <a href="https://github.com/AkashDatta" target="_blank" rel="noreferrer" className="github-link">
                <span>GitHub Profile</span>
              </a>
            </div>

            <div className="member-card">
              <div className="member-avatar">
                <img src="/ayush.jpeg" alt="Ayush Mondal" className="member-img" />
              </div>
              <h5>Ayush Mondal</h5>
              <p className="member-role">Designing, Planning & Execution</p>
              <a href="https://github.com/A-y-u-s-h-9" target="_blank" rel="noreferrer" className="github-link">
                <span>GitHub Profile</span>
              </a>
            </div>

            <div className="member-card">
              <div className="member-avatar">
                <img src="/anuvab.jpeg" alt="Anuvab Kundu" className="member-img" />
              </div>
              <h5>Anuvab Kundu</h5>
              <p className="member-role">ML Architect Executioner</p>
              <a href="https://github.com/anuvab12370" target="_blank" rel="noreferrer" className="github-link">
                <span>GitHub Profile</span>
              </a>
            </div>

            <div className="member-card">
              <div className="member-avatar">
                <img src="/jishnu.jpeg" alt="Jishnu Pal" className="member-img" />
              </div>
              <h5>Jishnu Pal</h5>
              <p className="member-role">ML Architect Designer</p>
              <a href="https://github.com/patrikLM10" target="_blank" rel="noreferrer" className="github-link">
                <span>GitHub Profile</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}