// MobileContextMenu.jsx
import React, { useEffect } from "react";
import "./mobileContextMenu.css";

export default function MobileContextMenu({ visible, onClose, onDeleteMe, onDeleteEveryone, onCopy, onReply }) {
  if (!visible) return null;

  return (
    <div className="mctx-overlay" onClick={onClose}>
      <div className="mctx-sheet" onClick={(e) => e.stopPropagation()}>
        
        <div className="mctx-item" onClick={onReply}>Reply</div>
        <div className="mctx-item" onClick={onCopy}>Copy</div>
        <div className="mctx-item">Forward</div>

        <div className="mctx-divider"></div>

        <div className="mctx-item danger" onClick={onDeleteMe}>Delete for me</div>
        <div className="mctx-item danger" onClick={onDeleteEveryone}>Delete for everyone</div>
      </div>
    </div>
  );
}