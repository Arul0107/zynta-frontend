import React from "react";
import {
  Form,
  Input,
  Select,
  Button,
  Typography,
  Card,
  Row,
  Col,
  Divider,
} from "antd"; // Added Card, Row, Col, Divider

const { Option } = Select;
const { Title, Paragraph } = Typography;

const CompanyProfile = () => {
  const [form] = Form.useForm();

  const onFinish = (values) => {
    console.log("Received values of form: ", values);
    // Here you would typically send these values to your backend API
    // Example: message.success('Company profile updated successfully!');
  };

  // Initial values for the form (you'd fetch these from your backend in a real app)
  const initialValues = {
    companyName: "COMPANY Name",
    companyAddress: "25, Your Company Address",
    companyState: "New York",
    companyCountry: "United State",
    companyEmail: "youremail@example.com",
    companyPhone: "+1 345234654",
    companyWebsite: "www.example.com",
    companyTaxNumber: "91231255234",
    companyVatNumber: "91231255234",
    companyRegNumber: "00001233421",
  };

  return (
    <Card
      title={
        <Title level={4} style={{ margin: 0 }}>
          Company Settings
        </Title>
      }
      extra={
        <Paragraph style={{ margin: 0 }}>
          Update Your Company Informations
        </Paragraph>
      }
      style={{ maxWidth: 900, margin: "auto" }} // Added max-width and auto margin for centering
    >
      <Form
        form={form}
        layout="vertical" // Keeping vertical for labels above inputs
        name="company_profile_form"
        onFinish={onFinish}
        initialValues={initialValues}
      >
        <Row gutter={16}>
          {" "}
          {/* Gutter for spacing between columns */}
          <Col span={12}>
            {" "}
            {/* First column for these fields */}
            <Form.Item
              label="Company Name:"
              name="companyName"
              rules={[
                { required: true, message: "Please input your Company Name!" },
              ]}
            >
              <Input placeholder="Enter company name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            {" "}
            {/* Second column for these fields */}
            <Form.Item
              label="Company Email:"
              name="companyEmail"
              rules={[
                { required: true, message: "Please input your Company Email!" },
                { type: "email", message: "Please enter a valid email!" },
              ]}
            >
              <Input placeholder="Enter company email" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Company Phone:" name="companyPhone">
              <Input placeholder="Enter company phone" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Company Website:" name="companyWebsite">
              <Input placeholder="Enter company website URL" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          label="Company Address:"
          name="companyAddress"
          rules={[
            { required: true, message: "Please input your Company Address!" },
          ]}
        >
          <Input.TextArea
            autoSize={{ minRows: 2, maxRows: 4 }}
            placeholder="Enter company full address"
          />{" "}
          {/* Changed to TextArea */}
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Company State:"
              name="companyState"
              rules={[
                {
                  required: true,
                  message: "Please select your Company State!",
                },
              ]}
            >
              <Select placeholder="Select a state">
                <Option value="New York">New York</Option>
                <Option value="California">California</Option>
                <Option value="Texas">Texas</Option>
                {/* Add more states */}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Company Country:"
              name="companyCountry"
              rules={[
                {
                  required: true,
                  message: "Please select your Company Country!",
                },
              ]}
            >
              <Select placeholder="Select a country">
                <Option value="United State">United States</Option>
                <Option value="Canada">Canada</Option>
                <Option value="India">India</Option>
                {/* Add more countries */}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Divider orientation="left">Tax & Registration Details</Divider>{" "}
        {/* Added a divider for separation */}
        <Row gutter={16}>
          <Col span={8}>
            {" "}
            {/* Adjust span values for desired column width */}
            <Form.Item label=" GST No." name="companyTaxNumber">
              <Input placeholder="Enter GST number" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Bank Name:" name="companyBankName">
              <Input placeholder="Enter bank name" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Account Number:" name="companyAccountNumber">
              <Input placeholder="Enter account number" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            {" "}
            {/* Adjust span values for desired column width */}
            <Form.Item label="IFSC Code:" name="companyIFSCCode">
              <Input placeholder="Enter IFSC code" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Branch:" name="companyBranch">
              <Input placeholder="Enter branch name" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item style={{ marginTop: 24, textAlign: "right" }}>
          {" "}
          {/* Align button to the right */}
          <Button type="primary"
           style={{ backgroundColor: '#0E2B43', borderColor: '#orange', color: 'white' }}
           htmlType="submit">
            Save Changes
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default CompanyProfile;
