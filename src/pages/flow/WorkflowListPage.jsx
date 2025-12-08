import React, { useEffect, useState } from "react";
import axios from "../../api/axios";
import { Table, Button, message, Popconfirm } from "antd";
import { useParams, useNavigate } from "react-router-dom";
import { EditOutlined, EyeOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";

export default function WorkflowListPage() {
  const { service_id } = useParams();
  const navigate = useNavigate();

  const [workflows, setWorkflows] = useState([]);
  const [serviceName, setServiceName] = useState("Loading...");
  const [loading, setLoading] = useState(true);

  const loadService = async () => {
    try {
      const res = await axios.get("/api/service");
      const found = res.data.find((s) => s._id === service_id || s.service_id === service_id);
      setServiceName(found?.serviceName || "Unknown Service");
    } catch {
      setServiceName("Unknown Service");
    }
  };

  const loadWorkflows = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/workflow/${service_id}`);
      setWorkflows(res.data?.workflows || []);

    } catch {
      message.error("Failed to load workflows");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadService();
    loadWorkflows();
  }, [service_id]);

  const deleteWF = async (id) => {
    try {
      await axios.delete(`/api/workflow/${id}`);
      message.success("Workflow deleted");
      loadWorkflows();
    } catch {
      message.error("Failed to delete workflow");
    }
  };

  const columns = [
    { title: "S.No", render: (_, __, i) => i + 1 },
    { title: "Workflow Name", dataIndex: "workflowName" },
    {
      title: "Actions",
      render: (_, rec) => (
        <>
          <Button icon={<EyeOutlined />} size="small"
            onClick={() => navigate(`/workflow/view/${rec._id}`)}>
            View
          </Button>

          <Button icon={<EditOutlined />} size="small" style={{ marginLeft: 6 }}
            onClick={() => navigate(`/workflow/edit/${rec._id}`)}>
            Edit
          </Button>

          <Popconfirm title="Delete workflow?" onConfirm={() => deleteWF(rec._id)}>
            <Button icon={<DeleteOutlined />} danger size="small" style={{ marginLeft: 6 }} />
          </Popconfirm>
        </>
      )
    }
  ];

  return (
    <div style={{ padding: 20 }}>
      <h2>{serviceName} Workflows</h2>

      <Button
        type="primary"
        icon={<PlusOutlined />}
        style={{ background: "#0E2B43", borderColor: "#0E2B43", marginBottom: 15 }}
        onClick={() => navigate(`/workflow/${service_id}/create`)}
      >
        Create Workflow
      </Button>

      <Table rowKey="_id" loading={loading} columns={columns} dataSource={workflows} />

      <Button type="link" style={{ marginTop: 15 }}
        onClick={() => navigate("/service-management")}>
        ← Back
      </Button>
    </div>
  );
}
