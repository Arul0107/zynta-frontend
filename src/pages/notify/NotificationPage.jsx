// src/pages/NotificationPage/NotificationPage.jsx
import React, { useState, useEffect, useContext } from "react";
import {
  Typography,
  List,
  Card,
  Popconfirm,
  Button,
  Space,
  Empty,
} from "antd";
import {
  DeleteOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import axios from "../../api/axios";
import { PresenceContext } from "../../context/PresenceContext";
import { useNavigate } from "react-router-dom";
import "./NotificationPage.css"; // Ensure this CSS file exists

const { Title, Text } = Typography;

const NotificationPage = () => {
  const [notifications, setNotifications] = useState([]);
  const { socket } = useContext(PresenceContext);
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const [loading, setLoading] = useState(true);

  const fetchUnread = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      // NOTE: Ensure your backend endpoint populates the 'fromUser' field 
      // and includes 'profileImage' in the selection.
      const res = await axios.get(`/api/notifications/${currentUser._id}`);
      const unreadOnly = res.data.notifications.filter((n) => !n.read);
      setNotifications(unreadOnly);
    } catch (error) {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (item) => {
    try {
      await axios.post("/api/notifications/read", {
        notificationIds: [item._id],
      });

      // Navigate to chat route
      navigate(`/chat`);

      setNotifications((prev) => prev.filter((n) => n._id !== item._id));
      toast.success("Notification marked as read");
    } catch (error) {
      toast.error("Error marking as read");
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`/api/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      toast.success("Notification deleted");
    } catch (error) {
      toast.error("Error deleting notification");
    }
  };

  const markAllAsRead = async () => {
    if (notifications.length === 0) {
      toast.info("No unread notifications to clear.");
      return;
    }

    try {
      const allIds = notifications.map((n) => n._id);
      await axios.post("/api/notifications/read", {
        notificationIds: allIds,
      });
      setNotifications([]);
      toast.success(`Cleared ${allIds.length} notifications!`);
    } catch (error) {
      toast.error("Error marking all as read");
    }
  };

  useEffect(() => {
    fetchUnread();
  }, []); // initial load

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = () => {
      fetchUnread();
    };

    socket.on("new_notification", handleNewNotification);

    return () => {
      socket.off("new_notification", handleNewNotification);
    };
  }, [socket]);

  return (
    <div className="notification-container">
      <div className="header-section">
        <div className="header-left">
          <Title level={3} className="notif-title">
            New Messages
          </Title>
          <Text type="secondary" className="notif-subtitle">
            {notifications.length} unread
          </Text>
        </div>

        <div className="header-actions">
          <Popconfirm
            title="Mark all messages as read?"
            onConfirm={markAllAsRead}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              disabled={notifications.length === 0}
             className="add-event-button"
            >
              Mark All Read
            </Button>
          </Popconfirm>
        </div>
      </div>

      {loading ? (
        <div className="custom-loader"></div>
      ) : (
        <List
          className="notif-list"
          dataSource={notifications}
          locale={{
            emptyText: (
              <div className="notif-empty">
                <Empty description="All clear! No new messages." />
              </div>
            ),
          }}
          renderItem={(item) => (
            <Card
              key={item._id}
              className="notif-card-advanced"
              onClick={() => handleNotificationClick(item)}
              bodyStyle={{ padding: "14px 18px" }}
              hoverable
            >
              <div className="notif-content">
                <div className="notif-avatar">
                  {item.fromUser?.profileImage ? (
                        // 🔥 Display Profile Image
                    <img 
                      src={item.fromUser.profileImage} 
                      alt={`${item.fromUser.name}'s avatar`}
                      className="notif-profile-image" 
                  	/>
                  ) : (
                        // Fallback to Initial Letter
                    <span>
                      {(item?.fromUser?.name || "U").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="notif-text">
                  <Text strong className="notif-sender">
                    {item.fromUser?.name || "Unknown Sender"}
                  </Text>
                  <Text className="notif-message">{item.message}</Text>
                  <Text className="notif-time">
                    {dayjs(item.createdAt).format("MMM D, YYYY • h:mm A")}
                  </Text>
                </div>

                {/* Delete Single */}
                <Popconfirm
                  title="Delete notification?"
                  onConfirm={(e) => {
                    if (e && e.stopPropagation) e.stopPropagation();
                    deleteNotification(item._id);
                  }}
                  okText="Yes"
                  cancelText="No"
                  placement="left"
                >
                  <DeleteOutlined
                    className="notif-delete-btn"
                    onClick={(e) => e.stopPropagation()}
                  />
                </Popconfirm>
              </div>
            </Card>
          )}
        />
      )}
    </div>
  );
};

export default NotificationPage;