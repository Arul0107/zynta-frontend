import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, Space, Tag } from "antd";
import axios from "../../api/axios";
import toast from "react-hot-toast";

export default function Credentials() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [creds, setCreds] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form] = Form.useForm();

  const loadCreds = async () => {
    const res = await axios.get(`/api/credentials/${user._id}`);
    setCreds(res.data);
  };

  const openModal = (record) => {
    setEditing(record);
    form.setFieldsValue(record || {});
    setModalOpen(true);
  };

  const saveCred = async (values) => {
    try {
      if (editing) {
        await axios.put(`/api/credentials/${editing._id}`, values);
        toast.success("Updated successfully");
      } else {
        await axios.post("/api/credentials", {
          ...values,
          userId: user._id
        });
        toast.success("Credential saved");
      }

      setModalOpen(false);
      form.resetFields();
      loadCreds();
    } catch {
      toast.error("Failed to save");
    }
  };

  useEffect(() => {
    loadCreds();
  }, []);

  const columns = [
        { title: "S.No", render: (_, __, index) => index + 1, width: 60 },

      
    { title: "App Name", dataIndex: "appName" },
    { title: "Login ID", dataIndex: "loginId" },
    {
      title: "Password",
      dataIndex: "password",
      render: (p) => <Tag color="blue">{p}</Tag>
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => openModal(record)}>Edit</Button>
          <Button danger onClick={async () => {
            await axios.delete(`/api/credentials/${record._id}`);
            loadCreds();
          }}>
            Delete
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2>User Credentials</h2>
      <Button type="primary" onClick={() => openModal(null)} className="add-event-button">Add New</Button>

      <Table
        columns={columns}
        dataSource={creds}
        style={{ marginTop: 20 }}
        rowKey="_id"
      />

      <Modal
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? "Edit Credential" : "Add Credential"}
        onOk={() => form.submit()}
      >
        <Form layout="vertical" form={form} onFinish={saveCred}>
          
          

          <Form.Item name="appName" label="Application Name" rules={[{ required: true }]}>
            <Input placeholder="Example: Facebook Ads Manager" />
          </Form.Item>

          <Form.Item name="loginId" label="Login ID" rules={[{ required: true }]}>
            <Input placeholder="Email / Username" />
          </Form.Item>

          <Form.Item name="password" label="Password" rules={[{ required: true }]}>
            <Input.Password placeholder="Enter password" />
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea placeholder="Optional notes" />
          </Form.Item>

        </Form>
      </Modal>
    </div>
  );
}
