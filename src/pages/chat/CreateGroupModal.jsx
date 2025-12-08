// server/frontend/src/components/chat/CreateGroupModal.jsx

import React, { useState, useEffect } from "react";
import axios from "../../api/axios"; // Assuming axios is available
import { CloseOutlined, UsergroupAddOutlined } from "@ant-design/icons";

export default function CreateGroupModal({ allUsers, loggedUser, onClose, onGroupCreated }) {
    const [groupName, setGroupName] = useState("");
    // Holds only the IDs of the selected members
    const [selectedMembers, setSelectedMembers] = useState([]); 
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);

    // Filter users based on search term and exclude the current user
    const filteredUsers = allUsers.filter(u => 
        u._id !== loggedUser._id && 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleToggleMember = (userId) => {
        setSelectedMembers(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId) // Remove
                : [...prev, userId] // Add
        );
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim() || selectedMembers.length < 1) {
            alert("Please name the group and select at least one member.");
            return;
        }

        setLoading(true);

        try {
            // The API endpoint will automatically add the admin (loggedUser._id) to the members array
            const payload = {
                name: groupName.trim(),
                members: selectedMembers, // Just the user IDs selected from the list
                adminId: loggedUser._id, // The ID of the current user creating the group
            };

            const res = await axios.post("/api/groups", payload); 
            
            // Notify the parent component with the newly created group data
            onGroupCreated(res.data);
            onClose();

        } catch (err) {
            console.error("Group creation failed:", err);
            alert("Failed to create group. Check server logs.");
        } finally {
            setLoading(false);
        }
    };

    return (
        // Modal Overlay: Closes when clicking outside
        <div className="modal-overlay" onClick={onClose}>
            {/* Modal Content: Stops click propagation */}
            <div className="modal-content group-modal" onClick={e => e.stopPropagation()}>
                
                <div className="modal-header">
                    <h4><UsergroupAddOutlined /> Create New Group</h4>
                    <button className="close-btn" onClick={onClose}><CloseOutlined /></button>
                </div>
                
                <div className="modal-body">
                    {/* Group Name Input */}
                    <input
                        type="text"
                        placeholder="Group Name (e.g., Marketing Team)"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className="group-name-input"
                    />

                    {/* Search Input for Users */}
                    <div className="search-bar" style={{ marginTop: '10px' }}>
                        <input
                            type="text"
                            placeholder="Search users to add..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Selected Count */}
                    <p className="selected-count">
                        Selected: {selectedMembers.length} member(s)
                        {selectedMembers.length > 0 && <span> (+ You)</span>}
                    </p>

                    {/* User Selection List */}
                    <div className="user-selection-list">
                        {filteredUsers.length === 0 && <p className="empty-state">No users found.</p>}
                        
                        {filteredUsers.map((u) => (
                            <div 
                                key={u._id} 
                                className={`user-select-item ${selectedMembers.includes(u._id) ? "selected" : ""}`}
                                onClick={() => handleToggleMember(u._id)}
                            >
                                <div className="avatar small">{u.name?.charAt(0)}</div>
                                <span className="u-name">{u.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Modal Footer with Create Button */}
                <div className="modal-footer">
                    <button 
                        className="btn primary" 
                        onClick={handleCreateGroup} 
                        disabled={loading || selectedMembers.length < 1 || !groupName.trim()}
                    >
                        {loading ? "Creating..." : `Create Group (${selectedMembers.length + 1} Total)`}
                    </button>
                </div>
            </div>
        </div>
    );
}