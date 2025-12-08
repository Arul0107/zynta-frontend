import React from "react";
import {
  DashboardOutlined,
  SolutionOutlined,
  FileTextOutlined,
  UserOutlined,
  FileAddOutlined,
  PlusOutlined,
  ClockCircleOutlined,
  CheckSquareTwoTone,
  MessageFilled,
  LockFilled,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import "./MobileTabMenu.css";

const MobileNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;

  // Define all menu items
  const allMenuItems = [
    {
      key: "/dashboard",
      icon: <DashboardOutlined />,
      label: "Dashboard",
      roles: ["Admin", "Superadmin","Team Leader"],
    },
    {
      key: "/attendance",
      icon: <ClockCircleOutlined />,
      label: "Timesheet",
      roles: ["Admin", "Superadmin", "Employee","Team Leader"],
    },
    {
      key: "/taskmanage",
      icon: <PlusOutlined />,
      label: "Task",
      roles: ["Admin", "Superadmin","Employee","Team Leader"],
    },
    {
      key: "/chat",
      icon: <MessageFilled />,
      label: "Timesheet",
      roles: ["Admin", "Superadmin", "Employee","Team Leader"],
    },
    
    {
      key: "/quotation",
      icon: <FileTextOutlined />,
      label: "Quotations",
      roles: ["Admin", "Superadmin"],
    },
    {
      key: "/customers",
      icon: <UserOutlined />,
      label: "Customers",
      roles: ["Admin", "Superadmin"],
    },
    {
      key: "/products",
      icon: <FileAddOutlined />,
      label: "Products",
      roles: ["Admin", "Superadmin"],
    },
    {
      key: "/master",
      icon: <LockFilled />,
      label: "Timesheet",
      roles: ["Admin", "Superadmin", "Employee","Team Leader"],
    },
  ];

  // Filter by user role
  const visibleItems = allMenuItems.filter(item => item.roles.includes(role));

  return (
    <div className="mobile-tab-menu">
      {visibleItems.map(item => (
        <div
          key={item.key}
          onClick={() => navigate(item.key)}
          className={`tab-item ${location.pathname === item.key ? "active-tab" : ""}`}
        >
          {item.icon}
        </div>
      ))}
    </div>
  );
};

export default MobileNavbar;
