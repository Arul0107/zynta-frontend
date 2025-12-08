// File: src/pages/master/CardMaster.jsx

import React from "react";
import { useNavigate } from "react-router-dom";
import "./cardMaster.css";
import * as Icons from "@ant-design/icons";
import { Card } from "antd";

export default function CardMaster() {
  const user = JSON.parse(localStorage.getItem("user") || '{"role": "user"}');
  const navigate = useNavigate();
const routeCards = [
  {
    path: "/dashboard",
    title: "Dashboard",
    icon: <Icons.DashboardOutlined />,
    roles: ["Admin", "Superadmin", "Employee", "Team Leader"],
  },

  // APPLICATION SECTION
  {
    path: "/leads",
    title: "Leads",
    icon: <Icons.SolutionOutlined />,
    roles: ["Admin", "Superadmin", "Team Leader"],
  },
  {
    path: "/clients",
    title: "Clients",
    icon: <Icons.UserOutlined />,
    roles: ["Admin", "Superadmin", "Team Leader"],
  },
  {
    path: "/products",
    title: "Products",
    icon: <Icons.AppstoreOutlined />,
    roles: ["Admin", "Superadmin", "Team Leader"],
  },
  {
    path: "/quotation",
    title: "Quotations",
    icon: <Icons.FileTextOutlined />,
    roles: ["Admin", "Superadmin", "Team Leader"],
  },

  // PERSONAL SECTION
  {
    path: "/taskmanage",
    title: "Tasks",
    icon: <Icons.FolderOpenOutlined />,
    roles: ["Admin", "Superadmin", "Team Leader", "Employee"],
  },
  {
    path: "/wallets",
    title: "Wallets",
    icon: <Icons.WalletOutlined />,
    roles: ["Admin", "Superadmin", "Team Leader", "Employee"],
  },
  {
    path: "/chat",
    title: "Chat",
    icon: <Icons.MessageOutlined />,
    roles: ["Admin", "Superadmin", "Team Leader", "Employee"],
  },
  {
    path: "/attendance",
    title: "Attendance",
    icon: <Icons.ClockCircleOutlined />,
    roles: ["Admin", "Superadmin", "Team Leader", "Employee"],
  },
  {
    path: "/master",
    title: "Master",
    icon: <Icons.SecurityScanOutlined />,
    roles: ["Admin", "Superadmin", "Team Leader", "Employee"],
  },

  // OTHER
  {
    path: "/settings",
    title: "Settings",
    icon: <Icons.SettingOutlined />,
    roles: ["Admin", "Superadmin", "Team Leader", "Employee"],
  },
  {
    path: "/profile",
    title: "Profile",
    icon: <Icons.UserSwitchOutlined />,
    roles: ["Superadmin", "Admin", "Employee", "Team Leader"],
  },

  // SUPERADMIN ONLY
  {
    path: "/management",
    title: "User Management",
    icon: <Icons.TeamOutlined />,
    roles: ["Superadmin"],
  },
];


  // Filter cards based on user role
  const visibleCards = routeCards.filter((card) => {
    if (card.roles === "all") return true;
    return Array.isArray(card.roles) && card.roles.includes(user.role);
  });

  return (
    <div className="master-wrapper">
      <h2 className="master-title">App Modules</h2>

      <div className="master-grid">
        {visibleCards.map((card) => (
          <Card
            key={card.path}
            hoverable
            className={`master-card card-${card.title
              .toLowerCase()
              .replace(/\s/g, "-")}`}
            onClick={() => navigate(card.path)}
          >
            <div className="thumb-icon">{card.icon}</div>
            <div className="thumb-title">{card.title}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
