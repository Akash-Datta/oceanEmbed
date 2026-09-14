import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./styles/tokens.css";
import "./styles/leaflet.css";
import App from "./App.jsx";
import { LanguageProvider } from "./context/LanguageContext"; 
import { ThemeProvider } from "./context/ThemeContext";
import { initViewportVars } from "./utils/viewport";

// Keep CSS --app-vh/--app-vw in sync with the real window size so the
// layout (100dvh heights, fluid panels) adapts to resizes dynamically.
initViewportVars();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LanguageProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </LanguageProvider>
  </React.StrictMode>
);