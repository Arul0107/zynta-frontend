import React, { useEffect, useState } from 'react';
import {
  Table, Button, Drawer, Form, Input, Select, Space, Popconfirm
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  UserAddOutlined,
  SwapOutlined
} from '@ant-design/icons';
import axios from '../../api/axios';
import toast from 'react-hot-toast';

const { Option } = Select;

const UserManagement = ({ users, departments, teams, fetchUsers, fetchDepartments, fetchTeams, loading }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

  const [transferDrawerOpen, setTransferDrawerOpen] = useState(false);
  const [transferringUser, setTransferringUser] = useState(null);
  const [transferForm] = Form.useForm();
  
  const currentUser = JSON.parse(localStorage.getItem('user'));
  const isSuperadmin = currentUser?.role === 'Superadmin';
  const isAdmin = currentUser?.role === 'Admin';
  const isTeamLeader = currentUser?.role === 'Team Leader';

  useEffect(() => {}, []);

  const openDrawerForCreate = () => {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({
      role: 'Employee',
      status: 'Active',
    });
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
      department: user.department?._id,
      team: user.team?._id,
    });
    setDrawerOpen(true);
  };

  const handleDrawerSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingUser && !values.password) delete values.password;

      if (isTeamLeader && editingUser) {
        if (values.role !== editingUser.role) {
          toast.error('Team Leaders cannot change user roles.');
          return;
        }
        if (values.department !== editingUser.department?._id) {
          toast.error('Team Leaders cannot change user departments.');
          return;
        }
        if (values.team !== editingUser.team?._id) {
          toast.error('Team Leaders cannot change user teams.');
          return;
        }
      }

      if (editingUser) {
        await axios.put(`/api/users/${editingUser._id}`, values);
        toast.success('User updated successfully');
      } else {
        await axios.post('/api/users', values);
        toast.success('User created successfully');
      }

      setDrawerOpen(false);
      fetchUsers();
      if (isSuperadmin || isAdmin) {
        fetchTeams();
        fetchDepartments();
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to submit user');
    }
  };

  const handleDelete = async (id) => {
    try {
      if ((isSuperadmin || isAdmin) && currentUser._id === id) {
        toast.error('You cannot delete your own account.');
        return;
      }
      await axios.delete(`/api/users/${id}`);
      toast.success('User deleted');
      fetchUsers();
      if (isSuperadmin || isAdmin) {
        fetchTeams();
        fetchDepartments();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Delete failed');
    }
  };

  const openTransferDrawer = (user) => {
    setTransferringUser(user);
    transferForm.setFieldsValue({
      currentDepartment: user.department?.name,
      currentTeam: user.team?.name,
      newDepartment: user.department?._id,
      newTeam: user.team?._id,
    });
    setTransferDrawerOpen(true);
  };

  const handleTransferSubmit = async () => {
    try {
      const values = await transferForm.validateFields();
      const { newDepartment, newTeam } = values;

      await axios.put(`/api/users/transfer/${transferringUser._id}`, {
        newDepartmentId: newDepartment,
        newTeamId: newTeam,
      });

      toast.success(`${transferringUser.name} transferred successfully`);
      setTransferDrawerOpen(false);
      fetchUsers();
      fetchTeams();
      fetchDepartments();
    } catch (err) {
      console.error("Transfer error:", err);
      toast.error(err?.response?.data?.message || 'Failed to transfer user');
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Mobile', dataIndex: 'mobile', key: 'mobile' },
    { title: 'Role', dataIndex: 'role', key: 'role' },
    { title: 'Status', dataIndex: 'status', key: 'status' },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (department) => department?.name || 'N/A'
    },
    {
      title: 'Team',
      dataIndex: 'team',
      key: 'team',
      render: (team) => team?.name || 'N/A'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {(isSuperadmin || isAdmin || (isTeamLeader && currentUser.team === record.team?._id)) && (
            <Button icon={<EditOutlined />} onClick={() => openDrawerForEdit(record)} />
          )}
          {(isSuperadmin || isAdmin) && (
              <Button
                icon={<SwapOutlined />}
                onClick={() => openTransferDrawer(record)}
                title="Transfer User to another Team/Department"
              />
          )}
          {(isSuperadmin || isAdmin) && (
            <Popconfirm
              title="Delete this user?"
              onConfirm={() => handleDelete(record._id)}
              disabled={currentUser._id === record._id}
            >
              <Button danger icon={<DeleteOutlined />} disabled={currentUser._id === record._id} />
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>User Management</h2>
        {(isSuperadmin || isAdmin) && (
          <Button
            type="primary"
            style={{ backgroundColor: '#0E2B43', borderColor: '#orange', color: 'white' }}
            icon={<UserAddOutlined />}
            onClick={openDrawerForCreate}
          >
            Create User
          </Button>
        )}
      </div>

      <Table
        columns={columns}
        dataSource={users}
        loading={loading}
        rowKey="_id"
        bordered
      />

      {/* Create/Edit Drawer */}
      <Drawer
        title={editingUser ? 'Edit User' : 'Create User'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={420}
        destroyOnClose
        styles={{ body: { paddingBottom: 80 } }}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Button onClick={() => setDrawerOpen(false)} style={{ marginRight: 8 }}>Cancel</Button>
            <Button
              type="primary"
              style={{ backgroundColor: '#0E2B43', borderColor: '#orange', color: 'white' }}
              onClick={handleDrawerSubmit}
            >
              {editingUser ? 'Update' : 'Create'}
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Name is required' }]}>
            <Input disabled={isTeamLeader && editingUser && currentUser._id !== editingUser._id} />
          </Form.Item>

          <Form.Item name="email" label="Email" rules={[
            { required: true, message: 'Email is required' },
            { type: 'email', message: 'Invalid email format' }
          ]}>
            <Input disabled={isTeamLeader && editingUser && currentUser._id !== editingUser._id} />
          </Form.Item>

          <Form.Item name="mobile" label="Mobile">
            <Input disabled={isTeamLeader && editingUser && currentUser._id !== editingUser._id} />
          </Form.Item>

          {((!editingUser && (isSuperadmin || isAdmin)) || (editingUser && (isSuperadmin || isAdmin))) && (
            <Form.Item
              name="password"
              label="Password"
              rules={!editingUser ? [{ required: true, message: 'Password is required' }] : []}
            >
              <Input.Password placeholder={editingUser ? 'Leave blank to keep current password' : ''} />
            </Form.Item>
          )}

          <Form.Item name="role" label="Role" rules={[{ required: true, message: 'Please select a role' }]}>
            <Select
              placeholder="Select role"
              disabled={isTeamLeader && editingUser && currentUser._id !== editingUser._id}
            >
              <Option value="Superadmin" disabled={!isSuperadmin}>Superadmin</Option>
              <Option value="Admin" disabled={!isSuperadmin}>Admin</Option>
              <Option value="Team Leader">Team Leader</Option>
              <Option value="Employee">Employee</Option>
            </Select>
          </Form.Item>

          <Form.Item name="status" label="Status" rules={[{ required: true, message: 'Please select status' }]}>
            <Select
              placeholder="Select status"
              disabled={isTeamLeader && editingUser && currentUser._id !== editingUser._id}
            >
              <Option value="Active">Active</Option>
              <Option value="Inactive">Inactive</Option>
            </Select>
          </Form.Item>

          {(isSuperadmin || isAdmin) && (
            <Form.Item name="department" label="Department">
              <Select placeholder="Select department" allowClear>
                {departments.map(dept => (
                  <Option key={dept._id} value={dept._id}>{dept.name}</Option>
                ))}
              </Select>
            </Form.Item>
          )}

          {(isSuperadmin || isAdmin) && (
            <Form.Item name="team" label="Team">
              <Select placeholder="Select team" allowClear>
                {teams.map(team => (
                  <Option key={team._id} value={team._id}>{team.name} ({team.department?.name || 'N/A'})</Option>
                ))}
              </Select>
            </Form.Item>
          )}
        </Form>
      </Drawer>

      {/* Transfer Drawer */}
      <Drawer
        title={`Transfer User: ${transferringUser?.name}`}
        open={transferDrawerOpen}
        onClose={() => setTransferDrawerOpen(false)}
        width={420}
        destroyOnClose
        styles={{ body: { paddingBottom: 80 } }}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Button onClick={() => setTransferDrawerOpen(false)} style={{ marginRight: 8 }}>Cancel</Button>
            <Button
              type="primary"
              style={{ backgroundColor: '#0E2B43', borderColor: '#orange', color: 'white' }}
              onClick={handleTransferSubmit}
            >
              Transfer
            </Button>
          </div>
        }
      >
        <Form form={transferForm} layout="vertical">
          <Form.Item label="Current Department">
            <Input value={transferringUser?.department?.name || 'N/A'} disabled />
          </Form.Item>
          <Form.Item label="Current Team">
            <Input value={transferringUser?.team?.name || 'N/A'} disabled />
          </Form.Item>

          <Form.Item name="newDepartment" label="New Department (Optional)">
            <Select placeholder="Select new department" allowClear>
              {departments.map(dept => (
                <Option key={dept._id} value={dept._id}>{dept.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="newTeam" label="New Team (Optional)">
            <Select placeholder="Select new team" allowClear>
              {teams.map(team => (
                <Option key={team._id} value={team._id}>{team.name} ({team.department?.name || 'N/A'})</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
};

export default UserManagement;
 