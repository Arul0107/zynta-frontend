import React, { useEffect, useState } from "react";
import { Card, Spin, Descriptions, Tag, Alert } from "antd";
import axios from "../../api/axios";

const ClientDashboard = () => {
  const [business, setBusiness] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user"));

  const fetchData = async () => {
    try {
      const businessId = user?.businessAccount?._id || user?.businessAccount;
      if (!businessId) throw new Error("No BusinessAccount");

      const res1 = await axios.get(`/api/accounts/${businessId}`);
      setBusiness(res1.data);

      const res2 = await axios.get(`/api/subscriptions/${businessId}`);
      if (res2.data.length > 0) setSubscription(res2.data[0]);
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, []);

  if (loading) return <Spin size="large" style={{ marginTop: 100 }} />;

  if (!business)
    return <Alert type="error" message="No Business Account Linked!" showIcon />;

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 20 }}>Client Dashboard</h2>

      <Card title={business.businessName} bordered>
        <Descriptions bordered column={1} size="middle">

          <Descriptions.Item label="Email">
            {business.contactEmail || "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Phone">
            {business.contactNumber || "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Subscription Status">
            {subscription ? (
              <Tag color={subscription.status === "active" ? "green" : "red"}>
                {subscription.status}
              </Tag>
            ) : (
              <Tag color="red">Not Subscribed</Tag>
            )}
          </Descriptions.Item>

          {subscription && (
            <>
              <Descriptions.Item label="Service">
                {subscription?.service?.serviceName || "-"}
              </Descriptions.Item>

              <Descriptions.Item label="Plan">
                {subscription.planName || "-"}
              </Descriptions.Item>

              <Descriptions.Item label="Billing Cycle">
                {subscription.billingCycle}
              </Descriptions.Item>

              <Descriptions.Item label="Renewal Date">
                {subscription.renewalDate
                  ? new Date(subscription.renewalDate).toLocaleDateString()
                  : "-"}
              </Descriptions.Item>

              <Descriptions.Item label="Amount">
                ₹ {subscription.amountPaid} + GST ({subscription.gstRate}%)
                <br />
                Total: ₹ {subscription.totalWithGST}
              </Descriptions.Item>

              <Descriptions.Item label="Order ID">
                {subscription.orderId}
              </Descriptions.Item>
            </>
          )}

        </Descriptions>
      </Card>
    </div>
  );
};

export default ClientDashboard;
