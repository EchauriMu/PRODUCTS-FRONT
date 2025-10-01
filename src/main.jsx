
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// Carga todos los Web Components necesarios
import "@ui5/webcomponents/dist/Assets.js";
import "@ui5/webcomponents-icons/dist/AllIcons.js";

import { ThemeProvider } from "@ui5/webcomponents-react";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
