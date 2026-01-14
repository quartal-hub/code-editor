import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// Dynamically load a skin CSS from a configurable URL
// const SKIN_URL = "https://cdn.quartal.com/skins/default.css";
const SKIN_URL = "https://cdn.quartal.com/css/quartal-www.css";

function loadSkin(url: string) {
  let link = document.getElementById("quartal-skin-link") as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.rel = "stylesheet";
    link.id = "quartal-skin-link";
    document.head.appendChild(link);
  }
  link.href = url;
}

loadSkin(SKIN_URL);

import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
