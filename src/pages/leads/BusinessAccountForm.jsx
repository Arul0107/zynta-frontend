import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  Drawer,
  Row,
  Col,
  InputNumber,
  Select,
  Spin,
  Typography,
} from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { toast } from "react-hot-toast";
import axios from "../../api/axios";

const { TextArea } = Input;
const { Option } = Select;
const { Title } = Typography;

const BusinessAccountForm = ({
  visible,
  onClose,
  initialValues,
  allUsers = [],
  loadingUsers = false,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [servicePlans, setServicePlans] = useState([]);

  // Load Services from API
  useEffect(() => {
    if (!visible) return;
    setLoadingProducts(true);
    axios
      .get("/api/service")
      .then((res) => setProducts(res.data))
      .catch(() => toast.error("Failed to load services"))
      .finally(() => setLoadingProducts(false));
  }, [visible]);

  // Set initial values for editing
  useEffect(() => {
    if (!initialValues) {
      form.resetFields();
      form.setFieldsValue({
        sourceType: "Direct",
        status: "Active",
        billingCycle: "Monthly",
        totalPrice: 0,
        country: "INDIA"
      });
      return;
    }

    form.setFieldsValue({
      ...initialValues,
      selectedService: initialValues.selectedService?._id,
      selectedPlan: initialValues.selectedPlan || null,
      assignedTo: initialValues.assignedTo?._id || null
    });

    if (initialValues.selectedService) {
      const service = initialValues.selectedService;
      setServicePlans(service.plans || []);
    }
  }, [initialValues]);

  // Price Calculation
  const calculatePrice = () => {
    const serviceId = form.getFieldValue("selectedService");
    const planId = form.getFieldValue("selectedPlan");
    const cycle = form.getFieldValue("billingCycle");

    if (!serviceId || !planId || !cycle) return;

    const srv = products.find((s) => s._id === serviceId);
    const plan = srv?.plans.find((p) => p._id === planId);
    if (!plan) return;
let price = 0;

if (cycle === "Monthly") {
  price = plan.priceMonthly;
} else if (cycle === "Yearly") {
  price = plan.priceYearly;
} else if (cycle === "One Time") {
  price = plan.priceOneTime;
}

    const gst = (price * (srv.gstRate || 0)) / 100;
    form.setFieldValue("totalPrice", Math.round(price + gst));
  };

  // Service Change
  const handleServiceChange = (serviceId) => {
    const service = products.find((p) => p._id === serviceId);
    form.setFieldsValue({
      selectedPlan: null,
      billingCycle: "Monthly",
      totalPrice: 0,
    });
    setServicePlans(service?.plans || []);
  };

  // Submit Data
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const method = initialValues?._id ? "put" : "post";
      const url = initialValues?._id
        ? `/api/accounts/${initialValues._id}`
        : `/api/accounts`;

      await axios[method](url, values);

      toast.success(
        initialValues?._id ? "Account updated!" : "Account created!"
      );

      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title={initialValues ? "Edit Business Account" : "Create Business Account"}
      width={900}
      onClose={onClose}
      open={visible}
      styles={{ body: { paddingBottom: 80 } }}
      footer={
        <div style={{ textAlign: "right" }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            loading={loading}
            onClick={handleSubmit}
            style={{ backgroundColor: "#0E2B43", borderColor: "orange" }}
          >
            {initialValues ? "Update" : "Create"}
          </Button>
        </div>
      }
    >
      <Spin spinning={loadingUsers || loadingProducts}>
        <Form form={form} layout="vertical">

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="businessName"
                label="Business Name"
                rules={[{ required: true }]}
              >
                <Input placeholder="Enter Business Name" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="gstNumber" label="GST Number">
                <Input placeholder="Enter GST Number" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="contactName"
                label="Primary Contact Name"
                rules={[{ required: true }]}
              >
                <Input placeholder="Enter Primary Contact" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="contactEmail" label="Email">
                <Input placeholder="Enter Email" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="contactNumber"
                label="Mobile Number"
                rules={[{ required: true }]}
              >
                <Input placeholder="+91 9876543210" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="typeOfLead"
                label="Type of Leads"
                rules={[{ required: true }]}
              >
                <Select mode="multiple" placeholder="Select Lead Type">
                  <Option value="Fixed client">Fixed client</Option>
                  <Option value="Revenue based client">Revenue based client</Option>
                  <Option value="Vrism Product">Vrism Product</Option>
                  <Option value="others">Others</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>


          {/* Additional Contacts */}
          <div style={{ marginBottom: 16 }}>
            <Title level={5}>Additional Contact Persons</Title>
          </div>
          <Form.List name="additionalContactPersons">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <div key={key} style={{ border: "1px solid #d9d9d9", padding: 16, marginBottom: 16, borderRadius: 8 }}>
                    <Row gutter={16}>
                      <Col span={11}>
                        <Form.Item {...rest} name={[name, "name"]} label="Name">
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col span={11}>
                        <Form.Item {...rest} name={[name, "email"]} label="Email">
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col span={2}>
                        <MinusCircleOutlined onClick={() => remove(name)} />
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={11}>
                        <Form.Item {...rest} name={[name, "phoneNumber"]} label="Phone">
                          <Input />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                ))}
                <Form.Item>
                  <Button type="dashed" block onClick={add} icon={<PlusOutlined />}>
                    Add Additional Contact
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>


          {/* Address */}
          <Title level={5}>Address</Title>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="addressLine1" label="Address Line 1">
                <Input placeholder="Line 1" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="addressLine2" label="Address Line 2">
                <Input placeholder="Line 2" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="city" label="City">
                <Input placeholder="City" />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item name="state" label="State">
                <Input placeholder="State" />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item name="pincode" label="Pincode">
                <Input placeholder="Pincode" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="country" label="Country">
                <Input placeholder="Country" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="website" label="Website URL">
                <Input placeholder="www.example.com" />
              </Form.Item>
            </Col>
          </Row>


          {/* STATUS + SOURCE */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="Account Status" rules={[{ required: true }]}>
                <Select>
                  <Option value="Active">Active</Option>
                  <Option value="Pipeline">Pipeline</Option>
                  <Option value="Quotations">Quotations</Option>
                  <Option value="Customer">Customer</Option>
                  <Option value="Closed">Closed</Option>
                  <Option value="TargetLeads">Target Leads</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="sourceType" label="Source Type">
                <Select>
                  <Option value="Direct">Direct</Option>
                  <Option value="Referral">Referral</Option>
                  <Option value="Website">Website</Option>
                  <Option value="Social Media">Social Media</Option>
                  <Option value="others">Others</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>


          <Form.Item name="assignedTo" label="Assigned To">
            <Select allowClear showSearch>
              {allUsers.map((u) => (
                <Option key={u._id} value={u._id}>
                  {u.name} ({u.role})
                </Option>
              ))}
            </Select>
          </Form.Item>


          {/* Service & Pricing */}
          <Title level={5}>Service & Pricing</Title>
          <Form.Item
            name="selectedService"
            label="Select Service"
          >
            <Select
              placeholder="Choose service"
              loading={loadingProducts}
              onChange={handleServiceChange}
            >
              {products.map((srv) => (
                <Option key={srv._id} value={srv._id}>
                  {srv.serviceName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {servicePlans.length > 0 && (
            <>
              <Form.Item name="selectedPlan" label="Select Plan">
                <Select onChange={calculatePrice}>
                  {servicePlans.map((p) => (
                    <Option key={p._id} value={p._id}>
                      {p.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="billingCycle" label="Billing Cycle">
                <Select onChange={calculatePrice}>
                  <Option value="Monthly">Monthly</Option>
                                <Option value="One Time">One Time</Option>

                  <Option value="Yearly">Yearly</Option>
                </Select>
              </Form.Item>

              <Form.Item name="totalPrice" label="Total Price (With GST)">
                <InputNumber readOnly style={{ width: "100%" }} />
              </Form.Item>
            </>
          )}


          {/* Notes */}
          <Form.Item name="notes" label="Add Note">
            <TextArea rows={3} placeholder="Add any notes related to this account" />
          </Form.Item>

        </Form>
      </Spin>
    </Drawer>
  );
};

export default BusinessAccountForm;
