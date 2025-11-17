import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Typography,
  Modal,
  Form,
  Input,
  Row,
  Select,
  DatePicker,
  Popconfirm,
  Space,
} from "antd";
import axios from "../../api/axios";
import dayjs from "dayjs";
import toast, { Toaster } from "react-hot-toast";
import "./TimeSheetDashboard.css"; // Ensure this CSS file contains the responsive styles

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
  const [dateRange, setDateRange] = useState([]);

  // Mock User for local testing, replace with actual context/storage retrieval
  const currentUser = JSON.parse(localStorage.getItem("user")) || {
    _id: "temp_id_123",
    name: "Guest User",
    role: "Employee",
    email: "guest@example.com",
  };

  const isAdmin = ["Admin", "Superadmin"].includes(currentUser.role);

  // Fetch accounts & services
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
    if (!totalHours) return "";
    const totalSec = Math.floor(totalHours * 3600);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      let start, end;
      if (dateRange && dateRange.length === 2) {
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
            flatSessions.push({
              ...s,
              key: s._id,
              dateLabel: group.date,
              loginTimeFormatted: dayjs(s.loginTime).format("hh:mm:ss A"),
              logoutTimeFormatted: s.logoutTime
                ? dayjs(s.logoutTime).format("hh:mm:ss A")
                : "",
            });
          }
        });
      });

      setSessions(flatSessions);

      // initialize timers
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

  useEffect(() => {
    fetchAccountsAndServices();
    // Use an initial date range for the current day when component mounts
    setDateRange([dayjs().startOf("day"), dayjs().endOf("day")]); 
    // fetchSessions will be called by useEffect below after dateRange is set
  }, []); // Initial load only

  // Rerun fetchSessions when dateRange changes
  useEffect(() => {
    if (dateRange.length === 2) {
      fetchSessions();
    }
  }, [dateRange]); // Dependency on dateRange

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) => {
        const updated = {};
        Object.keys(prev).forEach((key) => {
          // If the session is running, count down/up; otherwise, keep the total worked time
          updated[key] = runningSessions[key] ? prev[key] - 1 : prev[key];
        });
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [runningSessions]);

  const handleStartWork = async () => {
    // Prevent starting work if a session is already running
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
        dateLabel: dayjs(s.loginTime).format("YYYY-MM-DD"),
      };
      // Prepend new session to show it at the top
      setSessions((prev) => [newSession, ...prev]); 
      // Initialize timer to 8 hours (in seconds) or elapsed time
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
      // Set timer to the calculated total worked time
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
      // Find the names for display purposes in the table
      const updatedAccountIds = values.accountIds?.map(id => accounts.find(a => a._id === id))?.filter(Boolean);
      const updatedServiceIds = values.serviceIds?.map(id => services.find(s => s._id === id))?.filter(Boolean);

      setSessions((prev) =>
        prev.map((s) =>
          s.key === selectedSession.key
            ? {
                ...s,
                eod: values.eod,
                // Update with the full objects for display in the table
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

  const columns = [
    { title: "Date", dataIndex: "dateLabel", responsive: ['md'] }, // Hide on small screens
    { title: "Name", dataIndex: "name", responsive: ['lg'] }, // Hide on tablet/mobile
    { title: "Login", dataIndex: "loginTimeFormatted" },
    { title: "Logout", dataIndex: "logoutTimeFormatted" },
    {
      title: "Timer",
      render: (_, record) => (
        <span className={runningSessions[record.key] ? "countdown" : (timers[record.key] > 8 * 3600 ? "overtime" : "")}>
          {formatTime(timers[record.key] || 0)}
        </span>
      ),
    },
    { 
      title: "Worked Hours", 
      dataIndex: "totalHours", 
      render: (_, r) => formatWorkedTime(r.totalHours),
      responsive: ['md'] // Hide on small screens
    },
    {
      title: "Accounts",
      render: (_, record) =>
        record.accountIds?.map((acc) => acc.businessName).join(", ") || "-",
      responsive: ['lg'] // Hide on tablet/mobile
    },
    {
      title: "Services",
      render: (_, record) =>
        record.serviceIds?.map((svc) => svc.serviceName || svc.name).join(", ") || "-",
      responsive: ['lg'] // Hide on tablet/mobile
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
              // Set the form fields, mapping back to just the IDs for the Select component
              form.setFieldsValue({
                eod: record.eod || "",
                accountIds: record.accountIds?.map(a => a._id) || [],
                serviceIds: record.serviceIds?.map(s => s._id) || [],
                // Ensure date is a dayjs object for the DatePicker
                date: record.date ? dayjs(record.date) : null, 
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
        // Only allow stopping work if it's running AND the user is Admin or the session owner
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

  return (
    // Add a top-level class for mobile responsiveness in CSS
    <div className="timesheet-dashboard-container">
      <Toaster position="top-right" reverseOrder={false} />
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Title level={2}>Timesheet Dashboard</Title>
        <Space wrap size="middle">
          <RangePicker 
            onChange={setDateRange} 
            value={dateRange} 
            // Ensures RangePicker is the full width of its parent space item on mobile
            style={{ width: '100%' }} 
          />
          <Button type="primary" onClick={fetchSessions} loading={loading}>
            Fetch History
          </Button>
          {/* Show Start Work button only if not Admin AND no session is currently running for the user */}
          {!isAdmin && !hasRunningSessionForCurrentUser && (
            <Button type="primary" loading={loading} onClick={handleStartWork}>
              Start Work
            </Button>
          )}
        </Space>
      </Row>

      {/* Add scroll property to enable horizontal scrolling on small screens.
        This is the most effective way to manage column visibility in Antd.
      */}
      <Table 
        columns={columns} 
        dataSource={sessions} 
        pagination={false} 
        rowKey="key" 
        loading={loading}
        scroll={{ x: 'max-content' }} // Makes table horizontally scrollable on small screens
      />

      {/* EOD Modal */}
      <Modal
        title="End of Day Notes"
        open={isEodModalVisible}
        onCancel={() => setIsEodModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleEodSubmit}>
          <Form.Item label="EOD Message" name="eod" rules={[{ required: true, message: 'Please enter your EOD message' }]}>
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item label="Select Accounts" name="accountIds" rules={[{ required: true, type: 'array', message: 'Please select at least one account' }]}>
            <Select mode="multiple" placeholder="Select accounts">
              {accounts.map((a) => (
                <Option key={a._id} value={a._id}>{a.businessName}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Select Services" name="serviceIds" rules={[{ required: true, type: 'array', message: 'Please select at least one service' }]}>
            <Select mode="multiple" placeholder="Select services">
              {services.map((s) => (
                <Option key={s._id} value={s._id}>{s.serviceName || s.name}</Option>
              ))}
            </Select>
          </Form.Item>
          {/* Allow Date editing (useful for Admin or correcting past entries) */}
          <Form.Item label="Date" name="date">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">Save EOD</Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* View EOD Modal */}
      <Modal
        title={`EOD Details - ${viewSession?.name}`}
        open={isEodViewModalVisible}
        onCancel={() => setIsEodViewModalVisible(false)}
        footer={<Button onClick={() => setIsEodViewModalVisible(false)}>Close</Button>}
        width={700}
      >
        {viewSession && (
          <div>
            <p><strong>Date:</strong> {viewSession.date ? dayjs(viewSession.date).format("YYYY-MM-DD") : viewSession.dateLabel || "-"}</p>
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