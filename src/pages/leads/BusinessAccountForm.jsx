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
import axios from "../../api/axios"; // Assuming axios is configured correctly

const { TextArea } = Input;
const { Option } = Select;
const { Title } = Typography;

const BusinessAccountForm = ({
  visible,
  onClose,
  initialValues,
  allUsers = [],
  allZones = [], // Not used in filtering users by zone, but good to keep
  loadingUsers = false,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState(allUsers);

  // NOTE: 'zone' field is not defined in the form fields below. 
  // It should be added to the form if it's meant to be watched for user filtering.
  // For now, Form.useWatch is commented out or assumed to be an existing field 
  // if you were intending to add it.
  const selectedZone = null; // Form.useWatch("zone", form);

  // Load products (BrandServices) when drawer opens
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        // NOTE: This endpoint should map to fetching BrandService models.
        const res = await axios.get("/api/service"); 
        setProducts(res.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load services");
      } finally {
        setLoadingProducts(false);
      }
    };
    if (visible) fetchProducts();
  }, [visible]);

  // Reset form on open or initialValues change
  useEffect(() => {
    form.resetFields();
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        // Ensure selectedService is set by its ID
        selectedService: initialValues.selectedService?._id || null, 
      });
    } else {
      form.setFieldsValue({
        sourceType: "Direct",
        status: "Active",
        selectedService: null,
        assignedTo: null,
        typeOfLead: [],
        additionalContactPersons: [],
      });
    }
  }, [initialValues, form]);

  // Fetch users by zone (currently disabled as 'zone' field is missing)
  useEffect(() => {
    // If you add a 'zone' field to the form, uncomment this logic
    // if (!selectedZone) return setFilteredUsers(allUsers);
    // const fetchUsersByZone = async () => {
    //   try {
    //     const res = await axios.get(`/api/users/zone/${selectedZone}`);
    //     setFilteredUsers(res.data);
    //   } catch (err) {
    //     console.error(err);
    //     toast.error("Failed to load users for selected zone");
    //   }
    // };
    // fetchUsersByZone();
    setFilteredUsers(allUsers);
  }, [selectedZone, allUsers]);

  // Submit form
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const timestamp = new Date().toLocaleString();
      const newNote = values.noteInput
        ? { text: values.noteInput, timestamp, author: "User" }
        : null;

      const updatedNotes = newNote
        ? [...(initialValues?.notes || []), newNote]
        : initialValues?.notes || [];

      const dataToSend = {
        ...values,
        notes: updatedNotes,
        selectedService: values.selectedService,
      };
      delete dataToSend.noteInput;

      if (initialValues?._id) {
        // UPDATE
        await axios.put(`/api/accounts/${initialValues._id}`, dataToSend);
        toast.success("Account updated successfully!");
      } else {
        // CREATE
        await axios.post("/api/accounts", dataToSend);
        toast.success("Account created successfully!");
      }

      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save account.");
      // Handle the 409 error from controller for duplicate businessName
      if (err.response && err.response.status === 409) {
          toast.error(err.response.data.message || "Business name already exists.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title={initialValues ? "Edit Business Account" : "Create New Business Account"}
      width={850}
      onClose={onClose}
      open={visible}
      styles={{ body: { paddingBottom: 80 } }}
      footer={
        <div style={{ textAlign: "right" }}>
          <Button onClick={onClose} style={{ marginRight: 8 }}>
            Cancel
          </Button>
          <Button type="primary" loading={loading} onClick={handleSubmit} style={{ backgroundColor: "#0E2B43", borderColor: "orange", color: "white" }}>
            {initialValues ? "Update Account" : "Create Account"}
          </Button>
        </div>
      }
    >
      <Spin spinning={loadingUsers || loadingProducts}>
        <Form form={form} layout="vertical">
          {/* Business Info */}
          <Row gutter={16}>
            <Col span={12}><Form.Item name="businessName" label="Business Name" rules={[{ required: true, message: 'Please enter business name' }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="gstNumber" label="GST Number"><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="contactName" label="Primary Contact Name" rules={[{ required: true, message: 'Please enter contact name' }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="contactEmail" label="Email"><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="contactNumber" label="Mobile Number" rules={[{ required: true, message: 'Please enter mobile number' }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="typeOfLead" label="Type of Leads">
              <Select mode="multiple" allowClear>
                <Option value="Fixed client">Fixed client</Option>
                <Option value="Revenue based client">Revenue based client</Option>
                <Option value="Vrism Product">Vrism Product</Option>
                <Option value="Occupational">Occupational</Option>
              </Select>
            </Form.Item></Col>
          </Row>

          {/* Additional Contacts */}
          <div style={{ marginBottom: 16 }}><Title level={5}>Additional Contact Persons</Title></div>
          <Form.List name="additionalContactPersons">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <div key={key} style={{ border: "1px solid #d9d9d9", padding: 16, marginBottom: 16, borderRadius: 8 }}>
                    <Row gutter={16} align="baseline">
                      <Col span={11}><Form.Item {...restField} label="Name" name={[name, "name"]}><Input /></Form.Item></Col>
                      <Col span={11}><Form.Item {...restField} label="Email" name={[name, "email"]}><Input /></Form.Item></Col>
                      <Col span={2} style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                        <MinusCircleOutlined onClick={() => remove(name)} />
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={11}><Form.Item {...restField} label="Phone" name={[name, "phoneNumber"]}><Input /></Form.Item></Col>
                    </Row>
                  </div>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={add} block icon={<PlusOutlined />}>Add Additional Contact</Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          {/* Address */}
          <Row gutter={16}>
            <Col span={12}><Form.Item name="addressLine1" label="Address Line 1"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="addressLine2" label="Address Line 2"><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="city" label="City"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="pincode" label="Pincode"><InputNumber style={{ width: "100%" }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="state" label="State"><Input /></Form.Item></Col>
          </Row>
          <Form.Item name="country" label="Country"><Input /></Form.Item>
          <Form.Item name="website" label="Website URL"><Input /></Form.Item>

          {/* Lead & Status */}
          <Form.Item name="type" label="Lead Type">
            <Select placeholder="Select Type">
              <Option value="Hot">Hot</Option>
              <Option value="Warm">Warm</Option>
              <Option value="Cold">Cold</Option>
            </Select>
          </Form.Item>
          <Form.Item name="status" label="Account Status" rules={[{ required: true, message: 'Please select account status' }]}>
            <Select placeholder="Select Status">
              <Option value="Active">Active</Option>
              <Option value="Pipeline">Pipeline</Option>
              <Option value="Quotations">Quotations</Option>
              <Option value="Customer">Customer</Option>
              <Option value="Closed">Closed</Option>
              <Option value="TargetLeads">Target Leads</Option> {/* Added TargetLeads as per schema */}
            </Select>
          </Form.Item>
          <Form.Item name="sourceType" label="Source Type">
            <Select placeholder="Select Source">
              <Option value="Direct">Direct</Option>
              <Option value="socialmedia">Social Media</Option>
              <Option value="online">Website</Option>
              <Option value="client">Existing Client</Option>
              <Option value="tradefair">Tradefair</Option>
              <Option value="Other">Other</Option>
            </Select>
          </Form.Item>

          {/* Assignments */}
          <Form.Item name="assignedTo" label="Assigned To">
            <Select placeholder="Select a user" allowClear showSearch optionFilterProp="children">
              {filteredUsers.map(user => <Option key={user._id} value={user._id}>{user.name} ({user.role})</Option>)}
            </Select>
          </Form.Item>
          
          {/* Zone (If needed for user filtering, uncomment this and the useEffect logic) */}
          {/* <Form.Item name="zone" label="Zone"> 
             <Select placeholder="Select zone" allowClear>
               {allZones.map(zone => <Option key={zone._id} value={zone._id}>{zone.name}</Option>)}
             </Select>
          </Form.Item> */}


          {/* Selected Service (Now referencing BrandService model) */}
          <Form.Item name="selectedService" label="Select Service">
            <Select placeholder="Select a service" allowClear loading={loadingProducts} showSearch optionFilterProp="children">
              {products.map(service => <Option key={service._id} value={service._id}>{service.serviceName}</Option>)}
            </Select>
          </Form.Item>

          {/* Notes */}
          <Form.Item name="noteInput" label="Add Note">
            <TextArea rows={3} placeholder="Add a note" />
          </Form.Item>
        </Form>
      </Spin>
    </Drawer>
  );
};

export default BusinessAccountForm;