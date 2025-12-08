import React, { useEffect } from "react";
import "./mobile.css"; // shares context menu style

export default function ContextMenu({ x, y, msg, onClose, onDeleteMe, onDeleteEveryone }) {
  useEffect(() => {
    const onWin = () => onClose();
    window.addEventListener("click", onWin);
    return () => window.removeEventListener("click", onWin);
  }, [onClose]);

  const style = { position: "fixed", top: y + 6, left: x + 6, zIndex: 99999 };

  return (
    <div className="ctx-menu" style={style} onMouseLeave={onClose}>
      <div className="ctx-item" onClick={() => { /* reply handler can be implemented */ onClose(); }}>Reply</div>
      <div className="ctx-item" onClick={() => { navigator.clipboard?.writeText?.(msg.text || ""); onClose(); }}>Copy</div>
      <div className="ctx-item" onClick={() => { /* forward stub */ onClose(); }}>Forward</div>
      <hr />
      <div className="ctx-item" onClick={() => { onDeleteMe?.(); }}>Delete for me</div>
      <div className="ctx-item danger" onClick={() => { onDeleteEveryone?.(); }}>Delete for everyone</div>
    </div>
  );
}