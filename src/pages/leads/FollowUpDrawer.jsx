import React, { useState, useEffect } from 'react';
import {
  Drawer, Button, Input, DatePicker, List, Typography, Divider, Modal
} from 'antd';
import axios from '../../api/axios';
import { toast } from 'react-hot-toast';
import moment from 'moment';
import { UserOutlined, ClockCircleOutlined, MessageOutlined } from '@ant-design/icons'; // Import icons

const { TextArea } = Input;
const { Text } = Typography;

/**
 * FollowUpDrawer component for managing follow-ups related to an account.
 * It allows viewing, adding, editing, and deleting follow-up notes.
 *
 * @param {object} props - The component props.
 * @param {boolean} props.visible - Controls the visibility of the drawer.
 * @param {function} props.onClose - Callback function to close the drawer.
 * @param {object} props.account - The account object to which follow-ups are associated.
 * @param {function} props.refreshAccounts - Callback to refresh the account list after changes.
 */
const FollowUpDrawer = ({ visible, onClose, account, refreshAccounts }) => {
  const [comment, setComment] = useState('');
  const [followupDate, setFollowupDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [followUps, setFollowUps] = useState([]);
  const [editingFollowUp, setEditingFollowUp] = useState(null);

  useEffect(() => {
    if (visible && account?._id) {
      fetchFollowUps();
    } else {
      setFollowUps([]);
      setEditingFollowUp(null);
      setComment('');
      setFollowupDate(null);
    }
  }, [visible, account]);

  const fetchFollowUps = async () => {
    if (!account?._id) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/accounts/${account._id}/followups`);
      setFollowUps(res.data.sort((a, b) => moment(b.createdAt).diff(moment(a.createdAt))) || []);
    } catch (err) {
      console.error("Error fetching follow-ups:", err);
      toast.error('Failed to fetch follow-ups');
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrUpdate = () => {
    if (!comment.trim() || !followupDate) {
      toast.error('Please select a date and enter a note for the follow-up.');
      return;
    }

    const user = JSON.parse(localStorage.getItem('user'));
    const addedBy = user?._id;
    if (!addedBy) {
      toast.error('User information not found. Please log in.');
      return;
    }

    setLoading(true);

    const payload = {
      date: followupDate.toISOString(),
      note: comment.trim(),
      addedBy
    };

    const request = editingFollowUp === null
      ? axios.post(`/api/accounts/${account._id}/followups`, payload)
      : axios.put(`/api/accounts/${account._id}/followups/${editingFollowUp._id}`, payload);

    request
      .then(() => {
        toast.success(editingFollowUp === null ? 'Follow-up added successfully!' : 'Follow-up updated successfully!');
        setComment('');
        setFollowupDate(null);
        setEditingFollowUp(null);
        fetchFollowUps();
        if (typeof refreshAccounts === 'function') {
          refreshAccounts();
        }
      })
      .catch((err) => {
        console.error("Error saving follow-up:", err);
        toast.error(err?.response?.data?.message || 'Failed to save follow-up.');
      })
      .finally(() => setLoading(false));
  };

  const handleEdit = (item) => {
    setComment(item.note);
    setFollowupDate(moment(item.date));
    setEditingFollowUp(item);
  };

  const handleDelete = (followUpId) => {
    Modal.confirm({
      title: 'Delete Follow-up',
      content: 'Are you sure you want to delete this follow-up? This action cannot be undone.',
      okText: 'Yes, Delete',
      cancelText: 'No',
      okButtonProps: { danger: true },
      onOk: () => {
        setLoading(true);
        axios.delete(`/api/accounts/${account._id}/followups/${followUpId}`)
          .then(() => {
            toast.success('Follow-up deleted successfully!');
            fetchFollowUps();
            if (typeof refreshAccounts === 'function') {
              refreshAccounts();
            }
          })
          .catch((err) => {
            console.error("Error deleting follow-up:", err);
            toast.error(err?.response?.data?.message || 'Failed to delete follow-up.');
          })
          .finally(() => setLoading(false));
      }
    });
  };

  /**
   * Renders a single follow-up item for the Ant Design List component.
   * This now includes styling to mimic the message bubble from your image.
   * @param {object} item - The follow-up object to render.
   * @returns {JSX.Element} The rendered List.Item.
   */
  const renderFollowUpItem = (item) => (
    <List.Item
      // actions={[
      //   <Button key="edit" type="link" onClick={() => handleEdit(item)}>Edit</Button>,
      //   <Button key="delete" type="link" danger onClick={() => handleDelete(item._id)}>Delete</Button>
      // ]}
      // style={{
      //   borderBottom: 'none', // Remove default list item border
      //   paddingBottom: '0px',
      //   marginBottom: '15px', // More space between bubbles
      //   alignItems: 'flex-start', // Align actions to the top if the bubble is tall
      // }}
    >
      <div style={{
        backgroundColor: '#f0f2f5', // Light grey background for the bubble
        borderRadius: '12px', // Rounded corners
        padding: '10px 15px', // Padding inside the bubble
        maxWidth: 'calc(100% - 80px)', // Adjust max width to leave space for actions
        flexGrow: 1, // Allow the bubble to grow
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
          <UserOutlined style={{ marginRight: '5px', color: '#888' }} />
          <Text strong style={{ marginRight: '10px', color: '#333' }}>
            {item.addedBy?.name || item.addedBy?.email || 'Unknown User'}
          </Text>
          <ClockCircleOutlined style={{ marginRight: '5px', color: '#888' }} />
          <Text type="secondary" style={{ fontSize: '0.8em' }}>
            {moment(item.createdAt).format('DD/MM/YYYY, h:mm:ss A')} {/* Match format from image */}
          </Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <MessageOutlined style={{ marginRight: '8px', marginTop: '3px', color: '#555' }} />
            <Text style={{ flexGrow: 1 }}>{item.note}</Text>
        </div>
      </div>
    </List.Item>
  );

  return (
    <Drawer
      title={`Follow-ups for Account: ${account?.businessName || 'N/A'}`}
      open={visible}
      onClose={() => {
        setEditingFollowUp(null);
        setComment('');
        setFollowupDate(null);
        onClose();
      }}
      width={720}
    >
      <div style={{ marginBottom: 20 }}>
        <DatePicker
          style={{ width: '100%', marginBottom: 8 }}
          format="DD-MM-YYYY"
          value={followupDate}
          onChange={(date) => setFollowupDate(date)}
          placeholder="Select follow-up date"
        />
        <TextArea
          rows={4}
          placeholder="Enter follow-up note"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <Button
          type="primary"
          style={{ marginTop: 10, backgroundColor: '#0E2B43', borderColor: '#0E2B43', color: 'white' }}
          block
          onClick={handleAddOrUpdate}
          loading={loading}
        >
          {editingFollowUp === null ? 'Add Follow-up' : 'Update Follow-up'}
        </Button>
      </div>

      <Divider>All Follow-ups ({followUps.length})</Divider>
      <List
        dataSource={followUps}
        renderItem={renderFollowUpItem}
        locale={{ emptyText: 'No follow-ups found for this account.' }}
        style={{ marginTop: 16 }}
      />
    </Drawer>
  );
};

export default FollowUpDrawer;