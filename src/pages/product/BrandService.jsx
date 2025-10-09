import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Layout,
  Tabs,
  Popconfirm,
  Tag,
  Tooltip,
  Drawer,
  Collapse,
  Descriptions,
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  DeleteOutlined,
  EditOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import axios from "../../api/axios";
import toast from "react-hot-toast";
import BrandServiceForm from "./BrandServiceForm";
import NotesDrawer from "./ServiceNotesDrawer"; // renamed

const { Content, Header } = Layout;
const { TabPane } = Tabs;
const { Panel } = Collapse;

const BrandService = () => {
  const [services, setServices] = useState([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [viewingService, setViewingService] = useState(null);
  const [notesVisible, setNotesVisible] = useState(false);

  // Fetch all services
  const fetchServices = async () => {
    try {
      const { data } = await axios.get("/api/service");
      setServices(data);
    } catch (err) {
      toast.error("Failed to load services");
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleSave = () => fetchServices();

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/service/${id}`);
      toast.success("Service deleted");
      fetchServices();
    } catch {
      toast.error("Failed to delete service");
    }
  };

  const fetchServiceDetails = async (id) => {
    try {
      const { data } = await axios.get(`/api/service/${id}`);
      setViewingService(data);
    } catch {
      toast.error("Failed to fetch service details");
    }
  };

  const activeServices = services.filter((s) => s.isActive);
  const inactiveServices = services.filter((s) => !s.isActive);

  const getColumns = () => [
    { title: "S.No", render: (_, __, index) => index + 1, width: 60 },
    { title: "Name", dataIndex: "serviceName", width: 160 },
    { title: "Price (₹)", dataIndex: "basePrice", render: val => `₹${val?.toFixed(2)}`, width: 100 },
    {
      title: "Status",
      dataIndex: "isActive",
      render: val => val ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag>,
      width: 100
    },
    {
      title: "Actions",
      width: 180,
      render: (_, record) => (
        <>
          <Tooltip title="View">
            <Button type="text" icon={<EyeOutlined />} onClick={() => fetchServiceDetails(record._id)} />
          </Tooltip>
          <Tooltip title="Edit">
            <Button type="text" icon={<EditOutlined />} onClick={() => { setEditingService(record); setDrawerVisible(true); }} />
          </Tooltip>
          <Tooltip title="Notes">
            <Button type="text" icon={<MessageOutlined />} onClick={() => { setEditingService(record); setNotesVisible(true); }} />
          </Tooltip>
          <Popconfirm title="Confirm delete?" onConfirm={() => handleDelete(record._id)}>
            <Button type="text" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </>
      )
    }
  ];

  return (
    <Layout style={{ minHeight: "100vh", background: "#fff" }}>
      <Header style={{ background: "white", padding: 0, marginBottom: 20 }}>
        <h2 style={{ margin: 0, padding: 20 }}>Brand Service Management</h2>
      </Header>
      <Content style={{ padding: 20 }}>
        <Tabs defaultActiveKey="1">
          <TabPane tab="Active Services" key="1">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => { setEditingService(null); setDrawerVisible(true); }}
              style={{ marginBottom: 16, backgroundColor: '#0E2B43', borderColor: '#0E2B43', color: 'white' }}
            >
              Add Service
            </Button>
            <Table
              columns={getColumns()}
              dataSource={activeServices}
              rowKey="_id"
              scroll={{ x: 1000 }}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane tab="Inactive Services" key="2">
            <Table
              columns={getColumns()}
              dataSource={inactiveServices}
              rowKey="_id"
              scroll={{ x: 1000 }}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
        </Tabs>

        {/* Brand Service Form Drawer */}
        <BrandServiceForm
          visible={drawerVisible}
          onClose={() => { setEditingService(null); setDrawerVisible(false); }}
          onSave={handleSave}
          initialValues={editingService}
        />

        {/* Service Details Drawer */}
        <Drawer
          open={!!viewingService}
          title="Service Details"
          width={820}
          onClose={() => setViewingService(null)}
        >
          {viewingService && (
            <>
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="Service ID">{viewingService.service_id}</Descriptions.Item>
                <Descriptions.Item label="Name">{viewingService.serviceName}</Descriptions.Item>
                <Descriptions.Item label="Price">₹{viewingService.basePrice?.toFixed(2)}</Descriptions.Item>
                <Descriptions.Item label="Description">{viewingService.description || "N/A"}</Descriptions.Item>
                <Descriptions.Item label="Category">{viewingService.category || "N/A"}</Descriptions.Item>
                <Descriptions.Item label="Status">
                  {viewingService.isActive ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag>}
                </Descriptions.Item>
              </Descriptions>

              <Collapse style={{ marginTop: 20 }}>
                <Panel header="Service Packages / Options" key="1">
                  {Array.isArray(viewingService.options) && viewingService.options.length > 0 ? (
                    viewingService.options.map((opt, idx) => (
                      <Descriptions key={idx} column={2} size="small" bordered style={{ marginBottom: 16 }}>
                        <Descriptions.Item label="Type">{opt.type}</Descriptions.Item>
                        <Descriptions.Item label="Description">{opt.description}</Descriptions.Item>
                      </Descriptions>
                    ))
                  ) : (<p>No service options available.</p>)}
                </Panel>
                <Panel header="Service Notes" key="2">
                  {Array.isArray(viewingService.notes) && viewingService.notes.length > 0 ? (
                    viewingService.notes.map((note, idx) => (
                      <Descriptions key={idx} column={2} size="small" bordered style={{ marginBottom: 16 }}>
                        <Descriptions.Item label="Note" span={2}>{note.text}</Descriptions.Item>
                        <Descriptions.Item label="Author">{note.author}</Descriptions.Item>
                        <Descriptions.Item label="Time">{new Date(note.timestamp).toLocaleString()}</Descriptions.Item>
                      </Descriptions>
                    ))
                  ) : (<p>No notes available.</p>)}
                </Panel>
              </Collapse>
            </>
          )}
        </Drawer>

        {/* Notes Drawer */}
        {editingService && (
          <NotesDrawer
            visible={notesVisible}
            onClose={() => setNotesVisible(false)}
            service={editingService}
            refreshServices={fetchServices}
          />
        )}
      </Content>
    </Layout>
  );
};

export default BrandService;
