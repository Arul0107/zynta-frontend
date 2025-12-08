import React from "react";
import { SearchOutlined } from "@ant-design/icons";

export default function MobileUserList({
  users,
  onUserSelect,
  searchTerm,
  setSearchTerm,
  unreadMap,
  presenceMap,
}) {
  return (
    <div className="mobile-list">
      <div className="search-bar mobile-search-bar">
        <SearchOutlined className="search-icon" />
        <input
          type="text"
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {users.map((u) => {
        const unread = unreadMap[u._id] || 0;
        const online = presenceMap[u._id]?.presence === "online";

        return (
          <div
            key={u._id}
            className="mobile-user-item"
            onClick={() => onUserSelect(u)}
          >
            <div className="left-col">

              {/* Profile Image Support Added */}
              <div className="avatar">
                {u.profileImage ? (
                  <img
                    src={u.profileImage}
                    alt={u.name}
                    className="avatar-img"
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  u.name.charAt(0).toUpperCase()
                )}
              </div>

              <div className="u-info">
                <div className="u-name">{u.name}</div>
                <div className="u-sub">
                  {online ? "🟢 Online" : "⚫ Offline"}
                </div>
              </div>
            </div>

            {unread > 0 && <div className="unread-badge">{unread}</div>}
          </div>
        );
      })}
    </div>
  );
}
