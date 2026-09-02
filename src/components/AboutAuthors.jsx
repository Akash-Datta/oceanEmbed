import React from "react";

export default function AboutAuthors({ onClose }) {
  return (
    <div className="about-modal-backdrop" onClick={onClose}>
      <div className="about-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="about-modal-header">
          <h3>About the Authors & Team</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="about-modal-body">
          <div className="team-section">
            <h4>Team Name</h4>
            <p className="team-name-placeholder">Team OceanIntel / Research Group</p>
          </div>
          <hr />
          <h4>Contributors & Members</h4>
          <div className="contributors-grid">
            <div className="member-card">
              <div className="member-avatar">👤</div>
              <h5>Member Name</h5>
              <p className="member-role">Full-Stack & ML Integration</p>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="github-link">
                GitHub Profile
              </a>
            </div>
            <div className="member-card">
              <div className="member-avatar">👤</div>
              <h5>Member Name</h5>
              <p className="member-role">UI/UX & Spatial Mapping</p>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="github-link">
                GitHub Profile
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}