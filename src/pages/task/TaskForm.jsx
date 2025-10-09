import React, { useState, useEffect, forwardRef } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
  Avatar,
  Tag,
  Space,
} from "antd";
import {
  UserOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  BankOutlined,
  ToolOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { toast } from "react-hot-toast";
import moment from "moment";
import DatePicker from "react-datepicker"; 
import "react-datepicker/dist/react-datepicker.css"; 
// import "./TaskManagement.css"; // Assuming TaskForm has its own minimal styles

const { Option } = Select;
const { TextArea } = Input;

const STATUS_COLORS = {
  "To Do": "red",
  "In Progress": "orange",
  Review: "blue",
  Completed: "green",
  "Overdue": "#7f00ff", 
};

// Custom Input for React DatePicker to use Ant Design styling
const CustomAntInput = forwardRef(({ value, onClick, ...rest }, ref) => (
  <Input 
    value={value} 
    onClick={onClick} 
    ref={ref} 
    readOnly={true}
    style={{ width: "100%", cursor: 'pointer' }}
    suffix={<CalendarOutlined style={{ color: '#aaa' }} />}
    {...rest}
  />
));


const TaskForm = ({
  visible,
  onClose,
  onSave,
  initialValues,
  allUsers = [],
  allAccounts = [],
  allServices = [],
  currentUserId,
  isEmployeeEdit, // 🎯 NEW PROP
}) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  
  const [assignedDate, setAssignedDate] = useState(new Date());
  const [dueDate, setDueDate] = useState(moment().add(1, 'days').toDate());

  // Initialize form fields and date states
  useEffect(() => {
    // Reset form for a clean start when modal opens
    form.resetFields(); 
    setAssignedDate(new Date());
    setDueDate(moment().add(1, 'days').toDate());
    setFileList([]);

    if (visible && initialValues && Object.keys(initialValues).length > 0) {
      // --- EDIT MODE LOGIC ---
      
      const initAssignedDate = initialValues.assignedDate
        ? new Date(initialValues.assignedDate)
        : new Date();
      const initDueDate = initialValues.dueDate
        ? new Date(initialValues.dueDate)
        : moment().add(1, "days").toDate(); 

      setAssignedDate(initAssignedDate);
      setDueDate(initDueDate);

      // Set form fields for editing
      form.setFieldsValue({
        ...initialValues,
        assignedTo: initialValues?.assignedTo?._id || undefined,
        accountId: initialValues?.accountId?._id || undefined,
        serviceId: initialValues?.serviceId?._id || undefined,
        status: initialValues?.status || "To Do", 
      });

      // (File list logic omitted for brevity)
      setFileList(
        initialValues?.attachments?.map((name, index) => ({
          uid: `-${index}`,
          name,
          status: "done",
          url: `/uploads/${name}`,
        })) || []
      );
    } else if (visible && !initialValues) {
        // --- CREATE MODE LOGIC ---
        // Set defaults for new task
        form.setFieldsValue({
            status: "To Do", 
            assignedTo: currentUserId, // Default assignedTo to the current user
        });
    }
    // Cleanup is handled by the initial reset and conditional logic.
  }, [visible, initialValues, form, currentUserId]);

  // Handler for date changes and validators (no change required here)
  const handleAssignedDateChange = (date) => {
    setAssignedDate(date);
    form.validateFields(['assignedDate']);
  };

  const handleDueDateChange = (date) => {
    setDueDate(date);
    form.validateFields(['dueDate']);
  };
  
  const validateAssignedDate = (_, value) => {
      if (!assignedDate) {
          return Promise.reject(new Error("Select assigned date!"));
      }
      return Promise.resolve();
  };

  const validateDueDate = (_, value) => {
      if (!dueDate) {
          return Promise.reject(new Error("Select due date!"));
      }
      return Promise.resolve();
  };

  // Handle form submission
  const handleOk = async () => {
    try {
      const nonDateValues = await form.validateFields();
      
      const assignedDateMoment = moment(assignedDate);
      const dueDateMoment = moment(dueDate);

      // ... (date validation logic) ...
      if (!assignedDate || !dueDate) {
          toast.error("Please select both assigned and due dates!");
          return;
      }
      if (dueDateMoment.isBefore(assignedDateMoment, "day")) {
        toast.error("Due date cannot be before assigned date!");
        return;
      }

      // Prepare data for saving
      const dataToSend = {
        ...nonDateValues,
        assignedDate: moment.utc(assignedDateMoment.startOf("day")).toISOString(),
        dueDate: moment.utc(dueDateMoment.startOf("day")).toISOString(),
        attachments: fileList.map((f) => f.name),
      };

      // Ensure assignedBy is sent only on CREATE (and only if the backend doesn't handle it)
      if (!initialValues) {
        dataToSend.assignedBy = currentUserId; 
      }
      
      // If employee is editing, only send fields they are allowed to change (Status & Description)
      if (isEmployeeEdit) {
          const employeeData = {
              status: dataToSend.status,
              description: dataToSend.description,
          };
          await onSave(employeeData, initialValues?._id);
      } else {
          await onSave(dataToSend, initialValues?._id);
      }
      
      onClose();
    } catch (error) {
      console.error("Task Form Submission Error:", error);
      if (error.errorFields) {
          toast.error("Please fill out all required fields.");
      } else {
          toast.error(`Failed to save task: ${error.message || 'Unknown error'}`);
      }
    }
  };

  return (
    <Modal
      title={initialValues ? "Edit Task" : "Create New Task"}
      open={visible}
      onOk={handleOk}
      onCancel={onClose}
      okText="Save Task"
      width={650}
    >
      <Form form={form} layout="vertical">
        {/* Task Title - DISABLED for Employee Edit */}
        <Form.Item
          name="title"
          label={<Space><FileTextOutlined /> Task Title</Space>}
          rules={[{ required: true, message: "Please enter the task title!" }]}
        >
          <Input 
            placeholder="E.g., Implement user authentication module" 
            disabled={isEmployeeEdit} // 🎯 DISABLED
          />
        </Form.Item>

        {/* Description - ENABLED for Employee Edit */}
        <Form.Item name="description" label="Description">
          <TextArea 
            rows={4} 
            placeholder="Detailed description of the task requirements..." 
          />
        </Form.Item>

        {/* Assign To + Status */}
        <Row gutter={16}>
          <Col span={12}>
            {/* Assign To - DISABLED for Employee Edit */}
            <Form.Item
              name="assignedTo"
              label={<Space><UserOutlined /> Assign To</Space>}
              rules={[{ required: true, message: "Select a team member!" }]}
            >
              <Select 
                placeholder="Select assignee" 
                showSearch
                disabled={isEmployeeEdit} // 🎯 DISABLED
              >
                {allUsers.map((user) => (
                  <Option key={user._id} value={user._id}>
                    <Space>
                      <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: "#87d068" }} />
                      {user.name}
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            {/* Status - ENABLED for Employee Edit */}
            <Form.Item
              name="status"
              label={<Space><ClockCircleOutlined /> Status</Space>}
              rules={[{ required: true, message: "Select status!" }]}
            >
              <Select placeholder="Select status">
                {Object.keys(STATUS_COLORS).map((status) => (
                  <Option key={status} value={status}>
                    <Tag color={STATUS_COLORS[status]}>{status}</Tag>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* Account + Service - DISABLED for Employee Edit */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="accountId" label={<Space><BankOutlined /> Link Account</Space>}>
              <Select 
                placeholder="Select Business Account" 
                allowClear 
                showSearch
                disabled={isEmployeeEdit} // 🎯 DISABLED
              >
                {allAccounts.map((account) => (
                  <Option key={account._id} value={account._id}>{account.businessName}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="serviceId" label={<Space><ToolOutlined /> Link Service</Space>}>
              <Select 
                placeholder="Select Brand Service" 
                allowClear 
                showSearch
                disabled={isEmployeeEdit} // 🎯 DISABLED
              >
                {allServices.map((service) => (
                  <Option key={service._id} value={service._id}>{service.serviceName}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* Dates - DISABLED for Employee Edit */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="assignedDate"
              label="Assigned Date"
              rules={[{ validator: validateAssignedDate }]} 
            >
              <DatePicker
                selected={assignedDate}
                onChange={handleAssignedDateChange}
                dateFormat="yyyy/MM/dd"
                customInput={<CustomAntInput />} 
                disabled={isEmployeeEdit} // 🎯 DISABLED
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="dueDate"
              label="Due Date"
              rules={[{ validator: validateDueDate }]}
            >
              <DatePicker
                selected={dueDate}
                onChange={handleDueDateChange}
                dateFormat="yyyy/MM/dd"
                customInput={<CustomAntInput />}
                disabled={isEmployeeEdit} // 🎯 DISABLED
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default TaskForm;