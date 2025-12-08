import React, { useEffect, useState } from "react";
import {
  Card,
  Statistic,
  Row,
  Col,
  Tag,
  message,
  Drawer,
  Typography,
  Divider,
  DatePicker,
  Space
} from "antd";
import {
  CheckCircleOutlined,
  LoadingOutlined,
  PauseCircleOutlined,
  ClockCircleOutlined,
  StopOutlined,
  UserOutlined,
  PaperClipOutlined,
  GlobalOutlined,
  AppstoreOutlined,
  HighlightOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../api/axios";

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

const statusIcons = {
  Completed: <CheckCircleOutlined />,
  "In Progress": <LoadingOutlined />,
  Planned: <ClockCircleOutlined />,
  "On Hold": <PauseCircleOutlined />,
  Cancelled: <StopOutlined />,
};

const colors = {
  Completed: "#39b54a",
  "In Progress": "#1677ff",
  Planned: "#fa8c16",
  "On Hold": "#fa541c",
  Cancelled: "#ff4d4f",
};

// SERVICE ICONS MAP
const serviceIcon = (serviceName) => {
  switch (serviceName?.toLowerCase()) {
    case "website":
      return <GlobalOutlined style={{ color: "#1677ff" }} />;
    case "software":
      return <AppstoreOutlined style={{ color: "#722ed1" }} />;
    case "ui-ux":
      return <HighlightOutlined style={{ color: "#faad14" }} />;
    default:
      return <GlobalOutlined style={{ color: "#8c8c8c" }} />;
  }
};

export default function ProjectTracking() {
  const [projects, setProjects] = useState([]);
  const [grouped, setGrouped] = useState({});
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [dateFilter, setDateFilter] = useState(null);

  const loadProjects = async (filters = {}) => {
    try {
      const res = await api.get("/api/projects", { params: filters });
      const list = res.data?.projects || [];
      setProjects(list);

      const groupedData = list.reduce((acc, p) => {
        acc[p.status] = acc[p.status] || [];
        acc[p.status].push(p);
        return acc;
      }, {});

      setGrouped(groupedData);
    } catch (err) {
      message.error("Failed to load projects");
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const filterByDate = (dates) => {
    setDateFilter(dates);

    if (!dates) return loadProjects();

    const [start, end] = dates;
    loadProjects({
      startDate: start.toISOString(),
      endDate: end.toISOString()
    });
  };

  const totalProjects = projects.length;

  return (
    <div style={{ padding: 24, background: "#ffffffff", minHeight: "100vh" }}>
      <Row justify="space-between" align="middle">
        <Title level={3}> Project Tracking Dashboard</Title>

        {/* DATE FILTER */}
        <Space>
          <RangePicker
            value={dateFilter}
            onChange={(v) => filterByDate(v)}
            allowClear
          />
        </Space>
      </Row>

      {/* Total Projects */}
      <Card
        style={{
          borderRadius: 12,
          marginBottom: 20,
          boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
        }}
      >
        <Statistic title="Total Projects" value={totalProjects} />
      </Card>

      {/* Status Lists */}
      <Row gutter={[18, 18]}>
        {Object.keys(grouped).map((status) => (
          <Col xs={24} sm={12} md={8} key={status}>
            <Card
              style={{
                borderRadius: 14,
                minHeight: 250,
                background: "#fff",
                boxShadow: "0 4px 14px rgba(0,0,0,0.07)",
                transition: "0.3s",
              }}
              bodyStyle={{ padding: "14px 18px" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Tag
                  color={colors[status]}
                  style={{ fontSize: 13, padding: "5px 10px", borderRadius: 8 }}
                >
                  {status} {statusIcons[status]}
                </Tag>

                <Statistic
                  value={grouped[status].length}
                  valueStyle={{ fontSize: 24 }}
                />
              </div>

              <Divider style={{ margin: "10px 0" }} />

              {/* Project list with icons */}
              <div style={{ maxHeight: 160, overflowY: "auto" }}>
                {grouped[status].map((p) => (
                  <div
                    key={p._id}
                    onClick={() => {
                      setSelectedProject(p);
                      setDetailDrawerOpen(true);
                    }}
                    style={{
                      cursor: "pointer",
                      padding: "6px",
                      borderRadius: 6,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      transition: "0.25s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#eef5ff")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {serviceIcon(p.serviceId?.serviceName)}
                      <span style={{ fontWeight: 500, color: "#1677ff" }}>
                        {p.name.length > 20 ? p.name.slice(0, 20) + "…" : p.name}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: 10, fontSize: 12 }}>
                      {p.members?.length > 0 && (
                        <span
                          title="Assigned Members"
                          style={{ display: "flex", alignItems: "center", gap: 4 }}
                        >
                          <UserOutlined /> {p.members.length}
                        </span>
                      )}

                      {p.attachments?.length > 0 && (
                        <span
                          title="Attachments"
                          style={{ display: "flex", alignItems: "center", gap: 4 }}
                        >
                          <PaperClipOutlined /> {p.attachments.length}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Drawer Details */}
      <Drawer
        width={450}
        title="Project Overview"
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        style={{ borderRadius: "12px 0 0 12px" }}
      >
        {selectedProject && (
          <>
            <Title level={4} style={{ marginBottom: 10 }}>
              {selectedProject.name}
            </Title>
            <Tag color={colors[selectedProject.status]}>
              {selectedProject.status}
            </Tag>

            <Divider />

            <p><b>Account:</b> {selectedProject.accountId?.businessName || "N/A"}</p>
            <p><b>Service:</b> {selectedProject.serviceId?.serviceName || "N/A"}</p>
            <p><b>Start:</b> {selectedProject.startDate?.slice(0, 10)}</p>
            <p><b>End:</b> {selectedProject.endDate?.slice(0, 10)}</p>

            <Divider />

            <b>Members:</b><br />
            {selectedProject.members?.length ? (
              selectedProject.members.map((m) => (
                <Tag key={m._id}>{m.name}</Tag>
              ))
            ) : (
              <Text type="secondary">No members</Text>
            )}

            <Divider />

            <b>Attachments:</b>
            {selectedProject.attachments?.length ? (
              selectedProject.attachments.map((a) => (
                <a
                  key={a._id}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "block", marginTop: 5 }}
                >
                  📎 {a.filename}
                </a>
              ))
            ) : (
              <p style={{ color: "#999" }}>No files</p>
            )}
          </>
        )}
      </Drawer>
    </div>
  );
}
