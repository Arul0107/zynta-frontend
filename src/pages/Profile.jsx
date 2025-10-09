import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Avatar,
  Button,
  Typography,
  Divider,
  Space,
  Tag,
  Row,
  Col,
  Spin,
  Modal,
  Alert,
  Form,
  Input,
  Select,
  Drawer,
} from "antd";
import {
  LogoutOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
  CrownOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  ReloadOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import axios from "../api/axios"; // Ensure this path is correct for your project
import toast from "react-hot-toast"; // Assuming you have react-hot-toast installed

const { Title, Text } = Typography;

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [form] = Form.useForm();

  // Get user ID from localStorage to fetch fresh data
  const getCurrentUserId = () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        return parsedUser._id; // Assuming the user object in localStorage has an _id field
      } catch (error) {
        console.error("Error parsing user data from localStorage:", error);
        localStorage.removeItem("user"); // Clear corrupted data
        return null;
      }
    }
    return null;
  };

  // Fetch user details from API
  const fetchUserDetails = async () => {
    const userId = getCurrentUserId();

    if (!userId) {
      // If no userId is found, navigate to login immediately
      setLoading(false);
      navigate("/login");
      return;
    }

    setLoading(true);
    setError(null); // Clear previous errors

    try {
      const response = await axios.get(`/api/users/${userId}`);
      setUser(response.data);

      // Update localStorage with fresh data
      localStorage.setItem("user", JSON.stringify(response.data));
    } catch (error) {
      console.error("Error fetching user details:", error);
      setError(
        "Failed to load user profile. Please check your network or try again."
      );

      // If API call fails, try to use localStorage data as fallback
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          toast.error(
            "Using cached profile data. Please refresh to get latest information."
          );
        } catch (parseError) {
          console.error("Error parsing fallback user data:", parseError);
          localStorage.removeItem("user"); // Clear corrupted data
          navigate("/login");
        }
      } else {
        // No user ID and no cached data, redirect to login
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetails();
  }, [navigate]); // navigate is a stable reference, so no re-renders on every render

  const handleLogout = () => {
    Modal.confirm({
      title: "Confirm Logout",
      content: "Are you sure you want to logout?",
      okText: "Yes, Logout",
      cancelText: "Cancel",
      okType: "danger",
      onOk: () => {
        localStorage.removeItem("user"); // Clear user session from localStorage
        navigate("/login");
      },
    });
  };

  const getStatusColor = (status) => {
    return status?.toLowerCase() === "active" ? "success" : "error";
  };

  const getStatusIcon = (status) => {
    return status?.toLowerCase() === "active" ? (
      <CheckCircleOutlined />
    ) : (
      <CloseCircleOutlined />
    );
  };

  const getRoleColor = (role) => {
    const colors = {
      superadmin: "red",
      admin: "blue",
      employee: "green",
      user: "green",
      manager: "orange",
      moderator: "purple",
    };
    return colors[role?.toLowerCase()] || "default";
  };

  const handleRefresh = () => {
    fetchUserDetails();
  };

  const openEditDrawer = () => {
    // Ensure user data is available before setting form fields
    if (user) {
      form.setFieldsValue({
        name: user.name,
        email: user.email,
        mobile: user.mobile || "", // Handle cases where mobile might be null or undefined
        role: user.role,
        status: user.status,
      });
      setEditDrawerOpen(true);
    } else {
      toast.error("User data not loaded yet. Please try refreshing.");
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setUpdating(true);
      const values = await form.validateFields(); // Validate form fields

      // Remove password field if empty or not provided
      if (!values.password) {
        delete values.password;
      }

      const response = await axios.put(`/api/users/${user._id}`, values);

      // Update user state with new data from the response
      setUser(response.data);

      // Update localStorage with fresh data
      localStorage.setItem("user", JSON.stringify(response.data));

      toast.success("Profile updated successfully!");
      setEditDrawerOpen(false); // Close the drawer on success
    } catch (error) {
      console.error("Error updating profile:", error);
      // Display a more user-friendly error message
      toast.error(
        error?.response?.data?.message ||
          "Failed to update profile. Please try again."
      );
    } finally {
      setUpdating(false); // End updating state regardless of success or failure
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <Spin size="large" />
        <Typography.Text type="secondary">
          Loading your profile...
        </Typography.Text>
      </div>
    );
  }

  if (error && !user) {
    // Show error card only if there's an error and no user data could be loaded (even from cache)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
          padding: "20px",
        }}
      >
        <Card style={{ maxWidth: "400px", textAlign: "center" }}>
          <Alert
            message="Profile Load Error"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: "16px" }}
          />
          <Space>
            <Button
              type="primary"
                          style={{ backgroundColor: '#0E2B43', borderColor: '#orange', color: 'white' }}

              onClick={handleRefresh}
              icon={<ReloadOutlined />}
            >
              Retry
            </Button>
            <Button onClick={() => navigate("/login")}>Back to Login</Button>
          </Space>
        </Card>
      </div>
    );
  }

  if (!user) {
    // Fallback if somehow user is null after loading and error checks
    return (
      <div
        style={{
          textAlign: "center",
          marginTop: "50px",
          color: "#999",
        }}
      >
        <UserOutlined style={{ fontSize: "48px", marginBottom: "16px" }} />
        <div>Unable to load profile data. Please log in again.</div>
        <Button
          type="primary"
                      style={{ marginTop: "16px",backgroundColor: '#0E2B43', borderColor: '#orange', color: 'white' }}

          onClick={() => navigate("/login")}
        >
          Back to Login
        </Button>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {/* Header Card */}
        <Card
          style={{
            marginBottom: "24px",
            borderRadius: "16px",
            border: "none",
          }}
        >
          <Row align="middle" gutter={24}>
            <Col>
  <Avatar
    size={80}
    style={{
      backgroundColor: "#0E2B43",
      fontSize: "32px",
    }}
  >
    {user.name ? user.name.charAt(0).toUpperCase() : <UserOutlined />}
  </Avatar>
</Col>
            <Col flex={1}>
              <Title level={2} style={{ margin: 0, color: "#0E2B43" }}>
                {user.name}
              </Title>
              <Text type="secondary" style={{ fontSize: "16px" }}>
                Welcome back to your profile
              </Text>
            </Col>
            <Col>
              <Space>
                <Button
                  type="default"
                  icon={<ReloadOutlined />}
                  size="large"
                  onClick={handleRefresh}
                  style={{ borderRadius: "8px" }}
                  title="Refresh Profile"
                />
                <Button
                  type="default"
                  icon={<EditOutlined />}
                  size="large"
                  onClick={openEditDrawer}
                  style={{ borderRadius: "8px" }}
                >
                  Edit Profile
                </Button>
               
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Profile Details Card */}
        <Card
          title={
            <Space>
              <IdcardOutlined />
              <span>Profile Information</span>
            </Space>
          }
          style={{
            borderRadius: "16px",
            border: "none",
          }}
          headStyle={{
            borderBottom: "2px solid #f0f0f0",
            fontSize: "18px",
            fontWeight: "600",
          }}
        >
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12}>
              <div style={{ marginBottom: "20px" }}>
                <Text strong style={{ color: "#666", fontSize: "14px" }}>
                  FULL NAME
                </Text>
                <div
                  style={{
                    marginTop: "4px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <UserOutlined
                    style={{ marginRight: "8px", color: "#0E2B43" }}
                  />
                  <Text style={{ fontSize: "16px" }}>{user.name}</Text>
                </div>
              </div>
            </Col>

            <Col xs={24} sm={12}>
              <div style={{ marginBottom: "20px" }}>
                <Text strong style={{ color: "#666", fontSize: "14px" }}>
                  EMAIL ADDRESS
                </Text>
                <div
                  style={{
                    marginTop: "4px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <MailOutlined
                    style={{ marginRight: "8px", color: "#52c41a" }}
                  />
                  <Text style={{ fontSize: "16px" }}>{user.email}</Text>
                </div>
              </div>
            </Col>

            <Col xs={24} sm={12}>
              <div style={{ marginBottom: "20px" }}>
                <Text strong style={{ color: "#666", fontSize: "14px" }}>
                  MOBILE NUMBER
                </Text>
                <div
                  style={{
                    marginTop: "4px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <PhoneOutlined
                    style={{ marginRight: "8px", color: "#52c41a" }}
                  />
                  <Text style={{ fontSize: "16px" }}>
                    {user.mobile || "Not provided"}
                  </Text>
                  {user.mobile && (
                    <Tag
                      color="success"
                      size="small"
                      style={{ marginLeft: "8px", borderRadius: "4px" }}
                    >
                      Verified
                    </Tag>
                  )}
                </div>
              </div>
            </Col>

            <Col xs={24} sm={12}>
              <div style={{ marginBottom: "20px" }}>
                <Text strong style={{ color: "#666", fontSize: "14px" }}>
                  ROLE
                </Text>
                <div style={{ marginTop: "4px" }}>
                  <Tag
                    icon={<CrownOutlined />}
                    color={getRoleColor(user.role)}
                    style={{
                      fontSize: "14px",
                      padding: "4px 12px",
                      borderRadius: "6px",
                      textTransform: "capitalize",
                    }}
                  >
                    {user.role}
                  </Tag>
                </div>
              </div>
            </Col>

            <Col xs={24} sm={12}>
              <div style={{ marginBottom: "20px" }}>
                <Text strong style={{ color: "#666", fontSize: "14px" }}>
                  STATUS
                </Text>
                <div style={{ marginTop: "4px" }}>
                  <Tag
                    icon={getStatusIcon(user.status)}
                    color={getStatusColor(user.status)}
                    style={{
                      fontSize: "14px",
                      padding: "4px 12px",
                      borderRadius: "6px",
                      textTransform: "capitalize",
                    }}
                  >
                    {user.status}
                  </Tag>
                </div>
              </div>
            </Col>
          </Row>

          <Divider />

          <div style={{ textAlign: "center", paddingTop: "16px" }}>
            <Space direction="vertical" size={4}>
              <Text type="secondary" style={{ fontSize: "14px" }}>
                Profile last updated:{" "}
                {user.updatedAt
                  ? new Date(user.updatedAt).toLocaleString()
                  : new Date().toLocaleDateString()}
              </Text>
              {error && (
                <Alert
                  message="Some data may be outdated"
                  type="warning"
                  size="small"
                  showIcon
                  style={{ marginTop: "8px" }}
                />
              )}
            </Space>
          </div>
        </Card>

        {/* Edit Profile Drawer */}
        <Drawer
          title={
            <Space>
              <EditOutlined />
              <span>Edit Profile</span>
            </Space>
          }
          open={editDrawerOpen}
          onClose={() => setEditDrawerOpen(false)}
          width={480}
          destroyOnClose
          extra={
            <Space>
              <Button onClick={() => setEditDrawerOpen(false)}>Cancel</Button>
              <Button
                type="primary"
                            style={{ backgroundColor: '#0E2B43', borderColor: '#orange', color: 'white' }}

                icon={<SaveOutlined />}
                loading={updating}
                onClick={handleUpdateProfile}
              >
                Save Changes
              </Button>
            </Space>
          }
        >
          <Form form={form} layout="vertical" requiredMark="optional">
            <Form.Item
              name="name"
              label="Full Name"
              rules={[
                { required: true, message: "Please enter full name" },
                { min: 2, message: "Name must be at least 2 characters" },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Enter full name"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email Address"
              rules={[
                { required: true, message: "Please enter email address" },
                { type: "email", message: "Please enter a valid email" },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="Enter email address"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="mobile"
              label="Mobile Number"
              rules={[
                {
                  pattern: /^[0-9]{10}$/,
                  message: "Please enter a valid 10-digit mobile number",
                },
              ]}
            >
              <Input
                prefix={<PhoneOutlined />}
                placeholder="Enter mobile number"
                size="large"
                style={{ color: "#52c41a" }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="New Password (Optional)"
              rules={[
                { min: 6, message: "Password must be at least 6 characters" },
              ]}
            >
              <Input.Password
                placeholder="Leave blank to keep current password"
                size="large"
              />
            </Form.Item>

            <Form.Item name="role" label="Role">
              <Select
                placeholder="Select role"
                size="large"
                disabled={user?.role !== "Superadmin"}
                suffixIcon={<CrownOutlined />}
              >
                <Select.Option value="Superadmin">
                  <Space>
                    <CrownOutlined style={{ color: "#ff4d4f" }} />
                    <span>Superadmin</span>
                  </Space>
                </Select.Option>
                <Select.Option value="Admin">
                  <Space>
                    <CrownOutlined style={{ color: "#0E2B43" }} />
                    <span>Admin</span>
                  </Space>
                </Select.Option>
                <Select.Option value="Employee">
                  <Space>
                    <CrownOutlined style={{ color: "#52c41a" }} />
                    <span>Employee</span>
                  </Space>
                </Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="status" label="Status">
              <Select
                placeholder="Select status"
                size="large"
                disabled={user?.role !== "Superadmin"}
              >
                <Select.Option value="Active">
                  <Space>
                    <CheckCircleOutlined style={{ color: "#52c41a" }} />
                    <span>Active</span>
                  </Space>
                </Select.Option>
                <Select.Option value="Inactive">
                  <Space>
                    <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
                    <span>Inactive</span>
                  </Space>
                </Select.Option>
              </Select>
            </Form.Item>

            <Alert
              message="Profile Update"
              description={
                user?.role !== "Superadmin"
                  ? "Role and Status can only be changed by Superadmin users."
                  : "You can update all profile fields including role and status."
              }
              type="info"
              showIcon
              style={{ marginTop: "16px" }}
            />
          </Form>
        </Drawer>
      </div>
    </div>
  );
};

export default Profile;
