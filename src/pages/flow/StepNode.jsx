import { Handle, Position } from "reactflow";
import { CloseOutlined } from "@ant-design/icons";

export default function StepNode({ id, data }) {
  return (
    <div
      style={{
        background: "#0E2B43",
        color: "#fff",
        padding: "12px 22px",
        borderRadius: 14,
        fontWeight: 600,
        position: "relative",
        minWidth: 80,
        textAlign: "center",
      }}
    >
      {/* Delete Button */}
      <span
        onClick={() => data.onDelete(id)}
        style={{
          position: "absolute",
          top: -8,
          right: -8,
          background: "red",
          color: "white",
          borderRadius: "50%",
          cursor: "pointer",
          width: 20,
          height: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10,
        }}
      >
        <CloseOutlined />
      </span>

      {data.label}

      {/* Connection Handles */}
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Top} />
    </div>
  );
}
