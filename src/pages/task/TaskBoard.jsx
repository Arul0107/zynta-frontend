// src/pages/TaskBoard.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Card,
  Tag,
  Button,
  Empty,
  Spin,
  Avatar, Badge,
  Typography,
  message,
  Popconfirm,
  Select,
  Input,
  Row,
  Col
} from "antd";
import {
  PlusOutlined,
  CalendarOutlined,
  UserOutlined,
  DeleteOutlined
} from "@ant-design/icons";
import axios from "../../api/axios";
import moment from "moment";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useNavigate } from "react-router-dom";
import "./TaskManagement.css";

import TaskForm from "./TaskForm";
import TaskDetailsDrawer from "./TaskDetailsDrawer";

const { Title, Text } = Typography;
const { Option } = Select;

const STATUS_ORDER = ["To Do", "In Progress", "Review", "Completed", "Overdue"];
const STATUS_COLORS = {
  "To Do": "red",
  "In Progress": "orange",
  Review: "blue",
  Completed: "green",
  Overdue: "#7f00ff"
};

const TaskBoard = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  // FILTERS
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterAssignedTo, setFilterAssignedTo] = useState("");
  const [allUsers, setAllUsers] = useState([]);

  // DETAILS & DRAWER
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerEditingTask, setDrawerEditingTask] = useState(null);

  const currentUser =
    JSON.parse(localStorage.getItem("user")) || { role: "Employee", _id: "temp", name: "Unknown" };

  const isPrivileged =
    ["Admin", "Superadmin", "SuperAdmin", "Team Leader"].includes(currentUser.role);

  // Load users for Assigned filter
  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get("/api/users");
      setAllUsers(res.data || []);
    } catch (err) {
      console.error("User load error", err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Load tasks from backend
  const fetchTasks = useCallback(
    async (opts = {}) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();

        const qSearch = opts.search ?? search;
        const qStatus = opts.status ?? filterStatus;
        const qAssignedTo = opts.assignedTo ?? filterAssignedTo;

        if (!isPrivileged && !qAssignedTo) {
          params.append("assignedTo", currentUser._id);
        } else {
          if (qAssignedTo) params.append("assignedTo", qAssignedTo);
        }

        if (qStatus) params.append("status", qStatus);
        if (qSearch) params.append("search", qSearch);

        const res = await axios.get(`/api/tasks?${params.toString()}`);

        if (Array.isArray(res.data)) setTasks(res.data);
        else if (res.data.tasks) setTasks(res.data.tasks);
        else setTasks([]);

      } catch (err) {
        console.error("Fetch tasks err", err);
        message.error("Failed to load tasks.");
      } finally {
        setLoading(false);
      }
    },
    [search, filterStatus, filterAssignedTo, currentUser._id, isPrivileged]
  );

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Apply filters automatically (with delay)
  useEffect(() => {
    const t = setTimeout(() => {
      fetchTasks({ search, status: filterStatus, assignedTo: filterAssignedTo });
    }, 200);
    return () => clearTimeout(t);
  }, [search, filterStatus, filterAssignedTo, fetchTasks]);

  const handleDeleteTask = async (taskId) => {
    try {
      await axios.delete(`/api/tasks/${taskId}`);
      message.success("Task deleted");
      fetchTasks();
    } catch (err) {
      console.error(err);
      message.error("Failed to delete task");
    }
  };

  const groupTasks = useCallback(() => {
    const grouped = {};
    (tasks || []).forEach((t) => {
      const overdue =
        t.dueDate &&
        moment(t.dueDate).isBefore(moment(), "day") &&
        t.status !== "Completed";

      const key = overdue ? "Overdue" : t.status || "To Do";

      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(t);
    });

    STATUS_ORDER.forEach((s) => {
      if (!grouped[s]) grouped[s] = [];
    });

    return grouped;
  }, [tasks]);

  const grouped = useMemo(() => groupTasks(), [groupTasks]);

  // DRAG END
  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index)
      return;

    const g = groupTasks();
    const sourceList = Array.from(g[source.droppableId]);
    const [moved] = sourceList.splice(source.index, 1);

    const destList = Array.from(g[destination.droppableId]);

    const newStatus =
      destination.droppableId === "Overdue"
        ? moved.status
        : destination.droppableId;

    moved.status = newStatus;

    destList.splice(destination.index, 0, moved);

    const newTasks = [].concat(
      ...STATUS_ORDER.map((s) =>
        s === source.droppableId
          ? sourceList
          : s === destination.droppableId
            ? destList
            : g[s]
      )
    );

    setTasks(newTasks);

    try {
      await axios.put(`/api/tasks/${draggableId}`, { status: newStatus });
      fetchTasks();
    } catch (err) {
      console.error(err);
      message.error("Failed to update task.");
      fetchTasks();
    }
  };

  const openDetails = (task) => {
    setSelectedTask(task);
    setDetailsVisible(true);
  };

  const openDrawerForEdit = (task) => {
    setDrawerEditingTask(task || null);
    setDrawerVisible(true);
  };

  const resetFilters = () => {
    setSearch("");
    setFilterStatus("");
    setFilterAssignedTo("");
    fetchTasks({ search: "", status: "", assignedTo: "" });
  };

  return (
    <Card
      title={<Title level={4}>Task Board</Title>}
      extra={
        <div style={{ display: "flex", gap: 8 }}>
          {/* SHOW BUTTON ONLY FOR PRIVILEGED ROLES */}
          {isPrivileged && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openDrawerForEdit(null)}
            >
              New Task
            </Button>
          )}
        </div>
      }
    >
      {/* FILTER BAR */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={10} md={8} lg={6}>
          <Input.Search
            placeholder="Search task..."
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Col>

        <Col xs={12} sm={6} md={5} lg={4}>
          <Select
            placeholder="Status"
            allowClear
            value={filterStatus}
            onChange={(v) => setFilterStatus(v)}
            style={{ width: "100%" }}
          >
            <Option value="">All</Option>
            {STATUS_ORDER.map((s) => (
              <Option key={s} value={s}>
                {s}
              </Option>
            ))}
          </Select>
        </Col>

        <Col xs={12} sm={8} md={6} lg={6}>
          <Select
            placeholder="Assigned To"
            allowClear
            value={filterAssignedTo}
            onChange={(v) => setFilterAssignedTo(v)}
            showSearch
            optionFilterProp="children"
            style={{ width: "100%" }}
          >
            <Option value="">All</Option>
            {allUsers.map((u) => (
              <Option key={u._id} value={u._id}>
                {u.name}
              </Option>
            ))}
          </Select>
        </Col>

        <Col>
          <Button onClick={resetFilters}>Reset</Button>
        </Col>
      </Row>

      {/* BOARD */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin size="large" />
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="kanban-board-row">
            {STATUS_ORDER.filter((st) => {
              if (filterStatus) return st === filterStatus;
              return true;
            }).map((status) => (
              <div key={status} className="kanban-column">
                <Card
                  className="kanban-column-card"
                  title={
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Title level={5} style={{ margin: 0, color: STATUS_COLORS[status] }}>
                        {status}
                      </Title>
                      <Tag>{grouped[status]?.length}</Tag>
                    </div>
                  }
                  size="small"
                >
                  <Droppable droppableId={status}>
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} className="task-list">
                        {grouped[status].map((task, index) => {
                          const overdue =
                            task.dueDate &&
                            moment(task.dueDate).isBefore(moment(), "day") &&
                            task.status !== "Completed";

                          const statusClass = overdue
                            ? "overdue"
                            : task.status.replace(/\s/g, "").toLowerCase();

                          return (
                         <Draggable draggableId={task._id} index={index} key={task._id}>
  {(prov) => {
    const cardInner = (
      <div
        ref={prov.innerRef}
        {...prov.draggableProps}
        {...prov.dragHandleProps}
        className={`task-card-item ${statusClass}`}
        onClick={(e) => {
          if (e.target.closest(".delete-btn")) return;
          openDetails(task);
        }}
        style={{ position: "relative" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Title level={5} style={{ margin: 0 }}>
            {task.title}
          </Title>

          <Popconfirm
            title="Delete this task?"
            onConfirm={() => handleDeleteTask(task._id)}
            okText="Yes"
            cancelText="No"
          >
            <DeleteOutlined
              className="delete-btn"
              style={{
                color: isPrivileged ? "red" : "#999",
                fontSize: 16,
                cursor: isPrivileged ? "pointer" : "not-allowed"
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (!isPrivileged) message.error("You do not have permission");
              }}
            />
          </Popconfirm>
        </div>

        {task.description && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {task.description.length > 80
              ? task.description.substring(0, 80) + "..."
              : task.description}
          </Text>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Avatar size="small" icon={<UserOutlined />} />
            <Text style={{ fontSize: 12 }}>
              {task.assignedTo?.name || "Unassigned"}
            </Text>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <CalendarOutlined />
            <Text style={{ fontSize: 12, color: overdue ? "red" : "" }}>
              {task.dueDate ? moment(task.dueDate).format("MMM Do") : "No Due"}
            </Text>
          </div>
        </div>
      </div>
    );

    return task.isImportant ? (
      <Badge.Ribbon
        text="Important"
        color="red"
        placement="start"
        key={task._id}
        style={{ zIndex: 20 }}
      >
        {cardInner}
      </Badge.Ribbon>
    ) : (
      cardInner
    );
  }}
</Draggable>

                          );
                        })}

                        {provided.placeholder}

                        {grouped[status].length === 0 && (
                          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No tasks" />
                        )}
                      </div>
                    )}
                  </Droppable>
                </Card>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}

      {/* Details Drawer */}
      <TaskDetailsDrawer
        visible={detailsVisible}
        task={selectedTask}
        onClose={() => setDetailsVisible(false)}
        onEdit={(task) => {
          setDetailsVisible(false);
          setTimeout(() => openDrawerForEdit(task), 200);
        }}
        onDeleted={() => {
          setDetailsVisible(false);
          fetchTasks();
        }}
      />

      {/* New/Edit Task Drawer */}
      <TaskForm
        visible={drawerVisible}
        editing={drawerEditingTask}
        onClose={() => {
          setDrawerVisible(false);
          setDrawerEditingTask(null);
        }}
        onSaved={() => {
          setDrawerVisible(false);
          fetchTasks();
        }}
      />
    </Card>
  );
};

export default TaskBoard;
