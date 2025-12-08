// src/components/TaskDetailsDrawer.jsx
import React from "react";
import { Drawer, Descriptions, Tag, Avatar, Space, Button, Popconfirm, message, Typography } from "antd";
import { UserOutlined, EditOutlined, DeleteOutlined, LinkOutlined } from "@ant-design/icons";
import moment from "moment";
import axios from "../../api/axios";

const { Text } = Typography;

const TaskDetailsDrawer = ({ visible, onClose, task, onEdit, onDeleted }) => {
  if (!task) return null;

  // Current date is Wednesday, November 26, 2025.
  // The task logic correctly uses moment() as the reference point for checking overdue status.
  const isOverdue = task.dueDate && moment(task.dueDate).isBefore(moment(), "day") && task.status !== "Completed";

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/tasks/${task._id}`);
      message.success("Task deleted");
      onClose();
      onDeleted && onDeleted();
    } catch (err) {
      console.error(err);
      message.error("Delete failed");
    }
  };

  const getStatusTag = () => {
    if (isOverdue) {
      return <Tag color="purple">Overdue</Tag>;
    }
    
    // Customize color based on status for better visualization
    switch (task.status) {
      case "Completed":
        return <Tag color="green">Completed</Tag>;
      case "In Progress":
        return <Tag color="processing">In Progress</Tag>;
      case "To Do":
      default:
        return <Tag color="blue">To Do</Tag>;
    }
  };

  // Helper to render multiple attachments as clickable links
  const renderAttachments = (attachments) => {
    if (!attachments || attachments.length === 0) {
      return "-";
    }

    return (
      <Space direction="vertical" size={4}>
        {attachments.map((url, index) => (
          <a key={index} href={url} target="_blank" rel="noopener noreferrer">
            <LinkOutlined /> {url.length > 50 ? `${url.substring(0, 50)}...` : url}
          </a>
        ))}
      </Space>
    );
  };


  return (
    <Drawer
      title={task.title}
      placement="right"
      width={600}
      open={visible}
      onClose={onClose}
      className="task-details-drawer" // Added class for potential custom styling
      extra={
        <Space>
          <Button type="primary" icon={<EditOutlined />} onClick={() => onEdit(task)}>
            Edit
          </Button>
          <Popconfirm title="Delete task?" okText="Yes" cancelText="No" onConfirm={handleDelete}>
            <Button danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      }
    >
      <Descriptions bordered size="small" column={1}>
        {/* ROW 1: STATUS */}
        <Descriptions.Item label="Status">
          {getStatusTag()}
          {task.isImportant && <Tag color="red" style={{marginLeft: 8}}>Important</Tag>}
        </Descriptions.Item>

        {/* ROW 2: ASSIGNED BY */}
        <Descriptions.Item label="Assigned By">
          <Space>
            <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#87d068' }} />
            {task.assignedBy?.name || "Unknown"}
          </Space>
        </Descriptions.Item>

        {/* ROW 3: ASSIGNED TO */}
        <Descriptions.Item label="Assigned To">
          <Space>
            <Avatar size="small" icon={<UserOutlined />} />
            {task.assignedTo?.name || "Unassigned"}
          </Space>
        </Descriptions.Item>

        {/* ROW 4: ACCOUNT / SERVICE */}
        <Descriptions.Item label="Account / Service">
          {task.accountId?.businessName || "-"} {task.serviceId ? ` / ${task.serviceId.serviceName}` : ""}
        </Descriptions.Item>

        {/* ROW 5: ASSIGNED DATE */}
        <Descriptions.Item label="Assigned Date">
          {task.assignedDate ? moment(task.assignedDate).format("YYYY-MM-DD") : "-"}
        </Descriptions.Item>

        {/* ROW 6: DUE DATE */}
        <Descriptions.Item label="Due Date">
          <span style={{ color: isOverdue ? "red" : undefined }}>
            {task.dueDate ? moment(task.dueDate).format("YYYY-MM-DD") : "-"}
            {task.startTime && <Text type="secondary" style={{marginLeft: 8}}>{task.startTime}</Text>}
          </span>
        </Descriptions.Item>

        {/* ROW 7: DESCRIPTION */}
        <Descriptions.Item label="Description">
          {task.description || "-"}
        </Descriptions.Item>

        {/* NEW ROW 8: ATTACHMENTS */}
        <Descriptions.Item label="Attachments">
          {renderAttachments(task.extraAttachment)}
        </Descriptions.Item>
        
        {/* NEW ROW 9: REASON (for closing/completion) */}
        {task.reason && (
            <Descriptions.Item label="Completion Note">
                <Text type="success" strong>{task.reason}</Text>
            </Descriptions.Item>
        )}
      </Descriptions>
    </Drawer>
  );
};

export default TaskDetailsDrawer;