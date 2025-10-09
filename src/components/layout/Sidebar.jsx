// File: src/components/Sidebar.jsx

import { Menu } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  FileTextOutlined,
  FileAddOutlined,
  UsergroupAddOutlined,
  ShoppingOutlined,
  SolutionOutlined,
  AppstoreOutlined,
  SettingOutlined,
  UserSwitchOutlined,
  TableOutlined,
  FileWordOutlined,
  PartitionOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import './sidebar.css';

import logoCollapsed from "../../assets/vrismsmall.png";
import logoExpanded from "../../assets/vrism.png";

const Sidebar = ({ collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const selectedKey = "/" + location.pathname.split("/")[1];

  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;

  const rawMenuItems = [
    {
      key: "main-menu",
      type: "group",
      label: collapsed ? null : "",
      children: [
        {
          key: "/dashboard",
          icon: <DashboardOutlined />,
          label: collapsed ? null : "Dashboard",
          roles: ["Admin", "Superadmin", "Employee", "Team Leader"],
          children: [
            {
              key: "/dashboard/deals",
              label: "Leads Dashboard",
              roles: ["Admin", "Superadmin"],
            },
            {
              key: "/taskmanage",
              label: "Task Dashboard",
              roles: ["Admin", "Superadmin", "Team Leader", "Employee"],
            },
            {
              key: "/eodreport",
              label: "EOD Report",
              roles: ["Admin", "Superadmin", "Team Leader", "Employee"],
            },
            {
              key: "/attendance",
              label: "Leads Dashboard",
              roles: ["Admin", "Superadmin", "Team Leader", "Employee"],
            },
          ],
        },
        {
          key: "/application",
          icon: <AppstoreOutlined />,
          label: collapsed ? null : "Application",
          roles: ["Admin", "Superadmin", "Team Leader", "Employee"],
          children: [
            {
              key: "/leads",
              icon: <SolutionOutlined />,
              label: "Leads",
              roles: ["Admin",  "Superadmin", ],
            },
            {
              key: "/customers",
              icon: <UserOutlined />,
              label: "Customers",
              roles: ["Admin", "Superadmin", ],
            },
            {
              key: "/quotation",
              icon: <FileTextOutlined />,
              label: "Quotations",
              roles: ["Admin", "Superadmin", ],
            },
            {
              key: "/products",
              icon: <FileAddOutlined />,
              label: "Products",
              roles: ["Admin", "Superadmin", ],
            },
          ],
        },
        {
          key: "/super-admin",
          icon: <UserSwitchOutlined />,
          label: collapsed ? null : "User Manage",
          roles: ["Superadmin", "Admin", "Employee", "Team Leader"],
          children: [
            {
              key: "/management",
              icon: <UsergroupAddOutlined />,
              label: "User Management",
              roles: ["Superadmin"],
            },
            {
              key: "/profile",
              icon: <UserOutlined />,
              label: "Profile",
              roles: ["Superadmin", "Admin", "Employee", "Team Leader"],
            },
          ],
        },
      ],
    },
  ];

  const filterByRole = (items) => {
    return items
      .map((item) => {
        if (item.children) {
          const filteredChildren = filterByRole(item.children);
          if (filteredChildren.length > 0 && (!item.roles || item.roles.includes(role))) {
            return { ...item, children: filteredChildren };
          }
          return null;
        } else {
          return (!item.roles || item.roles.includes(role)) ? item : null;
        }
      })
      .filter(Boolean);
  };

  const menuItems = filterByRole(rawMenuItems);

  const handleMenuClick = ({ key }) => {
    const isLeafNode = !menuItems.some((group) =>
      group.children?.some((item) => item.key === key && item.children)
    );

    if (isLeafNode) {
      navigate(key);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        height: "100vh",
        overflowY: "auto",
        background: "#fafafa",
      }}
    >
      <div
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "white",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <img
          src={collapsed ? logoCollapsed : logoExpanded}
          alt="Logo"
          style={{
            padding: 10,
            height: "auto",
            width: collapsed ? 59 : 170,
            transition: "all 0.3s",
          }}
        />
      </div>

      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        defaultOpenKeys={["/dashboard", "/application", "/super-admin"]}
        onClick={handleMenuClick}
        style={{
          height: "calc(100% - 64px)",
          borderRight: 0,
        }}
        items={menuItems}
        theme="light"
        inlineCollapsed={collapsed}
      />
    </div>
  );
};

export default Sidebar;