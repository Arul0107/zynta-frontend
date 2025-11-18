import React, { useState, useEffect } from 'react';
import { Typography, List, Card, Spin, Button, Space, Popconfirm } from 'antd';
import { CloseCircleOutlined, CheckCircleOutlined, ClockCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import toast, { Toaster } from 'react-hot-toast';
import axios from '../api/axios'; // Adjust path to your axios instance

const { Title, Text } = Typography;

const NotificationPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const currentUser = JSON.parse(localStorage.getItem("user"));
    
    // Helper to determine icon based on notification type
    const getIcon = (type) => {
        switch (type) {
            case 'STOP_WORK_WARNING':
                return <ClockCircleOutlined style={{ fontSize: '24px', color: '#faad14' }} />; // Yellow/Warning
            case 'info':
                return <CheckCircleOutlined style={{ fontSize: '24px', color: '#1677ff' }} />; // Blue/Info
            case 'error':
                return <CloseCircleOutlined style={{ fontSize: '24px', color: '#ff4d4f' }} />; // Red/Error
            default:
                return <ClockCircleOutlined style={{ fontSize: '24px' }} />;
        }
    };

    const fetchNotifications = async () => {
        if (!currentUser?._id) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            // Request URL: /api/notifications/:userId
            const res = await axios.get(`/api/notifications/${currentUser._id}`);
            setNotifications(res.data.notifications);
        } catch (err) {
            toast.error("Failed to fetch notifications.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    const handleMarkAllRead = async () => {
        const unreadIds = notifications.filter(n => !n.read).map(n => n._id);
        if (unreadIds.length === 0) {
            toast('No unread notifications.', { icon: '👏' });
            return;
        }

        try {
            await axios.post('/api/notifications/read', { notificationIds: unreadIds });
            // Optimistically update frontend
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            toast.success("All unread messages marked as read.");
        } catch (err) {
            toast.error("Failed to mark as read.");
        }
    };
    
    const handleDelete = async (notificationId) => {
        try {
            await axios.delete(`/api/notifications/${notificationId}`);
            setNotifications(prev => prev.filter(n => n._id !== notificationId));
            toast.success("Notification deleted.");
        } catch (err) {
            toast.error("Failed to delete notification.");
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    return (
        <div style={{ padding: '24px' }}>
            <Toaster position="top-right" reverseOrder={false} />
            <Title level={2}>
                Notifications 
                <Text type="secondary" style={{ marginLeft: '16px', fontSize: '16px' }}>
                    ({notifications.filter(n => !n.read).length} Unread)
                </Text>
            </Title>
            
            <Space style={{ marginBottom: 16 }}>
                <Button 
                    onClick={handleMarkAllRead} 
                    disabled={notifications.filter(n => !n.read).length === 0}
                >
                    Mark All As Read
                </Button>
            </Space>

            <Spin spinning={loading}>
                <List
                    itemLayout="horizontal"
                    dataSource={notifications}
                    renderItem={item => (
                        <Card 
                            key={item._id}
                            style={{ 
                                marginBottom: 8, 
                                // Highlight unread messages
                                borderLeft: item.read ? '5px solid #e8e8e8' : '5px solid #1677ff',
                            }}
                            actions={[
                                <Popconfirm
                                    title="Are you sure you want to delete this notification?"
                                    onConfirm={() => handleDelete(item._id)}
                                    okText="Yes"
                                    cancelText="No"
                                >
                                    <DeleteOutlined key="delete" style={{ color: '#ff4d4f' }} />
                                </Popconfirm>
                            ]}
                        >
                            <List.Item>
                                <List.Item.Meta
                                    avatar={getIcon(item.type)}
                                    title={
                                        <Space>
                                            <Text strong={!item.read}>{item.message}</Text>
                                            {item.read ? <Text type="secondary" italic>(Read)</Text> : <Text style={{ color: '#1677ff' }} strong>NEW</Text>}
                                        </Space>
                                    }
                                    description={
                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                            {dayjs(item.createdAt).format('MMM D, YYYY h:mm A')}
                                        </Text>
                                    }
                                />
                            </List.Item>
                        </Card>
                    )}
                />
                {!loading && notifications.length === 0 && (
                    <Card><Text type="secondary">No notifications found.</Text></Card>
                )}
            </Spin>
        </div>
    );
};

export default NotificationPage;