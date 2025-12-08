import React, { useEffect, useState } from "react";
import {
  Card,
  Form,
  Select,
  InputNumber,
  Button,
  message,
} from "antd";
import axios from "../../api/axios";

const { Option } = Select;

const CreateSubscription = () => {
  const [accounts, setAccounts] = useState([]);
  const [services, setServices] = useState([]);
  const [plans, setPlans] = useState([]);

  const [loading, setLoading] = useState(false);

  const fetchDropdowns = async () => {
    try {
      const [a, s] = await Promise.all([
        axios.get("/api/accounts"),
        axios.get("/api/service"),
      ]);

      setAccounts(a.data);
      setServices(s.data);
    } catch (err) {
      message.error("Failed to load required data");
    }
  };

  const handleServiceSelect = (serviceId) => {
    const selected = services.find((x) => x._id === serviceId);
    setPlans(selected?.plans || []);
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);

      const payload = {
        businessAccount: values.businessAccount,
        service: values.service,
        planId: values.plan, // 🔥 FIXED
        billingCycle: values.billingCycle,
        amountPaid: values.amountPaid, // 🔥 Required — already correct
        gstRate: 18,
        orderId: "MANUAL-" + Date.now(),
        paymentId: "MANUAL-PAY-" + Date.now(),
      };

      await axios.post("/api/subscriptions", payload);

      message.success("Subscription Created Successfully!");
    } catch (err) {
      message.error(
        err?.response?.data?.message || "Error creating subscription"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <Card title="➕ Add Manual Subscription" bordered>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Business Account"
            name="businessAccount"
            rules={[{ required: true }]}
          >
            <Select placeholder="Select Business">
              {accounts.map((acc) => (
                <Option key={acc._id} value={acc._id}>
                  {acc.businessName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Service"
            name="service"
            rules={[{ required: true }]}
          >
            <Select
              placeholder="Select Service"
              onChange={handleServiceSelect}
            >
              {services.map((srv) => (
                <Option key={srv._id} value={srv._id}>
                  {srv.serviceName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Plan" name="plan" rules={[{ required: true }]}>
            <Select placeholder="Select Plan">
              {plans.map((p) => (
                <Option key={p._id} value={p._id}>
                  {p.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Billing Cycle"
            name="billingCycle"
            rules={[{ required: true }]}
          >
            <Select placeholder="Select Billing Cycle">
              <Option value="Monthly">Monthly</Option>
              <Option value="One Time">One Time</Option>
              <Option value="Yearly">Yearly</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Amount Paid (₹)"
            name="amountPaid"
            rules={[{ required: true }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={loading}>
            Save Subscription
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default CreateSubscription;
