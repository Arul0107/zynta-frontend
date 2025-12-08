import React from "react";
import { SearchOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import chat from "./chat.png"; 

dayjs.extend(relativeTime);

export default function UserList({
  users,
  activeUser,
  onUserSelect,
  searchTerm,
  setSearchTerm,
  unreadMap,
  presenceMap,
  selectedIds,
  onDeleteMultiple,
}) {
  return (
    <div className="users-panel">
      <div className="top-chat-icon">
        <img src={chat} className="chaticon" alt="icon" />
      </div>

      <div className="users-header">
        <h4>Users</h4>
        {selectedIds.length > 0 && (
          <button className="btn danger" onClick={onDeleteMultiple}>
            <DeleteOutlined /> Delete ({selectedIds.length})
          </button>
        )}
      </div>

      <div className="search-bar">
        <SearchOutlined className="search-icon" />
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="users-list-scroll">
        {users.map((u) => {
          const live = presenceMap[u._id];
          const online = live?.presence === "online";
          const unread = unreadMap[u._id] || 0;
          const lastSeen = live?.lastActiveAt || u.lastSeen || u.lastActiveAt;

          // --- PROFILE IMAGE / AVATAR LOGIC START ---
          const AvatarContent = u.profileImage ? (
            <img 
              src={u.profileImage} 
              alt={`${u.name}'s avatar`} 
              className="profile-image-thumb" // You must define this class in chat.css
            />
          ) : (
            // Fallback to initial letter
            u.name?.charAt(0)
          );
          // --- PROFILE IMAGE / AVATAR LOGIC END ---

          return (
            <div
              key={u._id}
              className={`user-item ${activeUser?._id === u._id ? "active" : ""}`}
              onClick={() => onUserSelect(u)}
            >
              <div className="left-col">
                {/* Updated Avatar Block */}
                <div className="avatar">
                  {AvatarContent}
                </div>

                <div className="u-info">
                  <div className="u-name" style={{ fontWeight: unread ? 700 : 600 }}>
                    {u.name}
                  </div>

                  <div className="u-sub">
                    <span className={`dot ${online ? "online" : "offline"}`} />
                    {online
                      ? "Online"
                      : lastSeen
                      ? `Last: ${dayjs(lastSeen).fromNow()}`
                      : "Offline"}
                  </div>
                </div>
              </div>

              {unread > 0 && (
                <div className="unread-badge">{unread > 99 ? "99+" : unread}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}