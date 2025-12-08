import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactFlow, {
  Controls,
  Background,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  getConnectedEdges
} from "reactflow";
import "reactflow/dist/style.css";
import { Button, Input, Modal } from "antd";
import axios from "../../api/axios";
import toast from "react-hot-toast";

export default function WorkflowBuilder({ isEdit }) {
  const { service_id, workflow_id } = useParams();
  const navigate = useNavigate();

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [workflowName, setWorkflowName] = useState("");

  const [addModal, setAddModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState(null);
  const [stepName, setStepName] = useState("");

  useEffect(() => {
    if (isEdit && workflow_id) {
      axios.get(`/api/workflow/single/${workflow_id}`).then((res) => {
        setWorkflowName(res.data.workflowName);
        setNodes(res.data.nodes);
        setEdges(res.data.edges);
      });
    }
  }, [isEdit, workflow_id]);

  const onNodesChange = (changes) =>
    setNodes((nds) => applyNodeChanges(changes, nds));

  const onEdgesChange = (changes) =>
    setEdges((eds) => applyEdgeChanges(changes, eds));

  const onConnect = (params) =>
    setEdges((eds) => addEdge({ ...params, animated: true }, eds));

  const addStep = () => {
    if (!stepName.trim()) {
      toast.error("Enter step name!");
      return;
    }

    setNodes((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        data: { label: stepName },
        position: { x: 200, y: 120 + prev.length * 70 },
        style: {
          background: "#0E2B43",
          color: "#fff",
          padding: 10,
          borderRadius: 8
        }
      }
    ]);

    setStepName("");
    setAddModal(false);
    toast.success("Step Added!");
  };

  const deleteNode = () => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeToDelete.id));
    setEdges((eds) =>
      eds.filter(
        (e) =>
          !getConnectedEdges([nodeToDelete], eds)
            .map((ce) => ce.id)
            .includes(e.id)
      )
    );

    setDeleteModal(false);
    toast.success("Step Deleted!");
  };

  const saveWorkflow = async () => {
    if (!workflowName.trim()) {
      toast.error("Workflow name required!");
      return;
    }

    if (!nodes.length) {
      toast.error("Add at least one step!");
      return;
    }

    const data = { workflowName, nodes, edges };

    try {
      if (isEdit) {
        const res = await axios.put(`/api/workflow/${workflow_id}`, data);

        let sid = res.data?.service_id;

        // fallback if backend didn't send service_id
        if (!sid) {
          const againRes = await axios.get(`/api/workflow/single/${workflow_id}`);
          sid = againRes.data?.service_id;
        }

        if (!sid) {
          toast.error("Service ID missing! Check backend response.");
          return;
        }

        toast.success("Workflow Updated Successfully!");
        return navigate(`/workflow/${sid}/list`);
      }

      // Create workflow
      await axios.post(`/api/workflow/${service_id}`, data);
      toast.success("Workflow Created Successfully!");
      return navigate(`/workflow/${service_id}/list`);

    } catch (error) {
      toast.error("Failed to save workflow!");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>{isEdit ? "Edit Workflow" : "Create Workflow"}</h2>

      <Input
        placeholder="Workflow Name"
        value={workflowName}
        onChange={(e) => setWorkflowName(e.target.value)}
        style={{ width: 280, marginBottom: 10 }}
      />

      <div style={{ height: 450, border: "1px solid #ccc" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, n) => {
            setNodeToDelete(n);
            setDeleteModal(true);
          }}
          fitView
        >
          <Controls />
          <Background />
        </ReactFlow>
      </div>

      <Button style={{ marginTop: 10 }} onClick={() => setAddModal(true)}>
        + Add Step
      </Button>

      <Button
        type="primary"
        danger
        onClick={saveWorkflow}
        style={{ marginLeft: 10 }}
      >
        Save Workflow
      </Button>

      {/* Add Step Modal */}
      <Modal
        open={addModal}
        onOk={addStep}
        onCancel={() => setAddModal(false)}
        title="Add Step"
      >
        <Input
          placeholder="Step name"
          value={stepName}
          onChange={(e) => setStepName(e.target.value)}
        />
      </Modal>

      {/* Delete Step Modal */}
      <Modal
        open={deleteModal}
        title="Delete Step?"
        okText="Delete"
        okButtonProps={{ danger: true }}
        onOk={deleteNode}
        onCancel={() => setDeleteModal(false)}
      >
        Are you sure you want to delete this step?
      </Modal>
    </div>
  );
}
