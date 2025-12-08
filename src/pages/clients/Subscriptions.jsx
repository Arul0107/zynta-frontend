import React, { useEffect, useState } from "react";
import {
  Card,
  Spin,
  Tag,
  Alert,
  Empty,
  Table,
  Descriptions,
  Drawer,
  List,
  Button,
} from "antd";
import axios from "../../api/axios";

const SubscriptionPage = () => {
  const [business, setBusiness] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [details, setDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));

  const fetchData = async () => {
    try {
      const businessId =
        user?.businessAccount?._id || user?.businessAccount;

      if (!businessId) throw new Error("No BusinessAccount");

      const accRes = await axios.get(`/api/accounts/${businessId}`);
      setBusiness(accRes.data);

      const subRes = await axios.get(`/api/subscriptions/${businessId}`);
      setSubscriptions(subRes.data);
    } catch (error) {
      console.error("Subscription Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, []);

  // Fetch Subscription Details by ID
  const fetchSubscriptionDetails = async (subId) => {
    setLoadingDetails(true);
    try {
      const res = await axios.get(`/api/subscriptions/details/${subId}`);
      setDetails(res.data);
      setDrawerOpen(true);
    } catch (err) {
      console.error("Fetch Details Error:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const columns = [
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => (
        <Tag color={status === "active" ? "green" : "red"}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Service",
      render: (_, record) => record?.service?.serviceName || "-",
    },
    {
      title: "Plan",
      dataIndex: "planName",
    },
    {
      title: "Billing Cycle",
      dataIndex: "billingCycle",
    },
    {
      title: "Renewal Date",
      dataIndex: "renewalDate",
      render: (v) => (v ? new Date(v).toLocaleDateString() : "-"),
    },
    {
      title: "Amount",
      render: (_, record) =>
        `₹${record.amountPaid} + GST(${record.gstRate}%) = ₹${record.totalWithGST}`,
    },
    {
      title: "Order ID",
      dataIndex: "orderId",
      render: (v) => <Tag color="gold">{v}</Tag>,
    },
    {
      title: "Action",
      render: (_, row) => (
        <Button
          size="small"
          type="primary"
          onClick={() => fetchSubscriptionDetails(row._id)}
        >
          View
        </Button>
      ),
    },
  ];

  if (loading)
    return (
      <Spin
        size="large"
        style={{
          marginTop: 100,
          display: "flex",
          justifyContent: "center",
        }}
      />
    );

  if (!business)
    return (
      <Alert
        type="error"
        message="No Business Account Linked!"
        showIcon
      />
    );

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 20 }}>My Subscription</h2>

      {/* Business Information */}
      <Card title="Business Details" style={{ marginBottom: 20 }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Business Name">
            {business.businessName || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Phone">
            {business.contactNumber || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            {business.contactEmail || "-"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Subscription Table */}
      <Card title="Subscription Details">
        {subscriptions.length === 0 ? (
          <Empty description="No Subscription Found" />
        ) : (
          <Table
            bordered
            dataSource={subscriptions}
            columns={columns}
            rowKey="_id"
            pagination={false}
          />
        )}
      </Card>

      {/* Drawer: Subscription Detailed View */}
      <Drawer
        width={500}
        title="Subscription Details"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        {loadingDetails || !details ? (
          <Spin />
        ) : (
          <>
            

            <h3 style={{ marginTop: 20 }}>Features Included</h3>
            <List
              bordered
              dataSource={details.planFeatures}
              renderItem={(f) => <List.Item>{f.name}</List.Item>}
              locale={{ emptyText: "No features found" }}
            />
          </>
        )}
      </Drawer>
    </div>
  );
};

export default SubscriptionPage;
