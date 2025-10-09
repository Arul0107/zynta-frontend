// src/components/ZoneManagement.jsx
import React, { useEffect, useState } from 'react';
import { Table, Button, Drawer, Form, Input, Space, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import axios from '../../api/axios';
import toast from 'react-hot-toast';

const ZoneManagement = () => {
    const [zones, setZones] = useState([]);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingZone, setEditingZone] = useState(null);
    const [form] = Form.useForm();

    const fetchZones = async () => {
        try {
            const res = await axios.get('/api/zones');
            setZones(res.data);
        } catch (err) {
            toast.error('Failed to load zones');
        }
    };

    useEffect(() => {
        fetchZones();
    }, []);

    const openDrawerForCreate = () => {
        setEditingZone(null);
        form.resetFields();
        setDrawerOpen(true);
    };

    const openDrawerForEdit = (zone) => {
        setEditingZone(zone);
        form.setFieldsValue(zone);
        setDrawerOpen(true);
    };

    const handleDrawerSubmit = async () => {
        try {
            const values = await form.validateFields();
            if (editingZone) {
                await axios.put(`/api/zones/${editingZone._id}`, values);
                toast.success('Zone updated successfully');
            } else {
                await axios.post('/api/zones', values);
                toast.success('Zone created successfully');
            }
            setDrawerOpen(false);
            fetchZones();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to save zone');
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`/api/zones/${id}`);
            toast.success('Zone deleted');
            fetchZones();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Delete failed');
        }
    };

    const columns = [
        {
            title: 'Zone Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button
                        icon={<EditOutlined />}
                        onClick={() => openDrawerForEdit(record)}
                    />
                    <Popconfirm
                        title="Are you sure to delete this zone?"
                        onConfirm={() => handleDelete(record._id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2>Zone Management</h2>
                <Button
                    type="primary"
                    style={{ backgroundColor: '#0E2B43', borderColor: '#orange', color: 'white' }}
                    icon={<PlusOutlined />}
                    onClick={openDrawerForCreate}
                >
                    Create Zone
                </Button>
            </div>
            <Table
                columns={columns}
                dataSource={zones}
                rowKey="_id"
                bordered
            />
            <Drawer
                title={editingZone ? 'Edit Zone' : 'Create Zone'}
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                width={400}
                styles={{ body: { paddingBottom: 80 } }}
                footer={
                    <div style={{ textAlign: 'right' }}>
                        <Button onClick={() => setDrawerOpen(false)} style={{ marginRight: 8 }}>
                            Cancel
                        </Button>
                        <Button onClick={handleDrawerSubmit} type="primary" style={{ backgroundColor: '#0E2B43', borderColor: '#orange', color: 'white' }}>
                            {editingZone ? 'Update' : 'Create'}
                        </Button>
                    </div>
                }
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="name"
                        label="Zone Name"
                        rules={[{ required: true, message: 'Please enter the zone name' }]}
                    >
                        <Input />
                    </Form.Item>
                </Form>
            </Drawer>
        </>
    );
};

export default ZoneManagement;