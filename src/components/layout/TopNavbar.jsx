import { Avatar, Dropdown, Menu, Space } from 'antd';
import {
  LogoutOutlined,
  SettingOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import logoExpanded from "../../assets/vrism.png";
import './TopNavbar.css';

const TopNavbar = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleProfile = () => {
    navigate('/profile');
  };  

  const handleSettings = () => {
    navigate('/settings');
  };

  const menu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />} onClick={handleProfile}>
        Profile
      </Menu.Item>
      {/* <Menu.Item key="settings" icon={<SettingOutlined />} onClick={handleSettings}>
        Settings
      </Menu.Item> */}
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
      {/* Show logo only on mobile */}
      <div className="mobile-logo-wrapper" onClick={() => setCollapsed(!collapsed)}>
        <img src={logoExpanded} alt="logo" className="moblelogo" />
      </div>

      {/* Avatar (always in the same right-hand position) */}
      <Space>
        <Dropdown overlay={menu} placement="bottomRight" arrow>
          <Avatar
            style={{
              backgroundColor: '#1677ff',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            {getInitial()}
          </Avatar>
        </Dropdown>
      </Space>
    </div>
  );
};

export default TopNavbar;
