import React, { useEffect, useState } from "react";
import DesktopChat from "./DesktopChat";
import MobileChat from "./MobileChat";

function useIsMobile(breakpoint = 900) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= breakpoint);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return isMobile;
}

export default function ChatWrapper({ onMobileState }) {
  const isMobile = useIsMobile();

  // 👇 Notify parent (App.jsx / MainLayout)
  useEffect(() => {
    if (onMobileState) onMobileState(isMobile);
  }, [isMobile]);

  return isMobile ? <MobileChat /> : <DesktopChat />;
}
