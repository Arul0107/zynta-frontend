import React from "react";
import {
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import "./chat.css";

export default function AttachmentRenderer({ attachment, onZoom }) {
  if (!attachment || !attachment.url) return null;

  const url = attachment.url;
  const filename = attachment.filename || url.split("/").pop();
  const ext = filename.split(".").pop().toLowerCase();

  const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
  const isDocument = ["pdf", "doc", "docx", "xls", "xlsx", "txt"].includes(ext);

  // IMAGE → Zoomable
  if (isImage) {
    return (
      <img
        src={url}
        alt={filename}
        className="msg-image"
        onClick={() => onZoom && onZoom(url)}
        style={{ cursor: "zoom-in" }}
      />
    );
  }

  // SELECT ICON
  const icon =
    ext === "pdf" ? (
      <FilePdfOutlined className="doc-icon" />
    ) : ["doc", "docx"].includes(ext) ? (
      <FileWordOutlined className="doc-icon" />
    ) : ["xls", "xlsx"].includes(ext) ? (
      <FileExcelOutlined className="doc-icon" />
    ) : (
      <FileTextOutlined className="doc-icon" />
    );

  if (isDocument) {
    return (
      <div className="doc-bubble">
        <div className="doc-icon-box">{icon}</div>

        <div className="doc-info">
          <div className="doc-filename">{filename}</div>
          <div className="doc-meta">Document</div>
        </div>

        <a href={url} target="_blank" rel="noopener noreferrer" className="doc-download">
          <DownloadOutlined />
        </a>
      </div>
    );
  }

  return null;
}
