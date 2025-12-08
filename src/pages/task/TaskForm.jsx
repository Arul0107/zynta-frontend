// src/components/TaskForm.jsx
import React, { useEffect, useState } from "react";
import {
  Drawer,
  Form,
  Input,
  Select,
  Row,
  Col,
  Button,
  message,
  Card,
  Typography,
  Switch,
  TimePicker
} from "antd";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";
import axios from "../../api/axios";
import "./TaskForm.css";

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const TaskForm = ({ visible, onClose, editing, onSaved }) => {
  const [form] = Form.useForm();

  const currentUser =
    JSON.parse(localStorage.getItem("user")) || {
      _id: "temp",
      role: "Employee",
      name: "You"
    };

  const canAssign = ["Admin", "TeamLead", "SuperAdmin", "Superadmin"].includes(
    currentUser.role
  );

  // Dropdowns
  const [allUsers, setAllUsers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [services, setServices] = useState([]);

  // Time & Date
  const [assignedDate, setAssignedDate] = useState(new Date());
  const [dueDate, setDueDate] = useState(moment().add(1, "days").toDate());
const [startTime, setStartTime] = useState(moment("09:00 AM", "hh:mm A"));
  const [saving, setSaving] = useState(false);

  // Load users, accounts, services
  useEffect(() => {
    const loadAll = async () => {
      try {
        const u = await axios.get("/api/users");
        setAllUsers(u.data || []);

        const a = await axios.get("/api/accounts");   // ✔ Correct API
        setAccounts(a.data || []);

        const s = await axios.get("/api/service");    // ✔ Correct API
        setServices(s.data || []);

      } catch (err) {
        console.error("Dropdown Load Error:", err);
      }
    };
    loadAll();
  }, []);

  // Load existing data for editing
  useEffect(() => {
    form.resetFields();

    if (editing) {
      form.setFieldsValue({
        title: editing.title,
        description: editing.description,
        assignedTo: editing.assignedTo?._id,
        status: editing.status,

        // new fields
        reason: editing.reason,
        timeRequired: editing.timeRequired,
        extraAttachment: editing.extraAttachment?.[0] || "",
        isImportant: editing.isImportant || false,

        accountId: editing.accountId?._id,
        serviceId: editing.serviceId?._id
      });

      setStartTime(
        editing.startTime ? moment(editing.startTime, "HH:mm") : moment("09:00", "HH:mm")
      );

      setAssignedDate(editing.assignedDate ? new Date(editing.assignedDate) : new Date());
      setDueDate(
        editing.dueDate ? new Date(editing.dueDate) : moment().add(1, "days").toDate()
      );

    } else {
      form.setFieldsValue({
        assignedTo: currentUser._id,
        status: "To Do",
        isImportant: false
      });

      setAssignedDate(new Date());
      setStartTime(moment("09:00", "HH:mm"));
      setDueDate(moment().add(1, "days").toDate());
    }
  }, [editing, visible]);

  // Save task
  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      const payload = {
        ...values,

        assignedDate: moment.utc(assignedDate).startOf("day").toISOString(),
        dueDate: moment.utc(dueDate).startOf("day").toISOString(),

        startTime: startTime.format("HH:mm"),

        extraAttachment: values.extraAttachment ? [values.extraAttachment] : []
      };

      setSaving(true);

      if (editing) {
        payload.assignedBy = editing.assignedBy?._id;
        await axios.put(`/api/tasks/${editing._id}`, payload);
        message.success("Task updated");
      } else {
        payload.assignedBy = currentUser._id;
        await axios.post("/api/tasks", payload);
        message.success("Task created");
      }

      onSaved?.();
      onClose();

    } catch (err) {
      console.error(err);
      message.error("Save failed: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      title={editing ? "Edit Task" : "Create Task"}
      width={700}
      open={visible}
      onClose={onClose}
      destroyOnClose
      forceRender   // ✔ FIX WARNING
      footer={
        <div style={{ textAlign: "right" }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={saving} onClick={handleSave}>
            {editing ? "Update Task" : "Create Task"}
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical">

        {/* BASIC */}
        <Card className="zoho-section-card">
          <Title level={5}>Basic Information</Title>

          <Form.Item
            name="title"
            label="Task Title *"
            rules={[{ required: true }]}
          >
            <Input placeholder="Enter task title" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Task details" />
          </Form.Item>

          <Form.Item name="isImportant" label="Mark Important">
            <Switch />
          </Form.Item>
        </Card>

        {/* ADDITIONAL */}
        <Card className="zoho-section-card">
          <Title level={5}>Additional Fields</Title>

          <Form.Item name="reason" label="Reason">
            <TextArea rows={2} placeholder="Why this task?" />
          </Form.Item>
     <Form.Item name="startTime" label="Start Time">
  <TimePicker
    value={startTime}
    format="hh:mm A"
    use12Hours
    minuteStep={5}
    inputReadOnly     // 🔥 enables mobile wheel/spinner UI
    style={{ width: "100%" }}
    onChange={(v) => setStartTime(v)}
  />
</Form.Item>

          <Form.Item name="extraAttachment" label="Attachment URL">
            <Input placeholder="Paste URL here" />
          </Form.Item>

           <Title level={5}>Account & Service</Title>

          <Form.Item name="accountId" label="Account">
            <Select placeholder="Select account">
              {accounts.map((a) => (
                <Option key={a._id} value={a._id}>
                  {a.businessName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="serviceId" label="Service">
            <Select placeholder="Select service">
              {services.map((s) => (
                <Option key={s._id} value={s._id}>
                  {s.serviceName}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Card>

      
        {/* ASSIGN */}
        <Card className="zoho-section-card">
          <Title level={5}>Assignment</Title>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="assignedTo"
                label="Assign To"
                rules={[{ required: true }]}
              >
                <Select disabled={!canAssign}>
                  {allUsers.map((u) => (
                    <Option key={u._id} value={u._id}>
                      {u.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="status" label="Status">
                <Select>
                  <Option value="To Do">To Do</Option>
                  <Option value="In Progress">In Progress</Option>
                  <Option value="Review">Review</Option>
                  <Option value="Completed">Completed</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* DATES */}
        <Card className="zoho-section-card">
          <Title level={5}>Dates</Title>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Assigned Date">
                <DatePicker
                  selected={assignedDate}
                  onChange={setAssignedDate}
                  dateFormat="yyyy/MM/dd"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Due Date">
                <DatePicker
                  selected={dueDate}
                  onChange={setDueDate}
                  dateFormat="yyyy/MM/dd"
                />
              </Form.Item>
            </Col>
          </Row>

          <Text>
            Assigned By:{" "}
            <b>{editing ? editing.assignedBy?.name : currentUser.name}</b>
          </Text>
        </Card>

      </Form>
    </Drawer>
  );
};

export default TaskForm;
