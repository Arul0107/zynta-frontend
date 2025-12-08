import React, { useEffect } from "react";
import { Drawer, Form, Input, InputNumber, Switch, Button } from "antd";
import axios from "../../api/axios";
import toast from "react-hot-toast";

const BrandServiceForm = ({ visible, onClose, initialValues, onSave }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (!initialValues) form.resetFields();
    else form.setFieldsValue(initialValues);
  }, [initialValues]);

  const handleSubmit = async (values) => {
    try {
      if (initialValues?._id) {
        await axios.put(`/api/service/${initialValues._id}`, values);
        toast.success("Service updated");
      } else {
        await axios.post("/api/service", values);
        toast.success("Service created");
      }
      onSave();
      onClose();
    } catch {
      toast.error("Failed to save");
    }
  };

  return (
    <Drawer
      open={visible}
      width={500}
      onClose={onClose}
      title={initialValues ? "Edit Service" : "Add Service"}
    >
      <Form layout="vertical" form={form} onFinish={handleSubmit}>
        <Form.Item name="serviceName" label="Service Name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item name="category" label="Category">
          <Input />
        </Form.Item>

        <Form.Item name="basePrice" label="Base Price">
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <Input.TextArea rows={3} />
        </Form.Item>

        <Form.Item name="isActive" label="Active" valuePropName="checked">
          <Switch defaultChecked />
        </Form.Item>

        <Button type="primary" htmlType="submit" block>
          {initialValues ? "Update" : "Create"}
        </Button>
      </Form>
    </Drawer>
  );
};

export default BrandServiceForm;
