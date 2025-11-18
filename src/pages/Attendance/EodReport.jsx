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
  DatePicker,
  Modal,
  List,
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
const { RangePicker } = DatePicker;

export default function EodReport() {
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState("today");
  const [customRange, setCustomRange] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    working: 0,
  });
  const [chartData, setChartData] = useState([]);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1️⃣ Fetch all users
      const usersRes = await axios.get("/api/users");
      const allUsers = Array.isArray(usersRes.data) ? usersRes.data : [];
      setUsers(allUsers);

      // 2️⃣ Determine date range
      let startDate, endDate;
      const today = dayjs();
      if (filterType === "today") {
        startDate = today.startOf("day").toISOString();
        endDate = today.endOf("day").toISOString();
      } else if (filterType === "week") {
        startDate = today.startOf("week").toISOString();
        endDate = today.endOf("week").toISOString();
      } else if (filterType === "month") {
        startDate = today.startOf("month").toISOString();
        endDate = today.endOf("month").toISOString();
      } else if (filterType === "custom" && customRange.length === 2) {
        startDate = customRange[0].startOf("day").toISOString();
        endDate = customRange[1].endOf("day").toISOString();
      } else {
        toast.error("Please select a valid date range");
        setLoading(false);
        return;
      }

      // 3️⃣ Fetch sessions for the range
      const sessionsRes = await axios.get(
        `/api/work-sessions/range?start=${startDate}&end=${endDate}`
      );
      const rangeSessions =
        sessionsRes.data?.history?.flatMap((d) => d.sessions) || [];

      // 4️⃣ Merge sessions with users
      const tableData = allUsers.map((user) => {
        const userSessions = rangeSessions.filter(
          (s) => String(s.userId) === String(user._id)
        );

        if (userSessions.length === 0) {
          return {
            key: user._id,
            name: user.name,
            email: user.email || "-",
            team: user.team?.name || "-",
            department: user.department?.name || "-",
            date: "-",
            loginTimeFormatted: "-",
            logoutTimeFormatted: "-",
            workedHours: "0h",
            eod: "",
            status: "No Session",
            accountIds: [],
            serviceIds: [],
          };
        }

        return userSessions.map((session) => ({
          key: session._id,
          name: user.name,
          email: user.email || "-",
          team: user.team?.name || "-",
          department: user.department?.name || "-",
          date: session.loginTime ? dayjs(session.loginTime).format("DD-MM-YYYY") : "-",
          loginTimeFormatted: session.loginTime ? dayjs(session.loginTime).format("hh:mm A") : "-",
          logoutTimeFormatted: session.logoutTime ? dayjs(session.logoutTime).format("hh:mm A") : "-",
          workedHours: session.totalHours
            ? `${Math.floor(session.totalHours)}h ${Math.floor((session.totalHours * 60) % 60)}m`
            : "0h",
          eod: session.eod || "",
          status: !session.logoutTime
            ? "Working"
            : session.eod
            ? "Completed"
            : "EOD Pending",
          accountIds: session.accountIds || [],
          serviceIds: session.serviceIds || [],
        }));
      }).flat();

      setSessions(tableData);

      // 5️⃣ Stats
      const total = tableData.length;
      const completed = tableData.filter((s) => s.status === "Completed").length;
      const working = tableData.filter((s) => s.status === "Working").length;
      const pending = tableData.filter((s) => s.status === "EOD Pending").length;
      setStats({ total, completed, pending, working });

      // 6️⃣ Chart grouped by date
      const chartGrouped = {};
      rangeSessions.forEach((s) => {
        const date = dayjs(s.loginTime).format("DD-MM-YYYY");
        if (!chartGrouped[date]) chartGrouped[date] = { date, completed: 0, pending: 0 };
        if (s.eod && s.logoutTime) chartGrouped[date].completed++;
        else chartGrouped[date].pending++;
      });
      setChartData(
        Object.values(chartGrouped).sort((a, b) => new Date(a.date) - new Date(b.date))
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to load EOD report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filterType !== "custom") fetchData();
  }, [filterType]);

  const viewEod = (session) => {
    setSelectedSession(session);
    setModalVisible(true);
  };

  const columns = [
    { title: "Date", dataIndex: "date", key: "date" },
    { title: "Employee", dataIndex: "name", key: "name", render: (t) => <strong>{t}</strong> },
    { title: "Email", dataIndex: "email", key: "email" },
 
    { title: "Login Time", dataIndex: "loginTimeFormatted" },
    { title: "Logout Time", dataIndex: "logoutTimeFormatted" },
    { title: "Worked Hours", dataIndex: "workedHours" },
    {
      title: "EOD Message",
      dataIndex: "eod",
      render: (text) =>
        text ? <span style={{ whiteSpace: "pre-wrap" }}>{text}</span> : <Tag color="red">Pending</Tag>,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => {
        switch (status) {
          case "Working":
            return <Tag color="blue">Working</Tag>;
          case "Completed":
            return <Tag color="green">Completed</Tag>;
          case "EOD Pending":
            return <Tag color="orange">EOD Pending</Tag>;
          case "No Session":
            return <Tag color="grey">No Session</Tag>;
          default:
            return <Tag color="grey">Unknown</Tag>;
        }
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) =>
        record.status !== "No Session" ? (
          <Button type="link" onClick={() => viewEod(record)}>
            View EOD
          </Button>
        ) : null,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Toaster position="top-right" />
      <Space
        align="center"
        style={{ width: "100%", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap" }}
      >
        <Title level={2}>Employee EOD Report</Title>
        <Space wrap>
          <Select value={filterType} onChange={setFilterType} style={{ width: 160 }}>
            <Option value="today">Today</Option>
            <Option value="week">This Week</Option>
            <Option value="month">This Month</Option>
            <Option value="custom">Custom Range</Option>
          </Select>
          {filterType === "custom" && <RangePicker onChange={(val) => setCustomRange(val || [])} />}
          <Button type="primary" onClick={fetchData} loading={loading} disabled={filterType === "custom" && customRange.length !== 2}>
            Fetch Data
          </Button>
        </Space>
      </Space>

      {/* Summary Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}><Card><Title level={4}>Total Records</Title><Text strong>{stats.total}</Text></Card></Col>
        <Col xs={24} sm={12} md={6}><Card><Title level={4} style={{ color: "green" }}>Completed EOD</Title><Text strong>{stats.completed}</Text></Card></Col>
        <Col xs={24} sm={12} md={6}><Card><Title level={4} style={{ color: "orange" }}>EOD Pending</Title><Text strong>{stats.pending}</Text></Card></Col>
        <Col xs={24} sm={12} md={6}><Card><Title level={4} style={{ color: "blue" }}>Currently Working</Title><Text strong>{stats.working}</Text></Card></Col>
      </Row>

      {/* Chart */}
      <Card style={{ marginTop: 24 }} title="EOD Completion Trend">
        {loading ? (
          <div style={{ textAlign: "center", padding: 50 }}><Spin size="large" /></div>
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
        <Table
          columns={columns}
          dataSource={sessions}
          loading={loading}
          pagination={{ pageSize: 10 }}
          bordered
          scroll={{ x: 1300 }}
        />
      </Card>

      {/* EOD Modal */}
      <Modal
        title={`EOD Details - ${selectedSession?.name}`}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={<Button onClick={() => setModalVisible(false)}>Close</Button>}
        width={700}
      >
        {selectedSession && (
          <div>
            <p><strong>Date:</strong> {selectedSession.date}</p>
            <p><strong>Login:</strong> {selectedSession.loginTimeFormatted}</p>
            <p><strong>Logout:</strong> {selectedSession.logoutTimeFormatted}</p>
            <p><strong>Worked Hours:</strong> {selectedSession.workedHours}</p>
            <p><strong>EOD Message:</strong></p>
            <pre style={{ whiteSpace: "pre-wrap", background: "#f5f5f5", padding: 10 }}>
              {selectedSession.eod || "No EOD provided"}
            </pre>

            <p><strong>Accounts:</strong></p>
            <List
              size="small"
              bordered
              dataSource={selectedSession.accountIds || []}
              renderItem={item => <List.Item>{item.businessName} - {item.contactName}</List.Item>}
            />

            <p><strong>Services:</strong></p>
            <List
              size="small"
              bordered
              dataSource={selectedSession.serviceIds || []}
              renderItem={item => (
                <List.Item>{item.serviceName} ({item.category})</List.Item>
              )}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
