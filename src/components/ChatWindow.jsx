import React, { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";
import { Input } from "antd";

export default function ChatWindow({
  selectedUser,
  messages,
  onSend,
  typingUser,
}) {
  const [msg, setMsg] = useState("");
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {/* TOP BAR */}
      <div style={{ padding: 16, borderBottom: "1px solid #ddd" }}>
        <strong>{selectedUser?.name}</strong>
      </div>

      {/* MESSAGE LIST */}
      <div style={{ flex: 1, overflowY: "auto", padding: 10 }}>
        {messages.map((m, i) => (
          <MessageBubble
            key={i}
            mine={m.mine}
            text={m.text}
            time={new Date(m.sentAt).toLocaleTimeString()}
          />
        ))}

        {typingUser && (
          <div style={{ padding: 10, color: "#888" }}>{typingUser} typing...</div>
        )}

        <div ref={bottomRef}></div>
      </div>

      {/* INPUT */}
      <div style={{ padding: 16, borderTop: "1px solid #ddd" }}>
        <Input
          value={msg}
          onChange={(e) => {
            setMsg(e.target.value);
            onSend("typing");
          }}
          onPressEnter={() => {
            onSend("send", msg);
            setMsg("");
          }}
          placeholder="Type message..."
        />
      </div>
    </div>
  );
}
