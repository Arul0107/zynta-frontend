import React, { useEffect, useState } from 'react';
import {
  Table, Button, Drawer, Form, Input, Space, Popconfirm
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined
} from '@ant-design/icons';
import axios from '../../api/axios';
import toast from 'react-hot-toast';

// This component now receives data and fetch functions as props from CombinedManagement
const DepartmentManagement = ({ departments, fetchDepartments, fetchTeams, fetchUsers }) => {
  // Removed local state for departments as it's now a prop
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [form] = Form.useForm();

  const currentUser = JSON.parse(localStorage.getItem('user'));
  const isSuperadmin = currentUser?.role === 'Superadmin';
  const isAdmin = currentUser?.role === 'Admin';

  // Removed useEffect for initial data fetching as it's handled by CombinedManagement

  const openDrawerForCreate = () => {
    setEditingDepartment(null);
    form.resetFields();
    setDrawerOpen(true);
  };

  const openDrawerForEdit = (department) => {
    setEditingDepartment(department);
    form.setFieldsValue({
      name: department.name,
      description: department.description,
    });
    setDrawerOpen(true);
  };

  const handleDrawerSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingDepartment) {
        await axios.put(`/api/departments/${editingDepartment._id}`, values);
        toast.success('Department updated successfully');
      } else {
        await axios.post('/api/departments', values);
        toast.success('Department created successfully');
      }
      setDrawerOpen(false);
      fetchDepartments(); // Re-fetch departments
      fetchTeams();       // Re-fetch teams as department changes might affect them
      fetchUsers();       // Re-fetch users as department changes might affect them
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to submit department');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/departments/${id}`);
      toast.success('Department deleted');
      fetchDepartments(); // Re-fetch departments
      fetchTeams();       // Re-fetch teams as department changes might affect them
      fetchUsers();       // Re-fetch users as department changes might affect them
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Delete failed');
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    // { title: 'Description', dataIndex: 'description', key: 'description' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {(isSuperadmin || isAdmin) && (
            <>
              <Button icon={<EditOutlined />} onClick={() => openDrawerForEdit(record)} />
              <Popconfirm title="Delete this department?" onConfirm={() => handleDelete(record._id)}>
                <Button danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>Department Management</h2>
        {(isSuperadmin || isAdmin) && (
          <Button
            type="primary"
            style={{ backgroundColor: '#0E2B43', borderColor: '#orange', color: 'white' }}
            icon={<PlusOutlined />}
            onClick={openDrawerForCreate}
          >
            Create Department
          </Button>
        )}
      </div>

      <Table
        columns={columns}
        dataSource={departments}
        rowKey="_id"
        bordered
      />

      <Drawer
        title={editingDepartment ? 'Edit Department' : 'Create Department'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={420}
        destroyOnClose
        footer={
          <div style={{ textAlign: 'right' }}>
            <Button onClick={() => setDrawerOpen(false)} style={{ marginRight: 8 }}>Cancel</Button>
            <Button
              type="primary"
              style={{ backgroundColor: '#0E2B43', borderColor: '#orange', color: 'white' }}
              onClick={handleDrawerSubmit}
            >
              {editingDepartment ? 'Update' : 'Create'}
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Department Name" rules={[{ required: true, message: 'Department name is required' }]}>
            <Input />
          </Form.Item>
          {/* <Form.Item name="description" label="Description">
            <Input.TextArea rows={4} />
          </Form.Item> */}
        </Form>
      </Drawer>
    </>
  );
};

export default DepartmentManagement;