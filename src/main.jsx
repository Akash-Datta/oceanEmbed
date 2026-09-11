import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
<<<<<<< HEAD

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
=======
import { LanguageProvider } from "./context/LanguageContext"; 
import { ThemeProvider } from "./context/ThemeContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LanguageProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </LanguageProvider>
>>>>>>> origin/main
  </React.StrictMode>
);