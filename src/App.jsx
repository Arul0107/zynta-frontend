// src/App.jsx
import React, { Suspense, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { appRoutes, loginRoutes } from './routes/routes';
import MainLayout from './components/layout/MainLayout';
import { Spin } from 'antd';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from 'react-error-boundary';

import { requestNotificationPermission, handleForegroundNotification } from "./firebase";
import CustomSpinner from './components/CustomSpinner';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", flexDirection: "column" }}>
      <h2>Something went wrong</h2>
      <pre style={{ color: "red" }}>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try Again</button>
    </div>
  );
}

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoginPage = location.pathname === "/login" || location.pathname === "/";

  const user = JSON.parse(localStorage.getItem("user"));

  /** 🔥 Firebase Push Notification Setup */
  useEffect(() => {
    requestNotificationPermission();
    handleForegroundNotification(navigate);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/firebase-messaging-sw.js");
    }
  }, [navigate]);

  /** 🔊 Unlock Audio Playback (CRITICAL FIX FOR NOTIFICATION SOUND) */
  useEffect(() => {
    const unlockAudio = () => {
      const audio = new Audio("/sounds/notify.mp3");
      audio.volume = 0;
      audio.play().then(() => {
        audio.pause();
        audio.volume = 0.9;
      }).catch(() => {});

      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };

    window.addEventListener("click", unlockAudio);
    window.addEventListener("touchstart", unlockAudio);
  }, []);

  return (
    <>
      <Toaster position="top-center" />
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Suspense fallback={
          <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <CustomSpinner/>
          </div>
        }>
          {isLoginPage ? (
            <Routes>
              {loginRoutes.map(r => (
                <Route key={r.path} path={r.path} element={r.element} />
              ))}
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          ) : (
            <MainLayout>
              <Routes>
                {appRoutes.map(r => (
                  <Route key={r.path} path={r.path} element={r.element} />
                ))}
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </Routes>
            </MainLayout>
          )}
        </Suspense>
      </ErrorBoundary>
    </>
  );
};

export default App;
