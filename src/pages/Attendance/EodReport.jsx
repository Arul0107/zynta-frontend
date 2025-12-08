import React, { useEffect, useState, useContext, useRef } from "react";
import {
  Table, Typography, Tag, Space, Button, Card,
  Row, Col, Select, Spin, DatePicker, Modal, List
} from "antd";
import axios from "../../api/axios";
import dayjs from "dayjs";
import toast, { Toaster } from "react-hot-toast";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from "recharts";
import { PresenceContext } from "../../context/PresenceContext";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const formatLastSeen = (date) =>
  date ? dayjs(date).format("DD MMM YYYY, hh:mm A") : "—";

/**
 * EodReport
 * - loads users (once)
 * - loads sessions for range (fetchData)
 * - uses presenceMap (socket) for live presence & lastSeen priority
 * - refreshSessionsOnly() runs every 20s to fetch session updates only
 * - when presenceMap updates, we merge live presence & lastSeen into rows
 */
export default function EodReport() {
  const [users, setUsers] = useState([]);            // kept to avoid reloading users repeatedly
  const [sessions, setSessions] = useState([]);      // table rows (merged with presence)
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState("today");
  const [customRange, setCustomRange] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, working: 0 });
  const [chartData, setChartData] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  const { presenceMap } = useContext(PresenceContext);

  // keep last fetched sessions raw map for efficient diff/merge
  const sessionsMapRef = useRef({}); // { sessionId: sessionObj }

  // Helper: build date range (ISO strings)
  const buildRange = () => {
    const today = dayjs();
    let startDate, endDate;
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
    }
    return { startDate, endDate };
  };

  // Load users + sessions (initial and manual fetch)
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1) load users (only if not loaded)
      if (users.length === 0) {
        const uRes = await axios.get("/api/users");
        setUsers(uRes.data || []);
      }

      // 2) load sessions for date range
      const { startDate, endDate } = buildRange();
      const sessionRes = await axios.get(`/api/work-sessions/range?start=${startDate}&end=${endDate}`);
      const rangeSessions = sessionRes.data?.history?.flatMap(d => d.sessions) || [];

      // update sessions map
      const map = {};
      (rangeSessions || []).forEach(s => {
        map[s._id] = s;
      });
      sessionsMapRef.current = map;

      // build table rows by merging users + sessions + presence
      const tableData = (users.length ? users : (await axios.get("/api/users")).data || []).flatMap(user => {
        const live = presenceMap[user._id];

        const lastSeen = live?.lastActiveAt ? new Date(live.lastActiveAt) : (user.lastActiveAt ? new Date(user.lastActiveAt) : null);
        const presence = live?.presence || user.presence || "offline";

        const uSessions = rangeSessions.filter(s => String(s.userId) === String(user._id));
        if (uSessions.length === 0) {
          return {
            key: `no-${user._id}`,
            sessionId: null,
            userId: user._id,
            name: user.name,
            email: user.email,
            team: user.team?.name || '-',
            department: user.department?.name || '-',
            presence,
            lastSeen,
            date: "-",
            loginTimeFormatted: "-",
            logoutTimeFormatted: "-",
            workedHours: "0h",
            eod: "",
            status: "No Session",
            accountIds: [],
            serviceIds: []
          };
        }
        return uSessions.map(s => ({
          key: s._id,
          sessionId: s._id,
          userId: user._id,
          name: user.name,
          email: user.email,
          team: user.team?.name || '-',
          department: user.department?.name || '-',
          presence,
          lastSeen,
          date: s.loginTime ? dayjs(s.loginTime).format("DD-MM-YYYY") : "-",
          loginTimeFormatted: s.loginTime ? dayjs(s.loginTime).format("hh:mm A") : "-",
          logoutTimeFormatted: s.logoutTime ? dayjs(s.logoutTime).format("hh:mm A") : "-",
          workedHours: s.totalHours ? `${Math.floor(s.totalHours)}h ${Math.floor((s.totalHours * 60) % 60)}m` : "0h",
          eod: s.eod || "",
          status: !s.logoutTime ? "Working" : s.eod ? "Completed" : "EOD Pending",
          accountIds: s.accountIds || [],
          serviceIds: s.serviceIds || []
        }));
      });

      setSessions(tableData);

      // stats & chart
      setStats({
        total: tableData.length,
        completed: tableData.filter(s => s.status === "Completed").length,
        pending: tableData.filter(s => s.status === "EOD Pending").length,
        working: tableData.filter(s => s.status === "Working").length
      });

      const grouped = {};
      (rangeSessions || []).forEach(s => {
        const d = dayjs(s.loginTime).format("DD-MM-YYYY");
        if (!grouped[d]) grouped[d] = { date: d, completed: 0, pending: 0 };
        if (s.eod && s.logoutTime) grouped[d].completed++;
        else grouped[d].pending++;
      });
      setChartData(Object.values(grouped));
    } catch (err) {
      toast.error("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  // Refresh sessions only (runs every 20s). Efficiently merges data into current rows.
  const refreshSessionsOnly = async () => {
    try {
      const { startDate, endDate } = buildRange();
      const sessionRes = await axios.get(`/api/work-sessions/range?start=${startDate}&end=${endDate}`);
      const newSessionsList = sessionRes.data?.history?.flatMap(d => d.sessions) || [];
      const newMap = {};
      newSessionsList.forEach(s => (newMap[s._id] = s));

      sessionsMapRef.current = newMap;

      setSessions(prevRows => prevRows.map(row => {
        // If a row has no sessionId (no session) we keep it; but if a session now exists for that user we should keep as-is (user won't suddenly get session in past automatically)
        if (!row.sessionId) return row;

        const updated = newMap[row.sessionId];
        if (!updated) return row; // unchanged

        // merge updated session fields
        return {
          ...row,
          loginTimeFormatted: updated.loginTime ? dayjs(updated.loginTime).format("hh:mm A") : "-",
          logoutTimeFormatted: updated.logoutTime ? dayjs(updated.logoutTime).format("hh:mm A") : "-",
          workedHours: updated.totalHours ? `${Math.floor(updated.totalHours)}h ${Math.floor((updated.totalHours * 60) % 60)}m` : "0h",
          eod: updated.eod || "",
          status: !updated.logoutTime ? "Working" : updated.eod ? "Completed" : "EOD Pending"
        };
      }));

      // update stats quickly (derived from newMap + current rows)
      setStats(prev => {
        const allRows = Object.values(newMap).map(s => {
          return !s.logoutTime ? "Working" : s.eod ? "Completed" : "EOD Pending";
        });
        const completed = allRows.filter(x => x === "Completed").length;
        const working = allRows.filter(x => x === "Working").length;
        const pending = allRows.filter(x => x === "EOD Pending").length;
        return { total: sessions.length || 0, completed, pending, working };
      });
    } catch (err) {
      // silent
    }
  };

  // initial load
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType]);

  // presence live merge: when presenceMap changes, update rows quickly
  useEffect(() => {
    if (!Object.keys(presenceMap || {}).length) return;
    setSessions(prev => prev.map(row => {
      const live = presenceMap[row.userId];
      const lastSeen = live?.lastActiveAt ? new Date(live.lastActiveAt) : row.lastSeen;
      const presence = live?.presence || row.presence || "offline";
      return { ...row, presence, lastSeen };
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presenceMap]);

  // auto refresh sessions (20s)
  useEffect(() => {
    const id = setInterval(() => {
      refreshSessionsOnly();
    }, 20000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, customRange]);

  // Table columns
  const columns = [
    { title: "Date", dataIndex: "date" },
    { title: "Employee", dataIndex: "name", render: t => <strong>{t}</strong> },
    { title: "Email", dataIndex: "email" },
    {
      title: "Presence",
      dataIndex: "presence",
      render: p => {
        const colors = { online: "green", busy: "red", away: "orange", in_meeting: "purple", offline: "gray" };
        return <Tag color={colors[p]}>{(p || "offline").toUpperCase()}</Tag>;
      }
    },
    {
      title: "Last Seen",
      dataIndex: "lastSeen",
      render: (t, row) => row.presence === "online" ? <Tag color="green">Online now</Tag> : <span style={{fontSize:12}}>{formatLastSeen(t)}</span>
    },
    { title: "Login", dataIndex: "loginTimeFormatted" },
    { title: "Logout", dataIndex: "logoutTimeFormatted" },
    { title: "Worked Hours", dataIndex: "workedHours" },
    {
      title: "EOD Message",
      dataIndex: "eod",
      render: text => text ? <span style={{whiteSpace:"pre-wrap"}}>{text}</span> : <Tag color="red">Pending</Tag>
    },
    {
      title: "Status",
      dataIndex: "status",
      render: s => {
        const colors = { Working: "blue", Completed: "green", "EOD Pending": "orange", "No Session": "gray" };
        return <Tag color={colors[s]}>{s}</Tag>;
      }
    },
    {
      title: "Actions",
      render: (_, r) => r.status !== "No Session" ? <Button type="link" onClick={() => { setSelectedSession(r); setModalVisible(true); }}>View EOD</Button> : null
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <Toaster position="top-right" />
        <Title level={2}>Employee EOD Report</Title>

      <Space align="center" style={{ width: "100%", justifyContent: "space-between", marginBottom: 24 }}>

        <Space>
          <Select value={filterType} onChange={setFilterType} style={{ width: 150 }}>
            <Option value="today">Today</Option>
            <Option value="week">This Week</Option>
            <Option value="month">This Month</Option>
            <Option value="custom">Custom Range</Option>
          </Select>

          {filterType === "custom" && <RangePicker onChange={setCustomRange} />}

          <Button type="primary" onClick={fetchData} disabled={filterType === "custom" && customRange.length !== 2} loading={loading}>Fetch Data</Button>
        </Space>
      </Space>

      {/* Summary Cards */}
      <Row gutter={[16,16]}>
        <Col xs={24} sm={12} md={6}><Card><Title level={4}>Total Records</Title><Text strong>{stats.total}</Text></Card></Col>
        <Col xs={24} sm={12} md={6}><Card><Title level={4} style={{color:"green"}}>Completed</Title><Text strong>{stats.completed}</Text></Card></Col>
        <Col xs={24} sm={12} md={6}><Card><Title level={4} style={{color:"orange"}}>EOD Pending</Title><Text strong>{stats.pending}</Text></Card></Col>
        <Col xs={24} sm={12} md={6}><Card><Title level={4} style={{color:"blue"}}>Currently Working</Title><Text strong>{stats.working}</Text></Card></Col>
      </Row>

      {/* Chart */}
      <Card style={{ marginTop: 24 }} title="EOD Completion Trend">
        {loading ? <div style={{textAlign:"center", padding:50}}><Spin size="large"/></div> : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="completed" name="Completed" /><Bar dataKey="pending" name="Pending" /></BarChart></ResponsiveContainer>
        ) : <Text type="secondary">No Data Available</Text>}
      </Card>

      {/* Table */}
      <Card style={{ marginTop: 24 }}>
        <Table columns={columns} dataSource={sessions} loading={loading} pagination={{ pageSize: 10 }} bordered scroll={{ x: 1300 }} />
      </Card>

      {/* Modal */}
      <Modal title={`EOD Details - ${selectedSession?.name}`} open={modalVisible} onCancel={() => setModalVisible(false)} footer={<Button onClick={() => setModalVisible(false)}>Close</Button>} width={700}>
        {selectedSession && (
          <>
            <p><strong>Date:</strong> {selectedSession.date}</p>
            <p><strong>Login:</strong> {selectedSession.loginTimeFormatted}</p>
            <p><strong>Logout:</strong> {selectedSession.logoutTimeFormatted}</p>
            <p><strong>Worked Hours:</strong> {selectedSession.workedHours}</p>
            <p><strong>EOD Message:</strong></p>
            <pre style={{ background: "#f5f5f5", whiteSpace: "pre-wrap", padding: 10 }}>{selectedSession.eod || "No EOD submitted"}</pre>

            <p><strong>Accounts:</strong></p>
            <List size="small" bordered dataSource={selectedSession.accountIds} renderItem={item => <List.Item>{item.businessName || "N/A"}</List.Item>} />

            <p><strong>Services:</strong></p>
            <List size="small" bordered dataSource={selectedSession.serviceIds} renderItem={item => <List.Item>{item.serviceName || "N/A"} ({item.category || "-"})</List.Item>} />
          </>
        )}
      </Modal>
    </div>
  );
}
