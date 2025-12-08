import { useContext, useEffect } from "react";
import toast from "react-hot-toast";
import { PresenceContext } from "../context/PresenceContext";

export default function LeaveSocketListener() {
  const { socket } = useContext(PresenceContext);

  useEffect(() => {
    if (!socket) return;

    const handleLeaveRequest = (data) => {
      toast.success(`📩 Leave Request from ${data.name}`);
    };

    const handleLeaveResponse = ({ status, reason }) => {
      if (status === "Approved") {
        toast.success("🎉 Your Leave Has Been Approved");
      } else {
        toast.error(`⛔ Leave Rejected: ${reason || "No reason provided"}`);
      }
    };

    socket.on("leave_request_received", handleLeaveRequest);
    socket.on("leave_response", handleLeaveResponse);

    return () => {
      socket.off("leave_request_received", handleLeaveRequest);
      socket.off("leave_response", handleLeaveResponse);
    };
  }, [socket]);

  return null;
}
