import React from 'react';

export default function MapViewButtons({ activeLayer, setActiveLayer, onBack }) {
  return (
    <div className="map-layer-controls">
      <div className="layer-buttons">
        <button 
          className={`layer-btn ${activeLayer === 'argo' ? 'active' : ''}`}
          onClick={() => setActiveLayer('argo')}
        >
<<<<<<< HEAD
          ARGO Actual
        </button>
        <button 
          className={`layer-btn ${activeLayer === 'convformer' ? 'active' : ''}`}
          onClick={() => setActiveLayer('convformer')}
        >
          ConvFormer
        </button>
=======
          <span className="layer-icon">🌊</span>
          <span>ARGO Actual</span>
        </button>
        
        <button 
          className={`layer-btn ${activeLayer === 'transformer' ? 'active' : ''}`}
          onClick={() => setActiveLayer('transformer')}
        >
          <span className="layer-icon">🤖</span>
          <span>Transformer</span>
        </button>
        
>>>>>>> origin/main
        <button 
          className={`layer-btn ${activeLayer === 'error' ? 'active' : ''}`}
          onClick={() => setActiveLayer('error')}
        >
<<<<<<< HEAD
          Absolute Error
=======
          <span className="layer-icon">⚡</span>
          <span>Absolute Error</span>
>>>>>>> origin/main
        </button>
      </div>
      
      <button className="back-to-map-btn" onClick={onBack}>
<<<<<<< HEAD
        ← Back to Ocean Map
=======
        <span className="back-arrow">←</span>
        <span>Back to Ocean Map</span>
>>>>>>> origin/main
      </button>
    </div>
  );
}