import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Drawer,
  Form,
  Input,
  Select,
  Space,
  Popconfirm,
  Tabs, // <-- Imported for tabbed view
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  UserAddOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import axios from "../../api/axios";
import toast from "react-hot-toast";

const { Option } = Select;
const { TabPane } = Tabs; // <-- Destructure TabPane

const UserManagement = ({
  users,
  departments,
  teams,
  fetchUsers,
  fetchDepartments,
  fetchTeams,
  loading,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const [businessAccounts, setBusinessAccounts] = useState([]);

  const [transferDrawerOpen, setTransferDrawerOpen] = useState(false);
  const [transferringUser, setTransferringUser] = useState(null);
  const [transferForm] = Form.useForm();

  const currentUser = JSON.parse(localStorage.getItem("user"));
  const isSuperadmin = currentUser?.role === "Superadmin";
  const isAdmin = currentUser?.role === "Admin";
  const isTeamLeader = currentUser?.role === "Team Leader";

  useEffect(() => {
    loadBusinessAccounts();
  }, []);

  const loadBusinessAccounts = async () => {
    try {
      const res = await axios.get("/api/accounts");
      setBusinessAccounts(res.data || []);
    } catch (err) {
      console.error("Failed to load business accounts", err);
    }
  };

  // ---------- Drawer Handling ----------

  const openDrawerForCreateUser = () => {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({ role: "Employee", status: "Active" });
    setDrawerOpen(true);
  };

  const openDrawerForCreateClient = () => {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({ role: "Client", status: "Active" });
    setDrawerOpen(true);
  };

  const openDrawerForEdit = (user) => {
    setEditingUser(user);
    form.setFieldsValue({
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      status: user.status,
      businessAccount: user.businessAccount?._id,
      department: user.department?._id,
      team: user.team?._id,
    });
    setDrawerOpen(true);
  };

  // ---------- Create / Update Save ----------

  const handleDrawerSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingUser && !values.password) delete values.password;

      if (editingUser) {
        await axios.put(`/api/users/${editingUser._id}`, values);
        toast.success("User updated successfully");
      } else {
        await axios.post("/api/users", values);
        toast.success("User created successfully");
      }

      setDrawerOpen(false);
      fetchUsers();
      fetchDepartments();
      fetchTeams();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save");
    }
  };

  // ---------- Delete User ----------
  const handleDelete = async (_id) => {
    try {
      if (_id === currentUser._id) {
        toast.error("You cannot delete your own account!");
        return;
      }

      await axios.delete(`/api/users/${_id}`);
      toast.success("User deleted");
      fetchUsers();
      fetchDepartments();
      fetchTeams();
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  // ---------- Transfer Feature ----------
  const openTransferDrawer = (user) => {
    setTransferringUser(user);
    transferForm.setFieldsValue({
      newDepartment: user.department?._id,
      newTeam: user.team?._id,
    });
    setTransferDrawerOpen(true);
  };

  const handleTransferSubmit = async () => {
    try {
      const values = await transferForm.validateFields();
      await axios.put(`/api/users/transfer/${transferringUser._id}`, {
        departmentId: values.newDepartment,
        teamId: values.newTeam,
      });

      toast.success("User transferred successfully!");
      setTransferDrawerOpen(false);
      fetchUsers();
      fetchDepartments();
      fetchTeams();
    } catch (err) {
      toast.error("Transfer failed");
    }
  };

  // --- User Separation (Data for the tabs) ---
  const internalUsers = users.filter((user) => user.role !== "Client");
  const clients = users.filter((user) => user.role === "Client");

  // ---------- Table Columns ----------
  const columns = [
    { title: "Name", dataIndex: "name" },
    { title: "Email", dataIndex: "email" },
    { title: "Mobile", dataIndex: "mobile" },
    { title: "Role", dataIndex: "role" },
    { title: "Status", dataIndex: "status" },
    {
      title: "Department",
      dataIndex: "department",
      render: (d) => d?.name || "N/A",
    },
    {
      title: "Team",
      dataIndex: "team",
      render: (t) => t?.name || "N/A",
    },
    {
      title: "Actions",
      render: (_, r) => {
        const sameTeam =
          isTeamLeader &&
          currentUser.team &&
          r.team?._id &&
          currentUser.team === r.team._id;

        return (
          <Space>
            {(isSuperadmin || isAdmin || sameTeam) && (
              <Button
                icon={<EditOutlined />}
                onClick={() => openDrawerForEdit(r)}
              />
            )}

            {(isSuperadmin || isAdmin) && (
              <Button
                icon={<SwapOutlined />}
                onClick={() => openTransferDrawer(r)}
              />
            )}

            {(isSuperadmin || isAdmin) && (
              <Popconfirm
                title="Delete user?"
                onConfirm={() => handleDelete(r._id)}
              >
                <Button danger icon={<DeleteOutlined />} />
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  const currentRole = form.getFieldValue("role");

  return (
    <>
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h2>User Management</h2>

        {(isSuperadmin || isAdmin) && (
          <Space>
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={openDrawerForCreateUser}
            >
              Create User (Internal)
            </Button>

            <Button
              type="primary"
              style={{ backgroundColor: "#3BAFDA" }}
              onClick={openDrawerForCreateClient}
            >
              Create Client
            </Button>
          </Space>
        )}
      </div>
      
      {/* --- USERS TABLE (USING TABS) --- */}
      <Tabs defaultActiveKey="internal">
        {/* INTERNAL STAFF TAB */}
        <TabPane
          tab={
            <span>
              Internal Staff ({internalUsers.length})
            </span>
          }
          key="internal"
        >
          <Table
            columns={columns}
            dataSource={internalUsers}
            loading={loading}
            bordered
            rowKey="_id"
            pagination={{ pageSize: 10 }}
          />
        </TabPane>

        {/* CLIENTS TAB */}
        <TabPane
          tab={
            <span>
              Clients ({clients.length})
            </span>
          }
          key="client"
        >
          <Table
            columns={columns}
            dataSource={clients}
            loading={loading}
            bordered
            rowKey="_id"
            pagination={{ pageSize: 10 }}
          />
        </TabPane>
      </Tabs>
      
      {/* CREATE / EDIT USER DRAWER */}
      <Drawer
        title={editingUser ? "Edit User" : "Create User"}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={420}
        destroyOnClose
        footer={
          <div style={{ textAlign: "right" }}>
            <Button
              onClick={() => setDrawerOpen(false)}
              style={{ marginRight: 8 }}
            >
              Cancel
            </Button>
            <Button type="primary" onClick={handleDrawerSubmit}>
              {editingUser ? "Update" : "Create"}
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          {/* ROLE */}
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select disabled={editingUser && !isSuperadmin}>
              <Option value="Superadmin" disabled={!isSuperadmin}>
                Superadmin
              </Option>
              <Option value="Admin" disabled={!isSuperadmin}>
                Admin
              </Option>
              <Option value="Team Leader">Team Leader</Option>
              <Option value="Employee">Employee</Option>
              <Option value="Client" disabled={editingUser}>
                Client
              </Option>
            </Select>
          </Form.Item>

          {/* BUSINESS ACCOUNT ONLY FOR CLIENT */}
          {currentRole === "Client" && (
            <Form.Item
              name="businessAccount"
              label="Business Account"
              rules={[{ required: true }]}
            >
              <Select
                placeholder="Select Business"
                onChange={(id) => {
                  const acc = businessAccounts.find((a) => a._id === id);
                  if (acc) {
                    form.setFieldsValue({
                      name: acc.contactName,
                      email: acc.contactEmail,
                      mobile: acc.contactNumber,
                    });
                  }
                }}
              >
                {businessAccounts.map((acc) => (
                  <Option key={acc._id} value={acc._id}>
                    {acc.businessName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          {/* NAME */}
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input disabled={currentRole === "Client"} />
          </Form.Item>

          {/* EMAIL */}
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: "email" }]}
          >
            <Input disabled={currentRole === "Client"} />
          </Form.Item>

          {/* MOBILE */}
          <Form.Item name="mobile" label="Mobile">
            <Input disabled={currentRole === "Client"} />
          </Form.Item>

          {/* PASSWORD */}
          {!editingUser && (
            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true }]}
            >
              <Input.Password />
            </Form.Item>
          )}

          {/* DEPT & TEAM FOR NON-CLIENTS */}
          {currentRole !== "Client" && (
            <>
              <Form.Item name="department" label="Department">
                <Select allowClear disabled={editingUser && !(isAdmin || isSuperadmin)}>
                  {departments.map((dept) => (
                    <Option key={dept._id} value={dept._id}>
                      {dept.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="team" label="Team">
                <Select allowClear disabled={editingUser && !(isAdmin || isSuperadmin)}>
                  {teams.map((team) => (
                    <Option key={team._id} value={team._id}>
                      {team.name} ({team.department?.name || "N/A"})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </>
          )}

          {/* STATUS */}
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select>
              <Option value="Active">Active</Option>
              <Option value="Inactive">Inactive</Option>
            </Select>
          </Form.Item>
        </Form>
      </Drawer>

      {/* TRANSFER DRAWER */}
      <Drawer
        title={`Transfer User: ${transferringUser?.name}`}
        open={transferDrawerOpen}
        onClose={() => setTransferDrawerOpen(false)}
        width={420}
        destroyOnClose
        footer={
          <div style={{ textAlign: "right" }}>
            <Button onClick={() => setTransferDrawerOpen(false)}>
              Cancel
            </Button>
            <Button type="primary" onClick={handleTransferSubmit}>
              Transfer
            </Button>
          </div>
        }
      >
        <Form form={transferForm} layout="vertical">
          <Form.Item name="newDepartment" label="New Department">
            <Select placeholder="Select Department">
              {departments.map((dept) => (
                <Option key={dept._id} value={dept._id}>
                  {dept.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="newTeam" label="New Team">
            <Select placeholder="Select Team">
              {teams.map((team) => (
                <Option key={team._id} value={team._id}>
                  {team.name} ({team.department?.name || "N/A"})
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
};

export default UserManagement;