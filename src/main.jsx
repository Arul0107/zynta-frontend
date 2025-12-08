// src/main.jsx OR src/index.jsx

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "antd/dist/reset.css";
import "./index.css";

import { PresenceProvider } from "./context/PresenceContext";
import { SocketProvider } from "./context/SocketContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SocketProvider>       {/* 🔥 SOCKET CONTEXT ADDED */}
      <PresenceProvider>   {/* 🔥 PRESENCE CONTEXT */}
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </PresenceProvider>
    </SocketProvider>
  </React.StrictMode>
);
