import React, { useEffect, useState } from "react";
import { Table, Checkbox, Card, Button, Tag } from "antd";
import axios from "../../api/axios";

// ⭐ All App Routes — fetched manually (you can automate later)
const allRoutes = [
  { path: "/dashboard", name: "Dashboard" },
  { path: "/access", name: "Access" },
  { path: "/taskmanage", name: "Task Manager" },
  { path: "/taskboard", name: "Task Board" },
  { path: "/chat", name: "Chat" },
  { path: "/leads", name: "Leads" },
  { path: "/clients", name: "Clients" },
  { path: "/quotation", name: "Quotations" },
  { path: "/products", name: "Products" },
  { path: "/attendance", name: "TimeSheet" },
  { path: "/wallets", name: "Wallets" },
  { path: "/master", name: "Master" },
  { path: "/profile", name: "Profile" },
  { path: "/settings", name: "Settings" },
  { path: "/management", name: "User Management" },
];

const AccessManager = () => {
  const [data, setData] = useState([]);
  const [saving, setSaving] = useState(false);

  // Load users + their access
  useEffect(() => {
    loadAccess();
  }, []);

  const loadAccess = async () => {
    const res = await axios.get("/api/access/all");  // ✔ FIXED
    setData(res.data);
  };

  // Update checkbox click
  const updateRoute = (userId, path, checked) => {
    setData(prev =>
      prev.map(row =>
        row.user._id === userId
          ? {
              ...row,
              allowedRoutes: checked
                ? [...row.allowedRoutes, path]
                : row.allowedRoutes.filter(r => r !== path),
            }
          : row
      )
    );
  };

  // Save all users permissions
  const save = async () => {
    setSaving(true);

    for (const row of data) {
      await axios.post("/api/access/update", {   // ✔ FIXED
        userId: row.user._id,
        allowedRoutes: row.allowedRoutes,
      });
    }

    setSaving(false);
  };

  // Table columns
  const columns = [
    {
      title: "User",
      render: ({ user }) => (
        <>
          <strong>{user.name}</strong>
          <br />
          <Tag color="blue">{user.role}</Tag>
        </>
      ),
    },
    {
      title: "Permissions",
      render: ({ user, allowedRoutes }) => (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {allRoutes.map(route => (
            <Checkbox
              key={route.path}
              checked={allowedRoutes.includes(route.path)}
              onChange={(e) =>
                updateRoute(user._id, route.path, e.target.checked)
              }
            >
              {route.name}
            </Checkbox>
          ))}
        </div>
      ),
    },
  ];

  return (
    <Card title="Role-Based Access Manager" bordered={true}>
      <Button
        type="primary"
        onClick={save}
        loading={saving}
        style={{ marginBottom: 20 }}
      >
        Save Permissions
      </Button>

      <Table
        columns={columns}
        dataSource={data}
        rowKey={(row) => row.user._id}
        pagination={false}
        bordered
      />
    </Card>
  );
};

export default AccessManager;
