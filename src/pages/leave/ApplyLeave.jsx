import React, { useEffect, useState, useContext } from "react";
import {
  Card,
  Form,
  DatePicker,
  Select,
  Input,
  Button,
  Typography,
  List,
  Tag,
  message,
  Drawer,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  PlusOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../api/axios";
import { PresenceContext } from "../../context/PresenceContext";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const LeaveTypes = [
  { label: "Sick Leave", value: "Sick" },
  { label: "Casual Leave", value: "Casual" },
  { label: "Medical Leave", value: "Medical" },
  { label: "Paid Leave", value: "Paid" },
  { label: "Lop", value: "Unpaid" },
];

const totalDays = {
  Sick: 10,
  Casual: 10,
  Medical: Infinity,
  Paid: 5,
  Unpaid: Infinity,
};

export default function ApplyLeave() {
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const { socket } = useContext(PresenceContext);
  const [form] = Form.useForm();

  const [myLeaves, setMyLeaves] = useState([]);
  const [balances, setBalances] = useState({});
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedDays, setSelectedDays] = useState(0);

  const loadData = async () => {
    try {
      const hist = await api.get(`/api/leaves/my/${currentUser._id}`);
      setMyLeaves(hist.data.leaves || hist.data || []);

      const bal = await api.get(`/api/leaves/balance/${currentUser._id}`);
      setBalances(bal.data?.balances || bal.data || {});
    } catch (err) {
      message.error("❌ Failed to load leave data");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 🟢 auto-refresh on socket events
  useEffect(() => {
    if (!socket) return;

    const refresh = () => loadData();

    socket.on("leave_status_update", refresh);
    socket.on("leave_request_received", refresh);

    return () => {
      socket.off("leave_status_update", refresh);
      socket.off("leave_request_received", refresh);
    };
  }, [socket]);

  const applyLeave = async (values) => {
    try {
      const [from, to] = values.dates;

      await api.post("/api/leaves", {
        type: values.type,
        reason: values.reason,
        userId: currentUser._id,
        fromDate: from.toISOString(),
        toDate: to.toISOString(),
      });

      socket?.emit("new_leave_request", { userId: currentUser._id });

      message.success("✔ Leave Request Sent");
      form.resetFields();
      setSelectedDays(0);
      setDrawerVisible(false);
      loadData();
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to apply");
    }
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

  return (
    <div style={{ padding: "0 20px" }}>
      <Button
        type="primary"
        size="large"className="add-event-button"
        icon={<PlusOutlined />}
        onClick={() => setDrawerVisible(true)}
        style={{ marginBottom: 20 }}
      >
        Apply New Leave
      </Button>

      {/* Leave Balance */}
      <Card
        title={
          <>
            <CalendarOutlined />{" "}
            <Title level={5} style={{ display: "inline-block", marginLeft: 8 }}>
              Leave Balances
            </Title>
          </>
        }
        style={{ marginBottom: 20 }}
      >
        <Row gutter={[16, 16]}>
          {Object.keys(balances).map((t) => {
            if (!totalDays[t]) return null;

            const rem = balances[t];
            const total = totalDays[t];

            const used = total === Infinity ? "N/A" : `${total - rem} days`;

            return (
              <Col xs={12} md={6} key={t}>
                <Statistic
                  title={t}
                  value={total === Infinity ? "Unlimited" : rem}
                  valueStyle={{ color: rem <= 0 ? "red" : "#1677ff" }}
                />
                <Text type="secondary">Used: {used}</Text>
              </Col>
            );
          })}
        </Row>
      </Card>

      {/* Form Drawer */}
      <Drawer
        title="Submit Leave Request"
        width={450}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        destroyOnClose
      >
        <Form layout="vertical" form={form} onFinish={applyLeave}>
          <Form.Item
            label="Select Dates"
            name="dates"
            rules={[{ required: true }]}
          >
            <RangePicker
              style={{ width: "100%" }}
              onChange={(v) => {
                if (!v) return setSelectedDays(0);
                const days = dayjs(v[1]).diff(dayjs(v[0]), "day") + 1;
                setSelectedDays(days);
              }}
            />
          </Form.Item>

          {selectedDays > 0 && (
            <Text style={{ color: "#1677ff" }}>
              Selected: {selectedDays} days
            </Text>
          )}

          <Form.Item
            label="Leave Type"
            name="type"
            rules={[{ required: true }]}
          >
            <Select options={LeaveTypes} />
          </Form.Item>

          <Form.Item
            label="Reason"
            name="reason"
            rules={[{ required: true }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Button type="primary" htmlType="submit" icon={<CheckCircleOutlined />}>
            Submit
          </Button>
        </Form>
      </Drawer>

      {/* History */}
      <Card title="My Leave History">
        <List
          dataSource={myLeaves}
          renderItem={(item) => (
            <List.Item>
              <div style={{ flex: 1 }}>
                <Text strong>
                  {dayjs(item.fromDate).format("DD MMM")} -{" "}
                  {dayjs(item.toDate).format("DD MMM YYYY")}
                </Text>
                <Tag style={{ marginLeft: 8 }}>{item.type}</Tag>

                <br />
                <div style={{ marginTop: 8 }}>
                  {renderApprovalTag("TL", item.approval?.["Team Leader"])}
                  {renderApprovalTag("Admin", item.approval?.["Admin"])}
                  {renderApprovalTag("SA", item.approval?.["Superadmin"])}
                </div>

                {item.rejectReason && (
                  <Text type="danger">Reason: {item.rejectReason}</Text>
                )}
              </div>

              <Tag
                color={
                  item.status === "Approved"
                    ? "green"
                    : item.status === "Rejected"
                    ? "red"
                    : "orange"
                }
              >
                {item.status}
              </Tag>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
