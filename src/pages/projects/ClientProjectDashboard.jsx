import React, { useEffect, useState } from "react";
import {
  Card,
  Tag,
  Typography,
  Row,
  Col,
  Progress,
  Divider,
  message,
  Drawer,
  Button,
  Steps,
} from "antd";
import { EyeOutlined, CheckCircleOutlined, ClockCircleOutlined, LoadingOutlined } from "@ant-design/icons";
import api from "../../api/axios";
import dayjs from "dayjs";
import "./ClientProjectDashboard.css";

const { Title, Text } = Typography;
const { Step } = Steps;

const statusColors = {
  Planned: "gold",
  "In Progress": "blue",
  Completed: "green",
  "On Hold": "orange",
  Cancelled: "red",
};

export default function ClientProjectDashboard() {
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const [projects, setProjects] = useState([]);
  const [selectedStep, setSelectedStep] = useState(null);

  useEffect(() => {
    loadClientProjects();
  }, []);

  const loadClientProjects = async () => {
    try {
      const res = await api.get("/api/projects", {
        params: {
          userId: currentUser._id,
          role: "Client",
        },
      });
      setProjects(res.data.projects || []);
    } catch {
      message.error("Failed to load projects");
    }
  };

  const calculateProgress = (steps) => {
    if (!steps?.length) return 0;
    const done = steps.filter((s) => s.status === "Completed").length;
    return Math.round((done / steps.length) * 100);
  };

  const getStepStatus = (status) => {
    switch (status) {
      case "Completed":
        return "finish";
      case "In Progress":
      case "Review":
        return "process";
      case "On Hold":
        return "error";
      default:
        return "wait";
    }
  };

  const openStepDrawer = (step) => setSelectedStep(step);

  return (
    <div className="dashboard-container">
      <Title level={4}>My Projects</Title>
      <Divider />

      {/* INSIGHT CARDS (FIXED CLOSING TAGS) */}
      <Row gutter={[16, 16]} className="insights-row">

        <Col xs={12} md={6}>
          <Card className="insight-card" bordered={false}>
            <Title level={5}>Total Projects</Title>
            <Text>{projects.length}</Text>
          </Card>
        </Col>

        <Col xs={12} md={6}>
          <Card className="insight-card" bordered={false}>
            <Title level={5}>Completed</Title>
            <Text>{projects.filter((p) => p.status === "Completed").length}</Text>
          </Card>
        </Col>

        <Col xs={12} md={6}>
          <Card className="insight-card" bordered={false}>
            <Title level={5}>In Progress</Title>
            <Text>{projects.filter((p) => p.status === "In Progress").length}</Text>
          </Card>
        </Col>

        <Col xs={12} md={6}>
          <Card className="insight-card" bordered={false}>
            <Title level={5}>Pending</Title>
            <Text>
              {projects.filter(
                (p) =>
                  p.status === "Planned" ||
                  p.status === "On Hold" ||
                  p.status === "Review"
              ).length}
            </Text>
          </Card>
        </Col>

      </Row>

      <Divider />

      {/* PROJECT LIST */}
      <Row gutter={[0, 20]}>
        {projects.map((project) => {
          const progress = calculateProgress(project.steps);

          const activeStepIndex = project.steps?.findIndex(
            (s) => s.status === "In Progress" || s.status === "Review"
          );

          const currentStep =
            activeStepIndex === -1
              ? (project.steps?.length || 0)
              : activeStepIndex;

          return (
            <Col span={24} key={project._id}>
              <Card
                hoverable
                className="project-card-full"
                title={project.name}
                extra={<Tag color={statusColors[project.status]}>{project.status}</Tag>}
              >
                <Text strong>Service: </Text>{project?.serviceId?.serviceName}<br />
                <Text strong>Start: </Text>{dayjs(project.startDate).format("DD MMM")}<br />
                <Text strong>End: </Text>{dayjs(project.endDate).format("DD MMM")}

                <Divider />
                <Text strong>Overall Progress</Text>
                <Progress percent={progress} />

                <Divider />
                <Text strong>Assigned Team</Text><br />
                {project.members?.map((m) => (
                  <Tag key={m._id}>{m.name}</Tag>
                ))}

                <Divider />
                <Text strong>Project Steps</Text>

                <Steps current={currentStep} size="small" responsive style={{ marginTop: 15 }}>
                  {project.steps?.map((step, index) => (
                    <Step
                      key={index}
                      title={<span onClick={() => openStepDrawer(step)} style={{ cursor: "pointer" }}>{step.stepName}</span>}
                      description={
                        <div style={{ minWidth: 100 }}>
                          <Tag
                            color={
                              getStepStatus(step.status) === "finish"
                                ? "green"
                                : getStepStatus(step.status) === "process"
                                ? "blue"
                                : "default"
                            }
                            style={{ marginBottom: 4 }}
                          >
                            {step.status}
                          </Tag>

                          <div style={{ fontSize: 12, color: "#888" }}>
                            {step.description?.length > 30
                              ? step.description.substring(0, 30) + "..."
                              : step.description}
                          </div>

                          <Button
                            type="link"
                            icon={<EyeOutlined />}
                            size="small"
                            style={{ paddingLeft: 0 }}
                            onClick={() => openStepDrawer(step)}
                          >
                            Details
                          </Button>
                        </div>
                      }
                      status={getStepStatus(step.status)}
                      icon={
                        step.status === "Completed" ? (
                          <CheckCircleOutlined />
                        ) : step.status === "In Progress" ? (
                          <LoadingOutlined />
                        ) : step.status === "Review" ? (
                          <ClockCircleOutlined />
                        ) : null
                      }
                    />
                  ))}
                </Steps>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* STEP DETAILS DRAWER */}
      <Drawer
        title={selectedStep?.stepName}
        placement="right"
        width={380}
        onClose={() => setSelectedStep(null)}
        open={!!selectedStep}
      >
        <p><b>Status:</b> {selectedStep?.status}</p>
        <p><b>Description:</b> {selectedStep?.description || "Not Provided"}</p>

        {selectedStep?.url && (
          <p>
            <a href={selectedStep.url} target="_blank" rel="noreferrer">
              View File 🔗
            </a>
          </p>
        )}

        {selectedStep?.updatedAt && (
          <p><b>Last Updated:</b> {dayjs(selectedStep.updatedAt).format("DD MMM YYYY")}</p>
        )}
      </Drawer>
    </div>
  );
}
