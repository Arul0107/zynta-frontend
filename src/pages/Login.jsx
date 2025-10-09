// src/components/Login.jsx
import React from 'react';
import { Form, Input, Button, Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios'; // ✅ use configured axios
import toast from 'react-hot-toast';
import '../css/Login.css';
import loginImage from '../assets/login.png';
import {
  
  UserOutlined,
  
} from "@ant-design/icons";

const Login = () => {
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      const res = await axios.post('/api/auth/login', {
        username: values.email,
        password: values.password
      });

      const { user, token } = res.data;

      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      localStorage.setItem('token_expiry', Date.now() + 2 * 24 * 60 * 60 * 1000);

      toast.success(`Welcome ${user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error('Invalid credentials');
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-left">
        <Card className="login-card" bordered={false}>
          <h2 className="login-title">Log In  <UserOutlined style={{ background: "#0E2B43", color: "white", padding: "20px",  borderRadius: "50%" }} />

</h2>
          <p className="login-subtitle">Welcome back! Please enter your details</p>
          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item
              name="email"
              label="Email"
              rules={[{ required: true, message: 'Please enter your email' }]}
            >
              <Input placeholder="Enter email" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password placeholder="Enter password" />
            </Form.Item>

            <div className="forgot-password-wrapper">
              <a href="#" className="forgot-password">Forgot password?</a>
            </div>

            <Form.Item>
              <Button type="primary" htmlType="submit" block className="login-button">
                Log in
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>

      <div className="login-right">
        <img src={loginImage} alt="Login visual" className='loginimg' />
      </div>
    </div>
  );
};

export default Login;
