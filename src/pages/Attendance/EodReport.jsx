import React, { useEffect, useState } from "react";
import {
  Table,
  Typography,
  Tag,
  Space,
  Button,
  Card,
  Row,
  Col,
  Select,
  Spin,
} from "antd";
import axios from "../../api/axios";
import dayjs from "dayjs";
import toast, { Toaster } from "react-hot-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const { Title, Text } = Typography;
const { Option } = Select;

export default function EodReport() {
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState("today"); // today | week | month
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    working: 0,
  });
  const [chartData, setChartData] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 🔹 Fetch all users
      const usersRes = await axios.get("/api/users");
      const allUsers = Array.isArray(usersRes.data) ? usersRes.data : [];
      setUsers(allUsers);

      // 🔹 Fetch today's sessions
      const sessionsRes = await axios.get(`/api/work-sessions/today`);
      const todaySessions = Array.isArray(sessionsRes.data.sessions)
        ? sessionsRes.data.sessions
        : [];

      // 🔹 Merge sessions into users
      const merged = allUsers.map((user) => {
        const session = todaySessions.find((s) => s.userId === user._id);
        return {
          key: user._id,
          ...user,
          session,
          loginTimeFormatted: session?.loginTime
            ? dayjs(session.loginTime).format("hh:mm A")
            : "-",
          logoutTimeFormatted: session?.logoutTime
            ? dayjs(session.logoutTime).format("hh:mm A")
            : "-",
          workedHours: session?.totalHours
            ? `${Math.floor(session.totalHours)}h ${Math.floor(
                (session.totalHours * 60) % 60
              )}m`
            : "0h",
        };
      });

      setSessions(merged);
      updateStats(merged);
      generateChartData(merged);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load EOD report");
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (data) => {
    const total = data.length;
    const completed = data.filter((s) => s.session?.eod && s.session?.logoutTime).length;
    const working = data.filter((s) => s.session && !s.session.logoutTime).length;
    const pending = total - completed - working;
    setStats({ total, completed, pending, working });
  };

  const generateChartData = (data) => {
    const grouped = {};
    data.forEach((s) => {
      const date = dayjs(s.session?.loginTime || s.createdAt).format("YYYY-MM-DD");
      if (!grouped[date]) grouped[date] = { date, completed: 0, pending: 0 };
      if (s.session?.eod && s.session?.logoutTime) grouped[date].completed++;
      else grouped[date].pending++;
    });

    const result = Object.values(grouped).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
    setChartData(result);
  };

  useEffect(() => {
    fetchData();
  }, [filterType]);

  const columns = [
    { title: "Employee", dataIndex: "name", key: "name", render: (text) => <strong>{text}</strong> },
    { title: "Login Time", dataIndex: "loginTimeFormatted" },
    { title: "Logout Time", dataIndex: "logoutTimeFormatted" },
    { title: "Worked Hours", dataIndex: "workedHours" },
    {
      title: "EOD Message",
      render: (_, record) =>
        record.session?.eod ? (
          <span style={{ whiteSpace: "pre-wrap" }}>{record.session.eod}</span>
        ) : (
          <Tag color="red">Pending</Tag>
        ),
    },
    {
      title: "Status",
      render: (_, record) => {
        if (!record.session) return <Tag color="grey">Not Started</Tag>;
        if (!record.session.logoutTime) return <Tag color="blue">Working</Tag>;
        if (record.session.eod && record.session.totalHours > 0)
          return <Tag color="green">Completed</Tag>;
        return <Tag color="orange">EOD Pending</Tag>;
      },
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Toaster position="top-right" />
      <Space align="center" style={{ width: "100%", justifyContent: "space-between", marginBottom: 24 }}>
        <Title level={2}>Employee EOD Report</Title>
        <Space>
          <Select value={filterType} onChange={setFilterType} style={{ width: 150 }}>
            <Option value="today">Today</Option>
            <Option value="week">This Week</Option>
            <Option value="month">This Month</Option>
          </Select>
          <Button onClick={fetchData} loading={loading}>
            Refresh
          </Button>
        </Space>
      </Space>

      {/* Summary Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card bordered>
            <Title level={4}>Total Employees</Title>
            <Text strong>{stats.total}</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered>
            <Title level={4} style={{ color: "green" }}>Completed EOD</Title>
            <Text strong>{stats.completed}</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered>
            <Title level={4} style={{ color: "orange" }}>EOD Pending</Title>
            <Text strong>{stats.pending}</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered>
            <Title level={4} style={{ color: "blue" }}>Currently Working</Title>
            <Text strong>{stats.working}</Text>
          </Card>
        </Col>
      </Row>

      {/* Chart */}
      <Card style={{ marginTop: 24 }} title="EOD Completion Trend">
        {loading ? (
          <div style={{ textAlign: "center", padding: 50 }}>
            <Spin size="large" />
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(val) => dayjs(val).format("DD MMM")} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="completed" fill="#4CAF50" name="Completed" />
              <Bar dataKey="pending" fill="#FF9800" name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Text type="secondary">No data available for this period</Text>
        )}
      </Card>

      {/* Table */}
      <Card style={{ marginTop: 24 }}>
        <Table columns={columns} dataSource={sessions} loading={loading} pagination={{ pageSize: 10 }} bordered scroll={{ x: 800 }} />
      </Card>
    </div>
  );
}
