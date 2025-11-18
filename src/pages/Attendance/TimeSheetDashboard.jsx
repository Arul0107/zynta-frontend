import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  Button,
  Typography,
  Modal,
  Form,
  Input,
  Row,
  Col,
  Select,
  DatePicker,
  Popconfirm,
  Space,
  Card,
  Switch,
} from "antd";
import axios from "../../api/axios";
import dayjs from "dayjs";
import toast, { Toaster } from "react-hot-toast";
import "./TimeSheetDashboard.css";

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default function TimeSheetDashboard() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEodModalVisible, setIsEodModalVisible] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [form] = Form.useForm();
  const [timers, setTimers] = useState({});
  const [runningSessions, setRunningSessions] = useState({});
  const [accounts, setAccounts] = useState([]);
  const [services, setServices] = useState([]);
  const [isEodViewModalVisible, setIsEodViewModalVisible] = useState(false);
  const [viewSession, setViewSession] = useState(null);

  // States for Enhancements
  const [excludeSundays, setExcludeSundays] = useState(false);
  const [dateFilterPreset, setDateFilterPreset] = useState('today');

  // 💡 NEW/UPDATED STATE TO CAPTURE ALL TABLE COLUMN FILTERS
  const [tableFilters, setTableFilters] = useState({});

  const [stats, setStats] = useState({
    totalSessions: 0,
    sessionsStopped: 0,
    totalWorkedHours: 0,
    uniqueWorkingDays: 0,
  });

  const [dateRange, setDateRange] = useState([dayjs().startOf("day"), dayjs().endOf("day")]);

  const currentUser = JSON.parse(localStorage.getItem("user")) || {
    _id: "temp_id_123",
    name: "Guest User",
    role: "Employee",
    email: "guest@example.com",
  };

  const isAdmin = ["Admin", "Superadmin"].includes(currentUser.role);

  // --- Utility Functions (UNCHANGED) ---

  const formatTime = (sec) => {
    const h = Math.floor(Math.abs(sec) / 3600);
    const m = Math.floor((Math.abs(sec) % 3600) / 60);
    const s = Math.floor(Math.abs(sec) % 60);
    const prefix = sec < 0 ? "+" : "";
    return `${prefix}${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatWorkedTime = (totalHours) => {
    if (totalHours === null || totalHours === undefined) return "";
    const totalSec = Math.floor(totalHours * 3600);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const getDateRangeByPreset = (preset) => {
    const today = dayjs();
    switch (preset) {
      case 'today':
        return [today.startOf('day'), today.endOf('day')];
      case 'thisWeek':
        return [today.startOf('week'), today.endOf('week')];
      case 'thisMonth':
        return [today.startOf('month'), today.endOf('month')];
      case 'custom':
      default:
        return dateRange;
    }
  };

  const handleDateRangeChange = (dates) => {
    if (dates && dates.length === 2 && dayjs.isDayjs(dates[0]) && dayjs.isDayjs(dates[1])) {
      setDateRange(dates);
      setDateFilterPreset('custom');
    } else {
      const todayRange = getDateRangeByPreset('today');
      setDateRange(todayRange);
      setDateFilterPreset('today');
    }
  };

  const handlePresetChange = (preset) => {
    setDateFilterPreset(preset);
    if (preset !== 'custom') {
      const newRange = getDateRangeByPreset(preset);
      setDateRange(newRange);
    }
  };

  const calculateStats = (data) => {
    const totalHours = data.reduce((sum, s) => sum + (s.totalHours || 0), 0);
    const totalSessions = data.length;
    const sessionsStopped = data.filter(s => s.logoutTime).length;

    const uniqueDates = new Set(data.map(s => s.dateLabel));
    const uniqueWorkingDays = uniqueDates.size;

    setStats({
      totalSessions,
      sessionsStopped,
      totalWorkedHours: totalHours,
      uniqueWorkingDays,
    });
  };

  // --- Data Fetching (UNCHANGED) ---

  const fetchAccountsAndServices = async () => {
    try {
      const [accRes, svcRes] = await Promise.all([
        axios.get("/api/accounts"),
        axios.get("/api/service"),
      ]);
      setAccounts(accRes.data || []);
      setServices(svcRes.data || []);
    } catch (err) {
      toast.error("Failed to fetch accounts or services");
    }
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      let start, end;

      if (dateRange && dateRange.length === 2 && dayjs.isDayjs(dateRange[0]) && dayjs.isDayjs(dateRange[1])) {
        start = dateRange[0].startOf("day").toISOString();
        end = dateRange[1].endOf("day").toISOString();
      } else {
        start = dayjs().startOf("day").toISOString();
        end = dayjs().endOf("day").toISOString();
      }

      const params = { start, end };
      if (!isAdmin) params.userId = currentUser._id;

      const res = await axios.get("/api/work-sessions/range", { params });

      const grouped = res.data.history || [];
      const flatSessions = [];

      grouped.forEach((group) => {
        group.sessions.forEach((s) => {
          if (isAdmin || s.userId === currentUser._id) {
            const sessionAccounts = s.accountIds?.map(id => accounts.find(a => a._id === id))?.filter(Boolean) || [];
            const sessionServices = s.serviceIds?.map(id => services.find(s => s._id === id))?.filter(Boolean) || [];

            flatSessions.push({
              ...s,
              key: s._id,
              dateLabel: group.date,
              loginTimeFormatted: dayjs(s.loginTime).format("hh:mm:ss A"),
              logoutTimeFormatted: s.logoutTime
                ? dayjs(s.logoutTime).format("hh:mm:ss A")
                : "",
              accountIds: sessionAccounts,
              serviceIds: sessionServices,
            });
          }
        });
      });

      setSessions(flatSessions);

      const initTimers = {};
      const initRunning = {};
      flatSessions.forEach((s) => {
        const totalWorkedSec = s.totalHours ? Math.floor(s.totalHours * 3600) : 0;
        initTimers[s.key] = s.logoutTime
          ? totalWorkedSec
          : Math.floor(8 * 3600 - (Date.now() - new Date(s.loginTime).getTime()) / 1000);
        initRunning[s.key] = !s.logoutTime;
      });
      setTimers(initTimers);
      setRunningSessions(initRunning);

    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch sessions");
    } finally {
      setLoading(false);
    }
  };

  // --- Effects (UNCHANGED) ---

  useEffect(() => {
    fetchAccountsAndServices();
  }, []);

  useEffect(() => {
    if (dateRange && dateRange.length === 2) {
      fetchSessions();
    }
  }, [dateRange, accounts.length, services.length]);

  // Timer interval
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) => {
        const updated = {};
        Object.keys(prev).forEach((key) => {
          updated[key] = runningSessions[key] ? prev[key] - 1 : prev[key];
        });
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [runningSessions]);

  // --- Combined Local Filtering Logic ---

  // 💡 Filter sessions based on both Exclude Sundays and Name Filter
  const filteredSessions = useMemo(() => {
    let result = sessions;

    // 1. Exclude Sundays Filter
    if (excludeSundays) {
      result = result.filter(session => dayjs(session.loginTime).day() !== 0);
    }

    // 2. Name Filter (Based on the filter captured from the table)
    const selectedNames = tableFilters.name;
    if (selectedNames && selectedNames.length > 0) {
      result = result.filter(session => selectedNames.includes(session.name));
    }

    return result;
  }, [sessions, excludeSundays, tableFilters]); // Depend on tableFilters

  // Update stats whenever the filteredSessions (including Name Filter) changes
  useEffect(() => {
    calculateStats(filteredSessions);
  }, [filteredSessions]);

  // --- Table Filter Handler ---
  // 💡 This is the key function to capture standard Ant Design column filters
  const handleTableChange = (pagination, filters, sorter) => {
    // Filters structure: { columnKey: [selectedValues], anotherColumnKey: [selectedValues] }
    setTableFilters(filters);
  };

  // (Start/Stop/EOD handlers are omitted here for brevity, assuming they are the same as the previous full code block)

  const handleStartWork = async () => {
    const hasRunningSession = Object.values(runningSessions).some(isRunning => isRunning);
    if (hasRunningSession) {
      toast.error("A work session is already running.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("/api/work-sessions/start", {
        userId: currentUser._id,
        name: currentUser.name,
        email: currentUser.email,
      });
      const s = res.data.session;
      const newSession = {
        key: s._id,
        ...s,
        loginTimeFormatted: dayjs(s.loginTime).format("hh:mm:ss A"),
        logoutTimeFormatted: "",
        dateLabel: dayjs(s.loginTime).format("DD-MM-YYYY"),
        accountIds: [],
        serviceIds: [],
      };
      setSessions((prev) => [newSession, ...prev]);
      setTimers((prev) => ({
        ...prev,
        [s._id]: Math.floor(8 * 3600 - (Date.now() - new Date(s.loginTime).getTime()) / 1000)
      }));
      setRunningSessions((prev) => ({ ...prev, [s._id]: true }));
      toast.success("Work started successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to start work");
    } finally {
      setLoading(false);
    }
  };

  const handleStopWork = async (sessionId) => {
    setLoading(true);
    try {
      const res = await axios.post("/api/work-sessions/stop", { sessionId });
      const s = res.data.session;

      setSessions((prev) =>
        prev.map((sess) =>
          sess.key === sessionId
            ? {
              ...sess,
              logoutTimeFormatted: dayjs(s.logoutTime).format("hh:mm:ss A"),
              totalHours: s.totalHours,
            }
            : sess
        )
      );
      setRunningSessions((prev) => ({ ...prev, [sessionId]: false }));
      setTimers((prev) => ({ ...prev, [sessionId]: Math.floor(s.totalHours * 3600) }));
      toast.success("Work stopped successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to stop work");
    } finally {
      setLoading(false);
    }
  };

  const handleEodSubmit = async (values) => {
    try {
      await axios.post("/api/work-sessions/eod", {
        sessionId: selectedSession.key,
        eod: values.eod,
        accountIds: values.accountIds,
        serviceIds: values.serviceIds,
        date: values.date ? values.date.toISOString() : null,
      });

      const updatedAccountIds = values.accountIds?.map(id => accounts.find(a => a._id === id))?.filter(Boolean) || [];
      const updatedServiceIds = values.serviceIds?.map(id => services.find(s => s._id === id))?.filter(Boolean) || [];

      setSessions((prev) =>
        prev.map((s) =>
          s.key === selectedSession.key
            ? {
              ...s,
              eod: values.eod,
              accountIds: updatedAccountIds,
              serviceIds: updatedServiceIds,
              date: values.date ? values.date.toISOString() : s.date,
            }
            : s
        )
      );
      setIsEodModalVisible(false);
      form.resetFields();
      toast.success("EOD saved!");
    } catch (err) {
      toast.error("Failed to save EOD");
    }
  };

  const handleViewEod = (session) => {
    setViewSession(session);
    setIsEodViewModalVisible(true);
  };

  const exportToCSV = () => {
    if (filteredSessions.length === 0) {
      toast.error("No data to export.");
      return;
    }

    const headers = [
      "S.No.", "Date", "Name", "Login Time", "Logout Time", "Worked Hours", "EOD Message", "Accounts", "Services"
    ];

    const csvRows = filteredSessions.map((s, index) => {
      const accountsList = s.accountIds?.map(acc => acc.businessName).join(" | ") || "";
      const servicesList = s.serviceIds?.map(svc => svc.serviceName || svc.name).join(" | ") || "";

      return [
        index + 1, // S.No.
        `"${s.dateLabel}"`,
        `"${s.name}"`,
        `"${s.loginTimeFormatted}"`,
        `"${s.logoutTimeFormatted}"`,
        `"${formatWorkedTime(s.totalHours)}"`,
        `"${(s.eod || "").replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        `"${accountsList}"`,
        `"${servicesList}"`,
      ].join(",");
    });

    const csvContent = [
      headers.join(","),
      ...csvRows
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `timesheet_report_${dayjs().format("YYYYMMDD_HHmmss")}.csv`);
    link.click();

    toast.success("Report downloaded successfully!");
  };


  // --- Table Columns (REVERTED TO STANDARD FILTER) ---

  const columns = [
    {
      title: "S.No.",
      key: "sno",
      render: (_, __, index) => index + 1,
      width: 60,
      fixed: 'left',
      align: 'center',
    },
    { title: "Date", dataIndex: "dateLabel", responsive: ['md'] },
    {
      title: "Name",
      dataIndex: "name",
      responsive: ['lg'],
      // 💡 STANDARD ANT DESIGN FILTER IMPLEMENTATION (REVERTED)
      filters: Array.from(new Set(sessions.map(s => s.name))).map(name => ({
        text: name,
        value: name
      })),
      onFilter: (value, record) => record.name === value,
      // NOTE: Ant Design Table will handle the filtering internally, 
      // but we capture the selected values in handleTableChange.
      key: 'name',
    },
    { title: "Login", dataIndex: "loginTimeFormatted" },
    { title: "Logout", dataIndex: "logoutTimeFormatted" },
    {
      title: "Timer",
      render: (_, record) => (
        <span className={runningSessions[record.key] ? "countdown" : (timers[record.key] < 0 ? "overtime" : "")}>
          {formatTime(timers[record.key] || 0)}
        </span>
      ),
    },
    {
      title: "Worked Hours",
      dataIndex: "totalHours",
      render: (_, r) => formatWorkedTime(r.totalHours),
      responsive: ['md']
    },

    {
      title: "EOD",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => {
              setSelectedSession(record);
              setIsEodModalVisible(true);
              form.setFieldsValue({
                eod: record.eod || "",
                accountIds: record.accountIds?.map(a => a._id) || [],
                serviceIds: record.serviceIds?.map(s => s._id) || [],
                date: record.date ? dayjs(record.date) : dayjs(record.loginTime),
              });
            }}
          >
            {record.eod ? "Edit" : "Add"}
          </Button>
          {record.eod && <Button type="link" size="small" onClick={() => handleViewEod(record)}>View</Button>}
        </Space>
      ),
    },
    {
      title: "Actions",
      render: (_, record) => {
        const isRunning = runningSessions[record.key];
        const isCurrentUser = record.userId === currentUser._id;
        const canStop = isRunning && (isAdmin || isCurrentUser);
        if (!canStop) return null;
        return (
          <Popconfirm
            title="Are you sure you want to stop work?"
            onConfirm={() => handleStopWork(record.key)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="danger" size="small">Stop</Button>
          </Popconfirm>
        );
      },
    },
  ];

  const hasRunningSessionForCurrentUser = sessions.some(s => s.userId === currentUser._id && runningSessions[s.key]);

  // --- Main Render ---

  return (
    <div className="timesheet-dashboard-container">
      <Toaster position="top-right" reverseOrder={false} />

      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Title level={2}>Timesheet Dashboard</Title>
        <Space wrap size="middle">

          <Select
            value={dateFilterPreset}
            onChange={handlePresetChange}
            style={{ width: 120 }}
          >
            <Option value="today">Today</Option>
            <Option value="thisWeek">This Week</Option>
            <Option value="thisMonth">This Month</Option>
            <Option value="custom">Custom Range</Option>
          </Select>

          <RangePicker
            onChange={handleDateRangeChange}
            value={dateRange}
            style={{ width: '100%' }}
            disabled={dateFilterPreset !== 'custom'}
          />

          <Button type="primary" onClick={fetchSessions} loading={loading}>
            Fetch History
          </Button>

          
          <Button
            onClick={exportToCSV}
            disabled={filteredSessions.length === 0}
          >
            Export Report
          </Button>

          {!isAdmin && !hasRunningSessionForCurrentUser && (
            <Button type="primary" loading={loading} onClick={handleStartWork}>
              Start Work
            </Button>
          )}
        </Space>
      </Row>

      {/* Summary Statistics Cards (Now reflects Name Filter) */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card title="Total Sessions" bordered={false} className="stat-card">
            <Title level={3} style={{ margin: 0 }}>{stats.totalSessions}</Title>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card title="Working Days" bordered={false} className="stat-card">
            <Title level={3} style={{ margin: 0 }}>{stats.uniqueWorkingDays}</Title>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card title="Sessions Stopped" bordered={false} className="stat-card">
            <Title level={3} style={{ margin: 0 }}>{stats.sessionsStopped}</Title>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card title="Total Worked Time" bordered={false} className="stat-card">
            <Title level={3} style={{ margin: 0 }}>{formatWorkedTime(stats.totalWorkedHours)}</Title>
          </Card>
        </Col>
      </Row>

      {/* Main Timesheet Table */}
      <Table
        columns={columns}
        dataSource={sessions} // Pass the unfiltered sessions here
        pagination={false}
        rowKey="key"
        loading={loading}
        scroll={{ x: 'max-content' }}

        // 💡 KEY CHANGE: Use the expanded data source and handle filtering/stats manually
        // Ant Design's standard filters will filter the displayed table data
        // We capture the filter state to filter our filteredSessions list for stats.
        onChange={handleTableChange}
      />

      {/* EOD Modals (UNCHANGED) */}
      <Modal
        title="End of Day Notes"
        open={isEodModalVisible}
        onCancel={() => {
          setIsEodModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleEodSubmit}>
          <Form.Item
            label="EOD Message"
            name="eod"
            rules={[{ required: true, message: 'Please enter your EOD message' }]}
          >
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item
            label="Select Accounts"
            name="accountIds"
            rules={[{ type: 'array', message: 'Please select at least one account' }]}
          >
            <Select mode="multiple" placeholder="Select accounts">
              {accounts.map((a) => (
                <Option key={a._id} value={a._id}>{a.businessName}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="Select Services"
            name="serviceIds"
            rules={[{ type: 'array', message: 'Please select at least one service' }]}
          >
            <Select mode="multiple" placeholder="Select services">
              {services.map((s) => (
                <Option key={s._id} value={s._id}>{s.serviceName || s.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Date" name="date">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">Save EOD</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`EOD Details - ${viewSession?.name}`}
        open={isEodViewModalVisible}
        onCancel={() => setIsEodViewModalVisible(false)}
        footer={<Button onClick={() => setIsEodViewModalVisible(false)}>Close</Button>}
        width={700}
      >
        {viewSession && (
          <div>
            <p><strong>Date:</strong> {viewSession.date ? dayjs(viewSession.date).format("DD-MM-YYYY") : viewSession.dateLabel || "-"}</p>
            <p><strong>Login:</strong> {viewSession.loginTimeFormatted || "-"}</p>
            <p><strong>Logout:</strong> {viewSession.logoutTimeFormatted || "-"}</p>
            <p><strong>Worked Hours:</strong> {formatWorkedTime(viewSession.totalHours)}</p>
            <p><strong>EOD Message:</strong></p>
            <pre style={{ whiteSpace: "pre-wrap", background: "#f5f5f5", padding: 10, borderRadius: 4 }}>
              {viewSession.eod || "No EOD provided"}
            </pre>
            <p><strong>Accounts:</strong></p>
            <ul>
              {viewSession.accountIds?.map(acc => <li key={acc._id}>{acc.businessName}</li>) || <li>-</li>}
            </ul>
            <p><strong>Services:</strong></p>
            <ul>
              {viewSession.serviceIds?.map(svc => <li key={svc._id}>{svc.serviceName || svc.name}</li>) || <li>-</li>}
            </ul>
          </div>
        )}
      </Modal>
    </div>
  );
}