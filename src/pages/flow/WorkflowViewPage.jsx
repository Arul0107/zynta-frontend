import React, { useEffect, useState, useMemo } from "react";
import axios from "../../api/axios";
import { useParams } from "react-router-dom";
import ReactFlow, { Background } from "reactflow";
import "reactflow/dist/style.css";

const nodeTypes = {};
const edgeTypes = {};

export default function WorkflowViewPage() {
  const { workflow_id } = useParams();
  const [workflow, setWorkflow] = useState(null);

  useEffect(() => {
    axios
      .get(`/api/workflow/single/${workflow_id}`)
      .then((res) => {
        if (res.data?.workflow) setWorkflow(res.data.workflow);
      })
      .catch(() => console.warn("Failed to load workflow"));
  }, [workflow_id]);

  const nodes = useMemo(() => workflow?.nodes ?? [], [workflow]);
  const edges = useMemo(() => workflow?.edges ?? [], [workflow]);

  return (
    <div style={{ padding: 20 }}>
      <h2>{workflow?.workflowName || "Workflow"}</h2>

      <div style={{ height: 500, border: "1px solid #ccc", borderRadius: 8 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          nodesDraggable={false}
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnDoubleClick={false}
        >
          <Background gap={12} />
        </ReactFlow>
      </div>
    </div>
  );
}
  