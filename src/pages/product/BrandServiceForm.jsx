import React, { useEffect } from 'react';
import {
  Drawer, Form, Input, Button, Space, Row, Col, Switch
} from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import axios from '../../api/axios';
import toast from 'react-hot-toast';

const BrandServiceForm = ({ visible, onClose, onSave, initialValues }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && initialValues) {
      form.setFieldsValue({
        ...initialValues,
        options: initialValues.options || []
      });
    } else {
      form.resetFields();
    }
  }, [visible, initialValues]);

  const handleSubmit = async (values) => {
    // Strip backend-managed IDs
    const { service_id, _id, ...rest } = values;

    const payload = {
      ...rest,
      basePrice: Number(rest.basePrice) || 0,
      options: (rest.options || []).filter(opt => opt?.type?.trim() && opt?.description?.trim())
    };

    try {
      if (initialValues?._id) {
        await axios.put(`/api/service/${initialValues._id}`, payload);
        toast.success('Service updated');
      } else {
        await axios.post('/api/service', payload);
        toast.success('Service added');
      }
      onSave();
      onClose();
    } catch (err) {
      toast.error('Failed to save service');
      console.error(err?.response?.data || err.message);
    }
  };

  return (
    <Drawer
      title={initialValues ? 'Edit Service' : 'Add Service'}
      open={visible}
      onClose={onClose}
      width={640}
      destroyOnClose
    >
      <Form layout="vertical" form={form} onFinish={handleSubmit}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="serviceName"
              label="Service Name"
              rules={[{ required: true, message: 'Enter service name' }]}
            >
              <Input placeholder="Service name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="basePrice"
              label="Base Price (INR)"
              rules={[{ required: true, message: 'Enter base price' }]}
            >
              <Input type="number" placeholder="Base price" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="category"
              label="Category"
              placeholder="e.g., Social Media, Brand Campaign"
            >
              <Input placeholder="Category" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="hsnSac"
              label="HSN/SAC"
            >
              <Input placeholder="HSN/SAC Code (optional)" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="description" label="Description">
          <Input.TextArea rows={2} placeholder="Service description" />
        </Form.Item>

        <Form.List name="options">
          {(fields, { add, remove }) => (
            <>
              <label style={{ fontWeight: 600 }}>Service Packages / Options</label>
              {fields.map(({ key, name }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="start">
                  <Form.Item
                    name={[name, 'type']}
                    rules={[{ required: true, message: 'Enter type' }]}
                  >
                    <Input placeholder="Type (e.g., Campaign Package)" />
                  </Form.Item>
                  <Form.Item
                    name={[name, 'description']}
                    rules={[{ required: true, message: 'Enter description' }]}
                  >
                    <Input placeholder="Description" />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Form.Item>
                <Button onClick={() => add()} icon={<PlusOutlined />}>
                  Add Option
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        <Form.Item name="isActive" label="Active" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            style={{ backgroundColor: '#0E2B43', borderColor: '#0E2B43', color: 'white' }}
            htmlType="submit"
            block
          >
            {initialValues ? 'Update' : 'Create'}
          </Button>
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default BrandServiceForm;
