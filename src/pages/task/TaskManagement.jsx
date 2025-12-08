import React, { useState, useEffect, useCallback, forwardRef } from "react";
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
    Button,
    Card,
    Typography,
    DatePicker as AntDatePicker, // Renamed Ant Design DatePicker to avoid conflict
    message,
    Spin,
    Empty,
    Popconfirm,
} from "antd";
import {
    UserOutlined,
    ClockCircleOutlined,
    FileTextOutlined,
    BankOutlined,
    ToolOutlined,
    CalendarOutlined,
    PlusOutlined,
    SearchOutlined,
    DeleteOutlined,
} from "@ant-design/icons";
import { toast } from "react-hot-toast";
import moment from "moment";
import DatePicker from "react-datepicker"; // React DatePicker
import "react-datepicker/dist/react-datepicker.css";
// import "./TaskManagement.css"; // CSS styling (keeping the comment)
import axios from "../../api/axios"; // Assuming your API client setup

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;
const { RangePicker } = AntDatePicker; // Use the renamed Ant DatePicker component

// --- CONSTANTS ---
const STATUS_COLORS = {
    "To Do": "red",
    "In Progress": "orange",
    Review: "blue",
    Completed: "green",
    "Overdue": "#7f00ff",
};
const STATUS_ORDER = Object.keys(STATUS_COLORS);

// --- TASKFORM COMPONENT (MERGED) ---

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
    isEmployeeEdit,
}) => {
    const [form] = Form.useForm();
    const [fileList, setFileList] = useState([]);

    // Initialize with default or initial values
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
                // Handle nested ID fields from the backend population
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
    }, [visible, initialValues, form, currentUserId]);

    const handleAssignedDateChange = (date) => {
        setAssignedDate(date);
        form.validateFields(['assignedDate']);
    };

    const handleDueDateChange = (date) => {
        setDueDate(date);
        form.validateFields(['dueDate']);
    };

    const validateAssignedDate = () => {
        if (!assignedDate) {
            return Promise.reject(new Error("Select assigned date!"));
        }
        return Promise.resolve();
    };

    const validateDueDate = () => {
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

            // Date validation
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
                // Convert dates to UTC ISO format for backend storage
                assignedDate: moment.utc(assignedDateMoment.startOf("day")).toISOString(),
                dueDate: moment.utc(dueDateMoment.startOf("day")).toISOString(),
                attachments: fileList.map((f) => f.name),
            };

            // Set assignedBy on create
            if (!initialValues) {
                dataToSend.assignedBy = currentUserId;
            }

            // If employee is editing, only send allowed fields (Status & Description)
            if (isEmployeeEdit) {
                const employeeData = {
                    status: dataToSend.status,
                    description: dataToSend.description,
                };
                await onSave(employeeData, initialValues?._id);
            } else {
                // Admin/Team Leader can save all fields
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
                        disabled={isEmployeeEdit}
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
                                disabled={isEmployeeEdit}
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
                                disabled={isEmployeeEdit}
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
                                disabled={isEmployeeEdit}
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
                                disabled={isEmployeeEdit}
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
                                disabled={isEmployeeEdit}
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
};


// --- TASKMANAGEMENT COMPONENT (MAIN) ---

