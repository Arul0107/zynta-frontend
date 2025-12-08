import React, { useEffect, useState } from "react";
import {
  Card,
  Button,
  Drawer,
  Form,
  Input,
  Select,
  DatePicker,
  Tag,
  message,
  Typography,
  Row,
  Col,
  Space,
  Statistic,
  Divider,
  Empty
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  ClockCircleOutlined,
  EyeOutlined // Ensure EyeOutlined is imported
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../api/axios"; // Assuming axios instance is configured

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Project Status Colors
const statusColors = {
  Planned: "gold",
  "In Progress": "blue",
  Completed: "green",
  "On Hold": "orange",
  Cancelled: "red",
};

// Project Step Status Options
const stepStatusOptions = [
    { label: "Pending", value: "Pending", color: "default" },
    { label: "In Progress", value: "In Progress", color: "blue" },
    { label: "Review", value: "Review", color: "purple" },
    { label: "Completed", value: "Completed", color: "green" },
    { label: "On Hold", value: "On Hold", color: "orange" },
];

export default function Q() {
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const isEmployee = currentUser?.role === "Employee";
  const [form] = Form.useForm();
  const [noteForm] = Form.useForm();

  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [services, setServices] = useState([]);
  const [stepTemplates, setStepTemplates] = useState([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [detailProject, setDetailProject] = useState(null);
  const [loading, setLoading] = useState(false);
    
  // New state for dedicated notes drawer
  const [notesDrawerOpen, setNotesDrawerOpen] = useState(false);


  // --- DATA LOADING ---
  useEffect(() => {
    loadUsers();
    loadAccounts();
    loadServices();
    loadProjects();
    loadStepTemplates();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await api.get("/api/users");
      setUsers(res.data || []);
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  };

  const loadAccounts = async () => {
    try {
      const res = await api.get("/api/accounts");
      setAccounts(res.data?.accounts || res.data || []);
    } catch (error) {
      console.error("Failed to load accounts:", error);
    }
  };

  const loadServices = async () => {
    try {
      const res = await api.get("/api/service");
      setServices(res.data?.services || res.data || []);
    } catch (error) {
      console.error("Failed to load services:", error);
    }
  };

  // Load Step Templates (Grouped by Service Name/stepType)
  const loadStepTemplates = async () => {
    try {
      const { data } = await api.get("/api/steps");
      setStepTemplates(data);
    } catch (e) {
      console.error("Failed to load step templates:", e);
    }
  };

  const loadProjects = async (filters = {}) => {
    setLoading(true);
    try {
      const res = await api.get("/api/projects", {
        params: {
          userId: currentUser._id,
          role: currentUser.role,
          ...filters
        },
      });
      setProjects(res.data?.projects || []);
    } catch (error) {
      console.error("Failed to load projects:", error);
      message.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  // --- STEP TEMPLATE AUTOFILL LOGIC ---
  const serviceId = Form.useWatch('serviceId', form);

  useEffect(() => {
    if (drawerOpen && !editingProject) {
      if (serviceId) {
        const service = services.find(s => s._id === serviceId);
        const stepType = service?.serviceName;

        if (stepType) {
          const templateGroup = stepTemplates.find(g => g._id === stepType);

          if (templateGroup) {
            const projectSteps = templateGroup.steps.map(step => ({
              stepName: step.stepName,
              description: step.description,
              url: step.url,
              status: 'Pending',
            }));

            form.setFieldsValue({
              steps: projectSteps
            });
            message.info(`Auto-populated ${projectSteps.length} steps from '${stepType}' template.`);
          } else {
            form.setFieldsValue({
              steps: []
            });
          }
        }
      } else {
        form.setFieldsValue({
          steps: []
        });
      }
    }
  }, [serviceId, form, services, stepTemplates, drawerOpen, editingProject]);

  const canEdit = (project) =>
    !isEmployee || project?.members?.some(m => m._id === currentUser._id);

  // OPEN EDIT
  const openEdit = (project) => {
    setEditingProject(project);

    form.setFieldsValue({
      ...project,
      accountId: project.accountId?._id,
      serviceId: project.serviceId?._id,
      members: project.members?.map(m => m._id),
      status: project.status,
      dates: [
        project.startDate ? dayjs(project.startDate) : null,
        project.endDate ? dayjs(project.endDate) : null,
      ],
      attachments: project.attachments || [],
      steps: project.steps || []
    });

    setDrawerOpen(true);
  };

  // OPEN DETAILS & LOAD PROJECT
  const openDetails = async (project) => {
    try {
      // Always load fresh data for details
      const res = await api.get(`/api/projects/${project._id}`);
      setDetailProject(res.data.project);
      setDetailDrawerOpen(true);
    } catch (error) {
      console.error("Failed to load project details:", error);
      message.error("Failed to load project details");
    }
  };
    
  // Function to open the Notes Drawer
  const openNotesDrawer = (project) => {
    // Use the currently loaded detailProject
    setDetailProject(project); 
    setNotesDrawerOpen(true);
  };

  // SAVE PROJECT
  const saveProject = async (values) => {
    const [start, end] = values.dates || [];
    
    const serviceNameForBackend = !editingProject 
        ? services.find(s => s._id === values.serviceId)?.serviceName 
        : undefined;

    const payload = {
      ...values,
      startDate: start?.toISOString(),
      endDate: end?.toISOString(),
      createdBy: currentUser._id,
      serviceName: serviceNameForBackend,
      attachments: (values.attachments || []).map(a => ({
        filename: a.filename || a.url?.split("/").pop(),
        url: a.url
      })),
      steps: values.steps || [],
    };

    try {
      if (editingProject) {
        await api.put(`/api/projects/${editingProject._id}`, payload);
        message.success("Project Updated!");
      } else {
        await api.post("/api/projects", payload);
        message.success("Project Created!");
      }

      form.resetFields();
      setEditingProject(null);
      setDrawerOpen(false);
      loadProjects();
    } catch (e) {
      console.error("Save error:", e);
      message.error("Error saving project");
    }
  };

  // DELETE PROJECT
  const deleteProject = async (id) => {
    try {
      await api.delete(`/api/projects/${id}`);
      message.success("Project Deleted");
      loadProjects();
    } catch (error) {
      console.error("Failed to delete project:", error);
      message.error("Failed to delete project");
    }
  };

  // FILTER PROJECTS
  const filterProjects = (key, val) => {
    const filterData = {};
    if (val) filterData[key] = val;
    loadProjects(filterData);
  };

  // ADD NOTE TO PROJECT
  const addNoteToProject = async (values) => {
    if (!detailProject) return;

    try {
      const note = {
        text: values.noteText,
        author: currentUser.name,
        timestamp: new Date().toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };

      await api.put(`/api/projects/${detailProject._id}/note`, { note });
      message.success('Note added successfully');
      
      // Refresh project details to update the note list in both drawers
      const res = await api.get(`/api/projects/${detailProject._id}`);
      setDetailProject(res.data.project);
      
      // Clear form
      noteForm.resetFields();
    } catch (error) {
      console.error('Error adding note:', error);
      message.error('Failed to add note');
    }
  };

  // DELETE NOTE FROM PROJECT
  const deleteProjectNote = async (projectId, noteIndex) => {
    try {
      await api.put(`/api/projects/${projectId}/note/delete`, { noteIndex });
      message.success('Note deleted successfully');
      
      // Refresh project details to update the note list in both drawers
      const res = await api.get(`/api/projects/${detailProject._id}`);
      setDetailProject(res.data.project);
    } catch (error) {
      console.error('Error deleting note:', error);
      message.error('Failed to delete note');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <Row justify="space-between" align="middle">
        <Title level={4}>Project Management</Title>

        {!isEmployee && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
                setEditingProject(null);
                form.resetFields();
                form.setFieldsValue({ steps: [] });
                setDrawerOpen(true);
            }}
          >
            New Project
          </Button>
        )}
      </Row>

      {/* TOTAL PROJECTS STATISTIC */}
      <Row style={{ marginTop: 10 }}>
        <Col span={6}>
          <Card style={{ textAlign: "center" }}>
            <Statistic
              title="Total Projects"
              value={projects.length}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
      </Row>

      {/* FILTERS */}
      <Space style={{ marginTop: 15 }}>
        <Select
          placeholder="Status"
          allowClear
          style={{ width: 140 }}
          onChange={(v) => filterProjects("status", v)}
          options={Object.keys(statusColors).map(s => ({ label: s, value: s }))}
        />
        <Select
          placeholder="Account"
          allowClear
          style={{ width: 180 }}
          showSearch
          onChange={(v) => filterProjects("accountId", v)}
          options={accounts.map(a => ({ label: a.businessName, value: a._id }))}
        />
        <Select
          placeholder="Service"
          allowClear
          style={{ width: 180 }}
          onChange={(v) => filterProjects("serviceId", v)}
          options={services.map(s => ({ label: s.serviceName, value: s._id }))}
        />
      </Space>

      {/* PROJECT CARDS */}
      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        {projects.map(project => {
          const editable = canEdit(project);

          return (
            <Col xs={24} sm={12} md={8} lg={6} key={project._id}>
              <Card
                title={project.name}
                style={{ cursor: "pointer" }}
                extra={<Tag color={statusColors[project.status]}>{project.status}</Tag>}
                onClick={() => openDetails(project)}
                actions={[
                    // ADDED NOTES ICON HERE
                    <EyeOutlined
                        key="notes"
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent the card's main onClick (openDetails) from firing
                            openNotesDrawer(project); 
                        }}
                    />,
                    
                  editable && (
                    <EditOutlined 
                      key="edit" 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        openEdit(project); 
                      }} 
                    />
                  ),
                  !isEmployee && (
                    <DeleteOutlined
                      key="delete"
                      style={{ color: "red" }}
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        deleteProject(project._id); 
                      }}
                    />
                  )
                ].filter(Boolean)}
              >
                <Text type="secondary">{project.description || "No Description"}</Text><br />
                <Text strong>Account: </Text>{project.accountId?.businessName}<br />
                <Text strong>Service: </Text>{project.serviceId?.serviceName}
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* CREATE / EDIT DRAWER */}
      <Drawer
        width={600}
        open={drawerOpen}
        title={editingProject ? "Edit Project" : "New Project"}
        onClose={() => { 
          setDrawerOpen(false); 
          setEditingProject(null); 
          form.resetFields(); 
        }}
      >
        <Form layout="vertical" form={form} onFinish={saveProject} initialValues={{ status: "Planned" }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="Project Name" rules={[{ required: true }]}>
                <Input disabled={editingProject && !canEdit(editingProject)} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Status">
                <Select
                  disabled={editingProject && !canEdit(editingProject)}
                  options={Object.keys(statusColors).map(s => ({ label: s, value: s }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} disabled={editingProject && !canEdit(editingProject)} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="accountId" label="Account" rules={[{ required: true }]}>
                <Select
                  disabled={isEmployee}
                  showSearch
                  options={accounts.map(a => ({ label: a.businessName, value: a._id }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="serviceId" label="Service" rules={[{ required: true }]}>
                <Select
                  disabled={isEmployee}
                  options={services.map(s => ({ label: s.serviceName, value: s._id }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="members" label="Assign To">
            <Select
              mode="multiple"
              showSearch
              placeholder="Select members"
              disabled={editingProject && !canEdit(editingProject)}
              options={users.map(u => ({ label: u.name, value: u._id }))}
            />
          </Form.Item>

          <Form.Item name="dates" label="Project Dates">
            <RangePicker style={{ width: '100%' }} disabled={editingProject && !canEdit(editingProject)} />
          </Form.Item>
          
          <Divider orientation="left">Project Steps (Tasks)</Divider>
          
          {/* PROJECT STEPS Form.List */}
          {(!editingProject || canEdit(editingProject)) ? (
             <Form.List name="steps">
             {(fields, { add, remove }) => (
               <>
                 {fields.map(({ key, name, ...rest }) => (
                   <div
                     key={key}
                     style={{
                       border: "1px solid #f0f0f0",
                       padding: 10,
                       borderRadius: 4,
                       marginBottom: 10,
                       position: 'relative',
                       backgroundColor: '#fafafa'
                     }}
                   >
                     <Button 
                        danger 
                        size="small" 
                        icon={<DeleteOutlined />}
                        onClick={() => remove(name)}
                        style={{ position: 'absolute', top: 5, right: 5, zIndex: 10 }}
                     />
                     
                     <Row gutter={8}>
                       <Col span={16}>
                         <Form.Item
                           {...rest}
                           name={[name, "stepName"]}
                           label="Step Name"
                           rules={[{ required: true }]}
                           style={{ marginBottom: 10 }}
                         >
                           <Input placeholder="e.g., Wireframing Complete" />
                         </Form.Item>
                       </Col>
                       <Col span={8}>
                         <Form.Item
                           {...rest}
                           name={[name, "status"]}
                           label="Step Status"
                           rules={[{ required: true }]}
                           style={{ marginBottom: 10 }}
                         >
                           <Select
                                options={stepStatusOptions}
                                placeholder="Select Status"
                            />
                         </Form.Item>
                       </Col>
                       <Col span={24}>
                            <Form.Item {...rest} name={[name, "description"]} label="Description" style={{ marginBottom: 5 }}>
                                <Input.TextArea rows={1} placeholder="Details for this step" />
                            </Form.Item>
                            <Form.Item {...rest} name={[name, "url"]} label="Related Link" style={{ marginBottom: 0 }}>
                                <Input placeholder="Link to file/task" />
                            </Form.Item>
                       </Col>
                     </Row>
                   </div>
                 ))}

                     <Button 
                       type="dashed" 
                       onClick={() => add({ status: 'Pending' })} 
                       block 
                       icon={<PlusOutlined />}
                       style={{ marginBottom: 20 }}
                     >
                       Add Project Step
                     </Button>
               </>
             )}
           </Form.List>
          ) : (
             <Tag color="volcano" style={{ display: 'block', textAlign: 'center', padding: 10, marginBottom: 20 }}>
                 Steps can only be modified by assigned members or managers.
             </Tag>
          )}

          <Divider orientation="left">Attachments</Divider>

          {/* Attachments */}
          <Form.List name="attachments">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Row key={key} gutter={8} style={{ marginBottom: 10 }}>
                    <Col span={14}>
                      <Form.Item {...rest} name={[name, "url"]} rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                        <Input placeholder="File URL" disabled={editingProject && !canEdit(editingProject)} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item {...rest} name={[name, "filename"]} style={{ marginBottom: 0 }}>
                        <Input placeholder="Filename" disabled={editingProject && !canEdit(editingProject)} />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      {canEdit(editingProject || {}) && (
                        <Button danger onClick={() => remove(name)} style={{ padding: '0 8px' }}>X</Button>
                      )}
                    </Col>
                  </Row>
                ))}
                {canEdit(editingProject || {}) && (
                  <Button type="dashed" block onClick={() => add()} style={{ marginBottom: 20 }}>
                    + Add Attachment
                  </Button>
                )}
              </>
            )}
          </Form.List>

          {/* SAVE BUTTON */}
          {(!editingProject || canEdit(editingProject)) ? (
            <Button type="primary" htmlType="submit" block>
              Save Project
            </Button>
          ) : (
            <Tag color="red" style={{ textAlign: "center", display: "block" }}>
              Editing Restricted
            </Tag>
          )}
        </Form>
      </Drawer>

      {/* DETAILS DRAWER */}
      <Drawer
        width={780}
        title="Project Details"
        open={detailDrawerOpen}
        onClose={() => {
          setDetailDrawerOpen(false);
          setDetailProject(null);
        }}
      >
        {detailProject && (
          <>
            <p><b>Name:</b> {detailProject.name}</p>
            <p><b>Status:</b> <Tag color={statusColors[detailProject.status]}>{detailProject.status}</Tag></p>
            <p><b>Description:</b> {detailProject.description || "N/A"}</p>

            <p><b>Account:</b> {detailProject.accountId?.businessName}</p>
            <p><b>Service:</b> {detailProject.serviceId?.serviceName}</p>

            <p><b>Members:</b></p>
            {detailProject.members?.length ? (
              detailProject.members.map(m => <Tag key={m._id}>{m.name}</Tag>)
            ) : (
              <Text type="secondary">No Members Assigned</Text>
            )}

            <Divider orientation="left" style={{ marginTop: 15 }}>Project Steps (Tasks)</Divider>
            {detailProject.steps?.length ? (
              <div style={{ maxHeight: 200, overflowY: 'auto', paddingRight: 10 }}>
                {detailProject.steps.map((step, index) => {
                  const statusConfig = stepStatusOptions.find(opt => opt.value === step.status) || { color: 'default' };
                  return (
                    <Card 
                      key={index} 
                      size="small"
                      style={{ 
                        marginBottom: 8, 
                        borderLeft: `3px solid ${statusConfig.color}`,
                        borderRadius: '6px'
                      }}
                      title={<span style={{ fontWeight: 600 }}>Step {index + 1}: {step.stepName}</span>}
                    >
                      <Tag color={statusConfig.color}>
                        {step.status}
                      </Tag>
                      {step.description && <p style={{ margin: '8px 0', fontSize: '13px' }}>{step.description}</p>}
                      {step.url && (
                        <a href={step.url} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>
                          🔗 View Link
                        </a>
                      )}
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Text type="secondary">No Steps defined for this project.</Text>
            )}
            
            <Divider orientation="left" style={{ marginTop: 15 }}>Attachments</Divider>
            {detailProject.attachments?.length ? (
              detailProject.attachments.map((a, i) => (
                <a 
                  key={i} 
                  href={a.url} 
                  target="_blank" 
                  rel="noreferrer" 
                  style={{ 
                    display: "block", 
                    marginBottom: '8px',
                    padding: '8px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px',
                    backgroundColor: '#fafafa'
                  }}
                >
                  📎 {a.filename || a.url.split("/").pop()}
                </a>
              ))
            ) : (
              <Text type="secondary">No Files Attached</Text>
            )}

            {/* NEW BUTTON TO OPEN NOTES DRAWER */}
            <Divider orientation="left" style={{ marginTop: 20 }}>Project Notes</Divider>
            <Button
                type="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  openNotesDrawer(detailProject)
                }}
                icon={<EyeOutlined />}
                style={{ borderRadius: '6px' }}
            >
                View/Add Notes ({detailProject.notes?.length || 0})
            </Button>
            {/* END NEW BUTTON */}

          </>
        )}
      </Drawer>
      
      {/* NEW DEDICATED NOTES DRAWER */}
      <Drawer
        width={450} // Smaller width for notes
        title={`Notes for: ${detailProject?.name || 'Project'}`}
        open={notesDrawerOpen}
        onClose={() => {
          setNotesDrawerOpen(false);
          noteForm.resetFields();
        }}
      >
        {detailProject && (
          <>
            {/* Notes List */}
            <div style={{ marginBottom: 20, maxHeight: 300, overflowY: 'auto', paddingRight: 10 }}>
              {detailProject.notes?.length ? (
                detailProject.notes.map((note, index) => (
                  <Card 
                    key={index} 
                    size="small"
                    style={{ 
                      marginBottom: 10, 
                      borderLeft: '3px solid #1890ff',
                      backgroundColor: '#fafafa',
                      borderRadius: '6px'
                    }}
                    extra={
                      canEdit(detailProject) && (
                        <Button 
                          type="text" 
                          danger 
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => deleteProjectNote(detailProject._id, index)}
                          style={{ padding: '0 4px' }}
                        />
                      )
                    }
                  >
                    <p style={{ 
                      whiteSpace: 'pre-wrap', 
                      marginBottom: 8, 
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}>
                      {note.text}
                    </p>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      fontSize: '12px'
                    }}>
                      <Text type="secondary">
                        <UserOutlined style={{ marginRight: 4 }} />
                        {note.author}
                      </Text>
                      <Text type="secondary">
                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                        {note.timestamp}
                      </Text>
                    </div>
                  </Card>
                ))
              ) : (
                <Empty 
                  description="No notes yet" 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ margin: '20px 0' }}
                />
              )}
            </div>

            {/* Add Note Form */}
            {canEdit(detailProject) && (
              <Form 
                form={noteForm} 
                onFinish={addNoteToProject}
                style={{ marginTop: 10 }}
              >
                <Form.Item
                  name="noteText"
                  rules={[{ required: true, message: 'Please enter a note' }]}
                >
                  <Input.TextArea 
                    rows={3} 
                    placeholder="Add a note about this project..."
                    maxLength={500}
                    showCount
                    style={{ borderRadius: '6px' }}
                  />
                </Form.Item>
                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    icon={<PlusOutlined />}
                    style={{ borderRadius: '6px' }}
                  >
                    Add Note
                  </Button>
                </Form.Item>
              </Form>
            )}
          </>
        )}
      </Drawer>
    </div>
  );
}