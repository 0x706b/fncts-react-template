import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { App } from "./App";

const root = document.getElementById("app");

if (!root) {
  throw new Error("Cannot find 'app' element.");
}

ReactDOM.hydrateRoot(
  root,
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