const TaskManagement = () => {
    // Mock current user from localStorage for role-based logic
    const currentUser =
        JSON.parse(localStorage.getItem("user")) || {
            role: "Employee",
            _id: "temp_id_123", // Fallback ID
            name: "Guest User",
        };
    const canAssign = ["Admin", "Team Leader", "Superadmin"].includes(
        currentUser?.role
    );
    const isAdminOrSuper = ["Admin", "Superadmin"].includes(currentUser?.role);

    const [tasks, setTasks] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [allAccounts, setAllAccounts] = useState([]);
    const [allServices, setAllServices] = useState([]);
    const [visible, setVisible] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [loading, setLoading] = useState(false);

    // Filter States
    const [searchText, setSearchText] = useState("");
    const [dateFilter, setDateFilter] = useState("all");
    const [customRange, setCustomRange] = useState(null);
    const [assignedToFilter, setAssignedToFilter] = useState("");

    // --- API FETCH LOGIC ---

    const fetchTasksData = useCallback(async () => {
        setLoading(true);
        try {
            let endpoint = "/api/tasks";
            const params = new URLSearchParams();

            // 1. Assignee Filter Logic (Server-side)
            if (assignedToFilter) {
                params.append('assignedTo', assignedToFilter);
            } else if (!isAdminOrSuper) {
                // Default: Employees only see their own tasks
                params.append('assignedTo', currentUser._id);
            }

            if (params.toString()) {
                endpoint = `${endpoint}?${params.toString()}`;
            }

            const response = await axios.get(endpoint);
            setTasks(response.data);
        } catch (error) {
            console.error("Error fetching tasks:", error);
            message.error("Failed to load tasks.");
        } finally {
            setLoading(false);
        }
    }, [isAdminOrSuper, currentUser._id, assignedToFilter]);

    const fetchDependencies = async () => {
        try {
            const [usersRes, accountsRes, servicesRes] = await Promise.all([
                axios.get("/api/users"),
                axios.get("/api/accounts"),
                axios.get("/api/service"),
            ]);
            setAllUsers(usersRes.data);
            setAllAccounts(accountsRes.data);
            setAllServices(servicesRes.data);
        } catch (error) {
            console.error("Error fetching dependencies:", error);
            message.warning("Could not load users, accounts, or services.");
        }
    };

    useEffect(() => {
        fetchDependencies();
        fetchTasksData();
    }, [fetchTasksData]);

    // --- CRUD HANDLERS ---

    const openForm = (task = null) => {
        setEditingTask(task);
        setVisible(true);
    };
    const closeForm = () => {
        setEditingTask(null);
        setVisible(false);
    };

    const deleteTask = async (taskId) => {
        try {
            await axios.delete(`/api/tasks/${taskId}`);
            message.success("Task deleted successfully! 🗑️");
            fetchTasksData();
        } catch (error) {
            console.error("Delete error:", error);
            message.error("Failed to delete task.");
        }
    };

    const saveTask = async (data, id) => {
        try {
            if (id) {
                // Update operation
                await axios.put(`/api/tasks/${id}`, data);
                message.success("Task updated successfully! 🎉");
            } else {
                // Create operation
                await axios.post("/api/tasks", data);
                message.success("Task created successfully! 🎉");
            }
            fetchTasksData();
            closeForm();
        } catch (error) {
            console.error("Save error:", error);
            message.error(`Failed to save task: ${error.response?.data?.message || error.message}`);
        }
    };

    // --- CLIENT-SIDE FILTERING & GROUPING ---

    const filteredTasks = tasks.filter((task) => {
        const matchesSearch = task.title
            ?.toLowerCase()
            .includes(searchText.toLowerCase());

        // Note: The main assignedTo filter happens on the server (in fetchTasksData), 
        // but keeping this client-side check ensures correctness if filter is active.
        const matchesAssignee = assignedToFilter
            ? task.assignedTo?._id === assignedToFilter
            : true;

        let matchesDate = true;
        if (task.assignedDate) {
            const taskDate = moment(task.assignedDate).startOf("day");
            const today = moment().startOf("day");

            if (dateFilter === "week") {
                matchesDate =
                    taskDate.isSameOrAfter(today.clone().startOf("week")) &&
                    taskDate.isSameOrBefore(today.clone().endOf("week"));
            } else if (dateFilter === "month") {
                matchesDate =
                    taskDate.isSameOrAfter(today.clone().startOf("month")) &&
                    taskDate.isSameOrBefore(today.clone().endOf("month"));
            } else if (dateFilter === "custom" && customRange?.[0] && customRange?.[1]) {
                const start = customRange[0].startOf("day");
                const end = customRange[1].endOf("day");
                matchesDate = taskDate.isBetween(start, end, null, "[]");
            }
        }
        return matchesSearch && matchesAssignee && matchesDate;
    });

    // Group tasks into Kanban columns
    const groupedTasks = filteredTasks.reduce((acc, task) => {
        const isOverdue =
            moment(task.dueDate).isBefore(moment(), "day") &&
            task.status !== "Completed";

        let status = task.status || "To Do";

        if (isOverdue) {
            status = "Overdue";
        }

        if (!acc[status]) acc[status] = [];
        acc[status].push(task);
        return acc;
    }, {});

    // --- RENDER ---

    return (
        <Card
            className="task-management-container"
            title={
                <Title level={4}>
                    <ClockCircleOutlined /> Task Management
                </Title>
            }
        >
            {/* Filters */}
            <Card title="Filters" size="small" className="filter-card" style={{ marginBottom: 20 }}>
                <Row gutter={[16, 16]} align="bottom">
                    <Col xs={24} sm={12} md={6}>
                        <Input
                            placeholder="Search Task Title"
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            allowClear
                        />
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        {/* The Assignee Filter should only be visible to Admin, Team Leader, or Superadmin roles (canAssign) */}
                        {canAssign && (
                            <Select
                                placeholder="Select Assignee"
                                value={assignedToFilter}
                                onChange={setAssignedToFilter}
                                allowClear
                                showSearch
                                style={{ width: "100%" }}
                            >
                                <Option value="">All Assignees</Option>
                                {allUsers.map((user) => (
                                    <Option key={user._id} value={user._id}>
                                        {user.name}
                                    </Option>
                                ))}
                            </Select>
                        )}
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Select
                            value={dateFilter}
                            onChange={(v) => {
                                setDateFilter(v);
                                if (v !== "custom") setCustomRange(null);
                            }}
                            style={{ width: "100%" }}
                        >
                            <Option value="all">All Dates</Option>
                            <Option value="week">This Week</Option>
                            <Option value="month">This Month</Option>
                            <Option value="custom">Custom Range</Option>
                        </Select>
                    </Col>
                    {dateFilter === "custom" && (
                        <Col xs={24} sm={12} md={6}>
                            <RangePicker
                                value={customRange}
                                onChange={setCustomRange}
                                style={{ width: "100%" }}
                            />
                        </Col>
                    )}
                    {canAssign && (
                        <Col xs={24} md={6}>
                            <Button type="primary" icon={<PlusOutlined />} onClick={() => openForm()} block>
                                Add Task
                            </Button>
                        </Col>
                    )}
                </Row>
            </Card>

            {/* Kanban Columns */}
            {loading ? (
                <div style={{ textAlign: "center", padding: 50 }}>
                    <Spin size="large" tip="Loading Tasks..." />
                </div>
            ) : (
                <Row gutter={[20, 0]}>
                    {STATUS_ORDER.map((status) => (
                        <Col key={status} xs={24} sm={12} md={8} lg={6}>
                            <Card
                                title={
                                    <Title level={5} style={{ color: STATUS_COLORS[status] }}>
                                        {status} ({groupedTasks[status]?.length || 0})
                                    </Title>
                                }
                                bodyStyle={{
                                    background: "#f7f8fa",
                                    minHeight: 200,
                                    padding: 8,
                                }}
                            >
                                {(groupedTasks[status] || []).length === 0 ? (
                                    <Empty
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        description={`No tasks in the ${status} lane`}
                                    />
                                ) : (
                                    (groupedTasks[status] || []).map((task) => {
                                        const isOverdue =
                                            moment(task.dueDate).isBefore(moment(), "day") &&
                                            task.status !== "Completed";

                                        const canEdit =
                                            canAssign || task.assignedTo?._id === currentUser._id;

                                        // Flag for TaskForm logic: true if employee editing their own task
                                        const isEmployeeEdit =
                                            !canAssign && task.assignedTo?._id === currentUser._id;

                                        const canDelete = isAdminOrSuper || canAssign;

                                        return (
                                            <Card
                                                key={task._id}
                                                size="small"
                                                className={`task-card-item ${isOverdue ? "overdue" : ""}`}
                                                style={{ marginBottom: 10 }}
                                                actions={[
                                                    canEdit && (
                                                        <Button
                                                            type="link"
                                                            onClick={() => openForm(task)}
                                                            key="edit"
                                                        >
                                                            Edit
                                                        </Button>
                                                    ),
                                                    canDelete && (
                                                        <Popconfirm
                                                            title="Delete this task?"
                                                            onConfirm={() => deleteTask(task._id)}
                                                            okText="Yes"
                                                            cancelText="No"
                                                            key="delete"
                                                        >
                                                            <Button
                                                                type="link"
                                                                danger
                                                                icon={<DeleteOutlined />}
                                                                key="delete-btn"
                                                            >
                                                                Delete
                                                            </Button>
                                                        </Popconfirm>
                                                    ),
                                                ].filter(Boolean)}
                                            >
                                                <Space
                                                    direction="vertical"
                                                    size={6}
                                                    style={{ width: "100%" }}
                                                >
                                                    {/* Task Header */}
                                                    <div className="task-header">
                                                        <Title level={5} style={{ margin: 0 }}>
                                                            {task.title}
                                                        </Title>
                                                        <Tag color={isOverdue ? STATUS_COLORS.Overdue : STATUS_COLORS[task.status]}>
                                                            {isOverdue ? "Overdue" : task.status || "To Do"}
                                                        </Tag>
                                                    </div>

                                                    {/* Assigned By */}
                                                    {task.assignedBy?.name && (
                                                        <div className="task-meta-line">
                                                            <FileTextOutlined style={{ color: '#008cff' }} />{" "}
                                                            <Text type="secondary" style={{ marginLeft: 4, fontSize: 12 }}>
                                                                Assigned By: {task.assignedBy.name}
                                                            </Text>
                                                        </div>
                                                    )}

                                                    {/* Assigned To */}
                                                    <div className="task-meta-line">
                                                        <UserOutlined />{" "}
                                                        <Text style={{ marginLeft: 4 }}>
                                                            {task.assignedTo?.name || "Unassigned"}
                                                        </Text>
                                                    </div>

                                                    {/* Due Date */}
                                                    <div className="task-meta-line">
                                                        <CalendarOutlined />{" "}
                                                        <Text
                                                            style={{
                                                                marginLeft: 4,
                                                                color: isOverdue ? "red" : "inherit",
                                                                fontWeight: isOverdue ? "bold" : 400,
                                                            }}
                                                        >
                                                            {task.dueDate
                                                                ? moment(task.dueDate).format("MMM Do, YYYY")
                                                                : "No Due Date"}
                                                            {isOverdue && " (Overdue)"}
                                                        </Text>
                                                    </div>

                                                    {/* Description snippet */}
                                                    {task.description && (
                                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                                            {task.description.substring(0, 70)}
                                                            {task.description.length > 70 ? '...' : ''}
                                                        </Text>
                                                    )}
                                                </Space>
                                            </Card>
                                        )
                                    })
                                )}
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            <TaskForm
                visible={visible}
                onClose={closeForm}
                onSave={saveTask}
                allUsers={allUsers}
                allAccounts={allAccounts}
                allServices={allServices}
                initialValues={editingTask}
                currentUserId={currentUser._id}
                isEmployeeEdit={!canAssign && editingTask?.assignedTo?._id === currentUser._id}
            />
        </Card>
    );
};

export default TaskManagement;