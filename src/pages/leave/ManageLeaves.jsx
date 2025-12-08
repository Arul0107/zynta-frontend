import React, { useEffect, useState, useContext } from "react";
import {
  Card,
  List,
  Button,
  Typography,
  Tag,
  message,
  Tabs,
  Skeleton,
  Drawer,
  Input,
  Space,
} from "antd";
import dayjs from "dayjs";
import api from "../../api/axios";
import { PresenceContext } from "../../context/PresenceContext";

const { Text, Title } = Typography;

export default function ManageLeaves() {
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const { socket } = useContext(PresenceContext);
  const userRole = currentUser?.role;

  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedLeave, setSelectedLeave] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const pendingRes = await api.get("/api/leaves/pending", {
        params: { role: userRole, teamId: currentUser.team },
      });
      setPending(pendingRes.data || []);

      const histRes = await api.get("/api/leaves/all");
      setHistory(histRes.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      message.error("Failed to load leave data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 🟢 Real-time Auto Refresh
  useEffect(() => {
    if (!socket) return;

    const refresh = () => loadData();

    socket.on("leave_request_received", refresh);
    socket.on("leave_status_update", refresh);

    return () => {
      socket.off("leave_request_received", refresh);
      socket.off("leave_status_update", refresh);
    };
  }, [socket]);

  const isMyTurn = (leave) =>
    (userRole === "Team Leader" && leave.currentLevel === "Team Leader") ||
    (userRole === "Admin" && leave.currentLevel === "Admin") ||
    (userRole === "Superadmin" && leave.currentLevel === "Superadmin");

  const approve = async (leave) => {
    await api.patch(`/api/leaves/${leave._id}/status`, {
      status: "Approved",
      role: userRole,
    });

    socket?.emit("leave_status_update", { leaveId: leave._id });

    message.success("Leave Approved");
    loadData();
  };

  const rejectConfirm = async () => {
    if (!rejectReason.trim()) return message.error("Enter rejection reason");

    await api.patch(`/api/leaves/${selectedLeave._id}/status`, {
      status: "Rejected",
      role: userRole,
      rejectReason,
    });

    socket?.emit("leave_status_update", {
      leaveId: selectedLeave._id,
      status: "Rejected",
    });

    setDrawerOpen(false);
    setRejectReason("");
    setSelectedLeave(null);
    message.error("Leave Rejected");
    loadData();
  };

  const renderApprovalTag = (label, value) => (
    <Tag
      color={
        value === "Approved"
          ? "green"
          : value === "Rejected"
          ? "red"
          : "orange"
      }
      style={{ marginRight: 4 }}
    >
      {label}: {value || "Pending"}
    </Tag>
  );

  const renderLeave = (l) => {
    return (
      <List.Item
        actions={[
          l.status !== "Pending" ? (
            <Tag color="default">Completed</Tag>
          ) : isMyTurn(l) ? (
            <>
              <Button type="primary" onClick={() => approve(l)}>
                Approve
              </Button>
              <Button
                danger
                onClick={() => {
                  setSelectedLeave(l);
                  setDrawerOpen(true);
                }}
              >
                Reject
              </Button>
            </>
          ) : (
            <Tag color="cyan">Waiting for {l.currentLevel}</Tag>
          ),
        ]}
      >
        <div style={{ flex: 1 }}>
          <Text strong>{l.userId?.name}</Text>{" "}
          <Tag color="blue">{l.type}</Tag>
          <br />
          <Text type="secondary">
            {dayjs(l.fromDate).format("DD MMM")} →{" "}
            {dayjs(l.toDate).format("DD MMM YYYY")}
          </Text>

          <div style={{ marginTop: 6 }}>
            {renderApprovalTag("TL", l.approval?.["Team Leader"])}
            {renderApprovalTag("Admin", l.approval?.["Admin"])}
            {renderApprovalTag("SA", l.approval?.["Superadmin"])}
          </div>

          {l.rejectReason && (
            <Text type="danger">
              Reason: {l.rejectReason}
            </Text>
          )}
        </div>

        <Tag
          color={
            l.status === "Approved"
              ? "green"
              : l.status === "Rejected"
              ? "red"
              : "orange"
          }
        >
          {l.status}
        </Tag>
      </List.Item>
    );
  };

  return (
    <>
      <Card>
        <Title level={4}>Leave Approvals</Title>
        <Tabs
          items={[
            {
              key: "1",
              label: "⏳ Pending",
              children: loading ? (
                <Skeleton active />
              ) : (
                <List dataSource={pending} renderItem={renderLeave} />
              ),
            },
            {
              key: "2",
              label: "📜 History",
              children: loading ? (
                <Skeleton active />
              ) : (
                <List dataSource={history} renderItem={renderLeave} />
              ),
            },
          ]}
        />
      </Card>

      {/* Reject Drawer */}
      <Drawer
        title="Reject Leave"
        width={360}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        footer={
          <Space style={{ float: "right" }}>
            <Button
              onClick={() => {
                setDrawerOpen(false);
                setRejectReason("");
              }}
            >
              Cancel
            </Button>
            <Button danger type="primary" onClick={rejectConfirm}>
              Reject
            </Button>
          </Space>
        }
      >
        <Input.TextArea
          rows={5}
          placeholder="Reason required"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Drawer>
    </>
  );
}
