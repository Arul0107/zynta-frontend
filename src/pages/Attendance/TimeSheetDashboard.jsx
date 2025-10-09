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
} from "antd";
import axios from "../../api/axios";
import dayjs from "dayjs";
import toast, { Toaster } from "react-hot-toast";
import "./TimeSheetDashboard.css";

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

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

  // Format countdown/overtime
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

  // Fetch sessions
  const fetchSessions = async () => {
    try {
      let res;
      if (isAdmin) {
        res = await axios.get("/api/work-sessions/today");
        const formatted = (res.data.sessions || []).map((s) => ({
          key: s._id,
          ...s,
          loginTimeFormatted: dayjs(s.loginTime).format("hh:mm:ss A"),
          logoutTimeFormatted: s.logoutTime
            ? dayjs(s.logoutTime).format("hh:mm:ss A")
            : "",
        }));
        setSessions(formatted);

        const initTimers = {};
        const initRunning = {};
        formatted.forEach((s) => {
          const totalWorkedSec = s.totalHours ? Math.floor(s.totalHours * 3600) : 0;
          initTimers[s.key] = s.logoutTime
            ? totalWorkedSec
            : Math.floor(8 * 3600 - (Date.now() - new Date(s.loginTime).getTime()) / 1000);
          initRunning[s.key] = !s.logoutTime;
        });
        setTimers(initTimers);
        setRunningSessions(initRunning);
      } else {
        res = await axios.get(`/api/work-sessions/today/${currentUser._id}`);
        if (res.data.session) {
          const s = res.data.session;
          const formatted = {
            key: s._id,
            ...s,
            loginTimeFormatted: dayjs(s.loginTime).format("hh:mm:ss A"),
            logoutTimeFormatted: s.logoutTime
              ? dayjs(s.logoutTime).format("hh:mm:ss A")
              : "",
          };
          setSessions([formatted]);
          setTimers({
            [formatted.key]: s.logoutTime
              ? Math.floor(s.totalHours * 3600)
              : Math.floor(8 * 3600 - (Date.now() - new Date(s.loginTime).getTime()) / 1000),
          });
          setRunningSessions({ [formatted.key]: !s.logoutTime });
        }
      }
    } catch (err) {
      toast.error("Failed to fetch sessions");
    }
  };

  useEffect(() => {
    fetchAccountsAndServices();
    fetchSessions();
  }, []);

  // Countdown/Reverse timer
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

  // Start work
  const handleStartWork = async () => {
    setLoading(true);
    try {
      const res = await axios.post("/api/work-sessions/start", {
        userId: currentUser._id,
        name: currentUser.name,
        email: currentUser.email,
      });
      const s = res.data.session;
      setSessions([{
        key: s._id,
        ...s,
        loginTimeFormatted: dayjs(s.loginTime).format("hh:mm:ss A"),
        logoutTimeFormatted: "",
      }]);
      setTimers({ [s._id]: 8 * 3600 });
      setRunningSessions({ [s._id]: true });
      toast.success("Work started successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to start work");
    } finally {
      setLoading(false);
    }
  };

  // Stop work
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

  // Save EOD
  const handleEodSubmit = async (values) => {
    try {
      await axios.post("/api/work-sessions/eod", {
        sessionId: selectedSession.key,
        eod: values.eod,
        accountIds: values.accountIds,
        serviceIds: values.serviceIds,
        date: values.date ? values.date.toISOString() : null,
      });

      setSessions((prev) =>
        prev.map((s) =>
          s.key === selectedSession.key
            ? {
                ...s,
                eod: values.eod,
                accountIds: values.accountIds,
                serviceIds: values.serviceIds,
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

  const columns = [
    { title: "Name", dataIndex: "name" },
    { title: "Login Time", dataIndex: "loginTimeFormatted" },
    { title: "Logout Time", dataIndex: "logoutTimeFormatted" },
    {
      title: "Timer",
      render: (_, record) => (
        <span className={runningSessions[record.key] ? "countdown" : "overtime"}>
          {formatTime(timers[record.key] || 0)}
        </span>
      ),
    },
    { title: "Worked Hours", dataIndex: "totalHours", render: (_, record) => formatWorkedTime(record.totalHours) },
   {
  title: "Accounts",
  render: (_, record) =>
    record.accountIds?.map((acc) => acc.businessName).join(", ") || "-"
},
{
  title: "Services",
  render: (_, record) =>
    record.serviceIds?.map((svc) => svc.serviceName || svc.name).join(", ") || "-"
},
    {
      title: "EOD",
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => {
            setSelectedSession(record);
            setIsEodModalVisible(true);
            form.setFieldsValue({
              eod: record.eod || "",
              accountIds: record.accountIds || [],
              serviceIds: record.serviceIds || [],
              date: record.date ? dayjs(record.date) : null,
            });
          }}
        >
          {record.eod ? "View/Edit" : "Add"}
        </Button>
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
            <Button type="danger">Stop Work</Button>
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Toaster position="top-right" reverseOrder={false} />
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Title level={2}>Timesheet Dashboard</Title>
        {!isAdmin &&
          (!sessions[0] || !runningSessions[sessions[0].key]) && (
            <Button type="primary" loading={loading} onClick={handleStartWork}>
              Start Work
            </Button>
          )}
      </Row>

      <Table columns={columns} dataSource={sessions} pagination={false} rowKey="key" />

      <Modal
        title="End of Day Notes"
        open={isEodModalVisible}
        onCancel={() => setIsEodModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleEodSubmit}>
          <Form.Item label="EOD Message" name="eod">
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item label="Select Accounts" name="accountIds">
            <Select mode="multiple" placeholder="Select accounts">
              {accounts.map((a) => (
                <Option key={a._id} value={a._id}>
                  {a.businessName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Select Services" name="serviceIds">
            <Select mode="multiple" placeholder="Select services">
              {services.map((s) => (
                <Option key={s._id} value={s._id}>
                  {s.serviceName || s.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Date" name="date">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              Save
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
