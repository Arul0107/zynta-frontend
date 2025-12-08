import React from "react";

export default function MessageBubble({ mine, text, time }) {
  return (
    <div style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", padding: "4px 10px" }}>
      <div style={{ background: mine ? "#1677ff" : "#f5f5f5", color: mine ? "white" : "#000", padding: 10, borderRadius: 10, maxWidth: "75%" }}>
        <div>{text}</div>
        <div style={{ fontSize: 10, textAlign: "right", marginTop: 4, opacity: 0.7 }}>{time}</div>
      </div>
    </div>
  );
}
