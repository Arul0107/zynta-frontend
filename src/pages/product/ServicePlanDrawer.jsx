// src/components/BrandService/ServicePlanDrawer.jsx
import React, { useEffect, useState } from "react";
import {
  Drawer,
  Form,
  Input,
  InputNumber,
  Switch,
  Button,
  Space,
  Tag,
  List,
  Popconfirm,
} from "antd";
import axios from "../../api/axios";
import toast from "react-hot-toast";

const ServicePlanDrawer = ({ visible, onClose, service, refreshServices }) => {
  const [form] = Form.useForm();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const [features, setFeatures] = useState([]);
  const [featureInput, setFeatureInput] = useState("");

  useEffect(() => {
    if (selectedPlan) {
      form.setFieldsValue({
        name: selectedPlan.name,
        priceMonthly: selectedPlan.priceMonthly,
        priceYearly: selectedPlan.priceYearly,
        priceOneTime: selectedPlan.priceOneTime,
        scriptBased: selectedPlan.scriptBased,
      });
      setFeatures(selectedPlan.features || []);
    } else {
      form.resetFields();
      setFeatures([]);
    }
  }, [selectedPlan]);

  if (!service) return null;

  const addFeature = () => {
    if (!featureInput.trim()) return;
    if (features.find((f) => f.name === featureInput.trim()))
      return toast.error("Feature already added");

    setFeatures([...features, { name: featureInput.trim() }]);
    setFeatureInput("");
  };

  const removeFeature = (name) => {
    setFeatures(features.filter((f) => f.name !== name));
  };

  const resetPlanForm = () => {
    form.resetFields();
    setSelectedPlan(null);
    setFeatures([]);
    onClose();
  };

  const savePlan = async (values) => {
    try {
      setLoading(true);

      const payload = {
        name: values.name,
        priceMonthly: values.priceMonthly || 0,
        priceYearly: values.priceYearly || 0,
        priceOneTime: values.priceOneTime || 0, // ⭐ ADDED
        scriptBased: values.scriptBased || false,
        features,
      };

      if (selectedPlan) {
        await axios.put(
          `/api/service/${service._id}/plans/${selectedPlan._id}`,
          payload
        );
        toast.success("Plan updated");
      } else {
        await axios.post(`/api/service/${service._id}/plans`, payload);
        toast.success("Plan added");
      }

      resetPlanForm();
      refreshServices();
    } catch {
      toast.error("Failed to save plan");
    } finally {
      setLoading(false);
    }
  };

  const deletePlan = async (planId) => {
    try {
      setLoading(true);
      await axios.delete(`/api/service/${service._id}/plans/${planId}`);
      toast.success("Plan deleted");
      resetPlanForm();
      refreshServices();
    } catch {
      toast.error("Failed to delete plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title={`Manage Plans — ${service.serviceName}`}
      width={650}
      open={visible}
      onClose={resetPlanForm}
      destroyOnClose
    >
      <Space style={{ width: "100%", justifyContent: "space-between" }}>
        <h3 style={{ margin: 0 }}>Existing Plans</h3>
        <Button type="primary" onClick={() => setSelectedPlan(null)}>
          New Plan
        </Button>
      </Space>

      <List
        dataSource={service.plans || []}
        bordered
        style={{ margin: "16px 0" }}
        renderItem={(plan) => (
          <List.Item
            actions={[
              <Button size="small" onClick={() => setSelectedPlan(plan)}>
                Edit
              </Button>,
              <Popconfirm
                title="Delete this plan?"
                onConfirm={() => deletePlan(plan._id)}
              >
                <Button danger size="small">Delete</Button>
              </Popconfirm>,
            ]}
          >
            <List.Item.Meta
              title={
                <Space>
                  {plan.name}
                  {plan.scriptBased && (
                    <Tag color="purple">Script Based</Tag>
                  )}
                </Space>
              }
              description={
                <>
                  Monthly: {plan.priceMonthly ? `₹${plan.priceMonthly}` : "-"} |
                  Yearly: {plan.priceYearly ? `₹${plan.priceYearly}` : "-"} |
                  One Time: {plan.priceOneTime ? `₹${plan.priceOneTime}` : "-"} {/* ⭐ ADDED */}
                  <br />
                  {plan.features?.map((f, idx) => (
                    <Tag key={idx}>{f.name}</Tag>
                  ))}
                </>
              }
            />
          </List.Item>
        )}
      />

      <h3>{selectedPlan ? "Edit Plan" : "Create Plan"}</h3>

      <Form layout="vertical" form={form} onFinish={savePlan}>
        <Form.Item name="name" label="Plan Name" rules={[{ required: true }]}>
          <Input placeholder="Basic, Premium, Gold..." />
        </Form.Item>

        <Form.Item name="priceMonthly" label="Monthly Price">
          <InputNumber style={{ width: "100%" }} min={0} />
        </Form.Item>

        <Form.Item name="priceYearly" label="Yearly Price">
          <InputNumber style={{ width: "100%" }} min={0} />
        </Form.Item>

        {/* ⭐ NEW PRICE FIELD */}
        <Form.Item name="priceOneTime" label="One-Time Price">
          <InputNumber style={{ width: "100%" }} min={0} />
        </Form.Item>

        <Form.Item
          name="scriptBased"
          label="Script Based Automation?"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <h4>Features</h4>

        <Space style={{ marginBottom: 10 }}>
          <Input
            placeholder="Enter feature"
            value={featureInput}
            onChange={(e) => setFeatureInput(e.target.value)}
            style={{ width: 280 }}
          />
          <Button type="primary" onClick={addFeature}>
            Add
          </Button>
        </Space>

        <div style={{ marginBottom: 20 }}>
          {features.length ? (
            features.map((f, idx) => (
              <Tag
                key={idx}
                closable
                onClose={() => removeFeature(f.name)}
                style={{ padding: "6px", marginBottom: 5 }}
              >
                {f.name}
              </Tag>
            ))
          ) : (
            <p style={{ opacity: 0.5 }}>No features added</p>
          )}
        </div>

        <Button
          type="primary"
          htmlType="submit"
          block
          loading={loading}
        >
          {selectedPlan ? "Update Plan" : "Add Plan"}
        </Button>
      </Form>
    </Drawer>
  );
};

export default ServicePlanDrawer;
