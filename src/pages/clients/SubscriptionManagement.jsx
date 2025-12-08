import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Button,
  Drawer,
  Form,
  Select,
  InputNumber,
  Row,
  Col,
  Divider,
} from "antd";
import axios from "../../api/axios";
import toast from "react-hot-toast";

const { Option } = Select;

const SubscriptionManagement = () => {
  const [subs, setSubs] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [businesses, setBusinesses] = useState([]);
  const [services, setServices] = useState([]);
  const [plans, setPlans] = useState([]);
  const [planPrice, setPlanPrice] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // ⬇ Load All Required Data
  const loadPageData = async () => {
    try {
      const [subRes, accRes, srvRes] = await Promise.all([
        axios.get("/api/subscriptions/all"),
        axios.get("/api/accounts"),
        axios.get("/api/service"),
      ]);

      setSubs(subRes.data);
      setBusinesses(accRes.data);
      setServices(srvRes.data);
    } catch (err) {
      toast.error("Failed to load data 🚫");
    }
  };

  useEffect(() => {
    loadPageData();
  }, []);

  // ⬇ Load Plans when Service Changes
  const handleServiceSelect = (id) => {
    const s = services.find((x) => x._id === id);
    setPlans(s?.plans || []);
    form.setFieldsValue({ planId: null });
    setPlanPrice(0);
    setTotalAmount(0);
  };

  const getGST = (serviceId) => {
    const srv = services.find((s) => s._id === serviceId);
    const rate = Number(srv?.gstRate);
    return rate > 0 ? rate : 18;
  };

  const calculatePrice = (plan, cycle) => {
    if (!plan || !cycle) return;

    let price = 0;
    if (cycle === "Monthly") price = plan.priceMonthly || 0;
    else if (cycle === "Yearly") price = plan.priceYearly || 0;
    else if (cycle === "One Time") price = plan.priceOneTime || 0;

    const serviceId = form.getFieldValue("service");
    const gstRate = getGST(serviceId);
    const gst = (price * gstRate) / 100;

    setPlanPrice(price);
    setTotalAmount(price + gst);
    form.setFieldsValue({ amountPaid: price });
  };

  const handlePlanSelect = (id) => {
    const plan = plans.find((p) => p._id === id);
    const cycle = form.getFieldValue("billingCycle");
    calculatePrice(plan, cycle);
  };

  // ⬇ Create Subscription
  const createSubscription = async (values) => {
    try {
      setLoading(true);

      const gstRate = getGST(values.service);

      const payload = {
        businessAccount: values.businessAccount,
        service: values.service,
        planId: values.planId,
        billingCycle: values.billingCycle,
        amountPaid: values.amountPaid,
        gstRate,
        orderId: "MANUAL-" + Date.now(),
        paymentId: "MANUAL-" + Date.now(),
      };

      await axios.post("/api/subscriptions", payload);

      toast.success("Subscription Created ✔");

      form.resetFields();
      setDrawerOpen(false);
      loadPageData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed ❌");
    } finally {
      setLoading(false);
    }
  };

  // 📌 UI Table Columns
  const columns = [
    {
      title: "Business",
      render: (_, r) => r.businessAccount?.businessName || "-",
    },
    {
      title: "Service",
      render: (_, r) => r.service?.serviceName || "-",
    },
    {
      title: "Plan",
      dataIndex: "planName",
    },
    {
      title: "Billing",
      dataIndex: "billingCycle",
    },
    {
      title: "Renewal",
      dataIndex: "renewalDate",
      render: (v) =>
        v ? new Date(v).toLocaleDateString() : "-",
    },
    {
      title: "Amount",
      render: (r) =>
        `₹${r.amountPaid} + GST(${r.gstRate}%) = ₹${r.totalWithGST}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (v) => (
        <Tag color={v === "active" ? "green" : "red"}>
          {v.toUpperCase()}
        </Tag>
      ),
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <h2>Subscription Management</h2>

      <Button
        type="primary"
        onClick={() => setDrawerOpen(true)}
        style={{ marginBottom: 10 }}
      >
        ➕ Create Subscription
      </Button>

      <Table bordered columns={columns} dataSource={subs} rowKey="_id" />

      {/* Drawer UI */}
      <Drawer
        title="Create Subscription"
        width={480}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        destroyOnClose
      >
        <Form layout="vertical" form={form} onFinish={createSubscription}>
          <Row gutter={15}>
            <Col span={24}>
              <Form.Item
                name="businessAccount"
                label="Business Account"
                rules={[{ required: true }]}
              >
                <Select showSearch placeholder="Select Business">
                  {businesses.map((b) => (
                    <Option key={b._id} value={b._id}>
                      {b.businessName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item name="service" label="Service" rules={[{ required: true }]}>
                <Select placeholder="Select Service" onChange={handleServiceSelect}>
                  {services.map((s) => (
                    <Option key={s._id} value={s._id}>
                      {s.serviceName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item name="planId" label="Plan" rules={[{ required: true }]}>
                <Select placeholder="Select Plan" onChange={handlePlanSelect}>
                  {plans.map((p) => (
                    <Option key={p._id} value={p._id}>
                      {p.name} — M:₹{p.priceMonthly} | Y:₹{p.priceYearly} |
                      1T:₹{p.priceOneTime}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Divider />

            <Col span={12}>
              <b>Plan Price:</b>
              <p>₹{planPrice}</p>
            </Col>

            <Col span={12}>
              <b>Total (Incl GST):</b>
              <p style={{ color: "green" }}>₹{totalAmount}</p>
            </Col>

            <Col span={24}>
              <Form.Item name="billingCycle" label="Billing Cycle" rules={[{ required: true }]}>
                <Select
                  onChange={(cycle) => {
                    const plan = plans.find(
                      (p) => p._id === form.getFieldValue("planId")
                    );
                    calculatePrice(plan, cycle);
                  }}
                >
                  <Option value="Monthly">Monthly</Option>
                  <Option value="One Time">One Time</Option>
                  <Option value="Yearly">Yearly</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item name="amountPaid" label="Amount Paid (₹)" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Button type="primary" htmlType="submit" block loading={loading}>
                Confirm & Create ✔
              </Button>
            </Col>
          </Row>
        </Form>
      </Drawer>
    </div>
  );
};

export default SubscriptionManagement;
