import React, { useState, useEffect } from 'react';
import { Avatar, Dropdown, Menu, Badge } from 'antd'; // Removed Space import
import {
    LogoutOutlined,
    UserOutlined,
    BellOutlined,
    PlusOutlined,       
    ClockCircleOutlined, 
    MenuOutlined,        
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from "../../api/axios"; 
import toast from 'react-hot-toast'; 
import logoExpanded from "../../assets/vrism.png";
import './TopNavbar.css';

const TopNavbar = ({ collapsed, setCollapsed }) => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));
    
    const [notificationCount, setNotificationCount] = useState(0); 

    // --- Data Fetching Effect for Notifications (UNCHANGED) ---
    useEffect(() => {
        const fetchUnreadCount = async () => {
            if (!user?._id) return;

            try {
                const res = await axios.get(`/api/notifications/${user._id}`);
                const unreadCount = res.data.notifications.filter(n => !n.read).length;
                setNotificationCount(unreadCount);
            } catch (err) {
                console.error("Failed to fetch notification count:", err);
            }
        };
        fetchUnreadCount();
    }, [user?._id]); 

    // --- Handlers (UNCHANGED) ---
    const handleAttendance = () => {
        navigate('/attendance'); 
    };
    const handleCreateTask = () => {
        navigate('/create-task'); 
    };
    const handleNotifications = () => {
        setNotificationCount(0); 
        navigate('/notifications'); 
    };
    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };
    const handleProfile = () => {
        navigate('/profile');
    };  

    // --- Menu & Initial Logic (UNCHANGED) ---
    const menu = (
        <Menu>
            <Menu.Item key="profile" icon={<UserOutlined />} onClick={handleProfile}>
                Profile
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
                Logout
            </Menu.Item>
        </Menu>
    );
    const getInitial = () => {
        if (!user) return 'U';
        return user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U';
    };

    return (
        <div className="top-navbar-container">
            
            {/* 1. Left Side: Logo/Menu Toggle */}
            <div className="navbar-left-content">
               

                {/* Mobile Logo/Menu Toggle: Only visible on small screens (controlled by CSS) */}
                <div className="mobile-logo-wrapper" onClick={() => setCollapsed(!collapsed)}>
                    <img src={logoExpanded} alt="logo" className="mobile-logo" />
                </div>
            </div>

            {/* 2. Right Side: Actions and User Menu - CONVERTED TO DIV */}
            <div className="top-navbar-right"> 
                
               

                {/* Notification Icon with Dynamic Badge */}
                <Badge count={notificationCount > 0 ? notificationCount : 0} size="small" offset={[-2, 0]}>
                    <BellOutlined 
                        className="action-icon notification-icon" 
                        onClick={handleNotifications} 
                    />
                </Badge>

                {/* Avatar Dropdown */}
                <Dropdown overlay={menu} placement="bottomRight" arrow>
                    <Avatar
                        className="user-avatar"
                        style={{ backgroundColor: '#0e2b43', color: '#fff' }}
                    >
                        {getInitial()}
                    </Avatar>
                </Dropdown>
            </div>
        </div>
    );
};

export default TopNavbar;