import React, { useState, useEffect } from 'react';
import {
  Drawer, Button, Input, DatePicker, Tabs, List, Typography, Divider, Modal
} from 'antd';
import axios from '../../api/axios';
import { toast } from 'react-hot-toast';
import moment from 'moment';

const { TextArea } = Input;
const { TabPane } = Tabs;
const { Text } = Typography; // Destructure Text from Typography

/**
 * FollowUpDrawer component for managing follow-ups related to an invoice.
 * It allows viewing, adding, editing, and deleting follow-up notes.
 *
 * @param {object} props - The component props.
 * @param {boolean} props.visible - Controls the visibility of the drawer.
 * @param {function} props.onClose - Callback function to close the drawer.
 * @param {object} props.invoice - The invoice object to which follow-ups are associated.
 * @param {function} props.refreshInvoices - Callback to refresh the invoice list after changes.
 */
const FollowUpDrawer = ({ visible, onClose, invoice, refreshInvoices }) => {
  const [comment, setComment] = useState('');
  const [followupDate, setFollowupDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [followUps, setFollowUps] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);

  // Fetch follow-ups when the drawer becomes visible or the invoice changes
  useEffect(() => {
    if (visible && invoice?._id) {
      fetchFollowUps();
    }
  }, [visible, invoice]);

  /**
   * Fetches the follow-ups for the current invoice from the backend.
   */
  const fetchFollowUps = async () => {
    try {
      // API endpoint adjusted to fetch follow-ups by invoice ID
      const res = await axios.get(`/api/invoices/${invoice._id}/followups`);
      setFollowUps(res.data || []);
    } catch (err) {
      console.error("Failed to fetch follow-ups:", err);
      toast.error('Failed to fetch follow-ups');
    }
  };

  /**
   * Handles adding a new follow-up or updating an existing one.
   * Performs validation, constructs payload, and calls the appropriate API.
   */
  const handleAddOrUpdate = () => {
    if (!comment || !followupDate) {
      toast.error('Please fill in both date and note fields.');
      return;
    }

    const user = JSON.parse(localStorage.getItem('user'));
    // Ensure 'addedBy' is sent. Assuming the user ID is in localStorage.
    const addedBy = user?._id;
    if (!addedBy) {
      toast.error('User information not found. Please log in.');
      return;
    }

    setLoading(true);

    const payload = {
      date: followupDate.format('YYYY-MM-DD'),
      note: comment,
      addedBy // The ID of the user adding/updating the follow-up
    };

    const request = editingIndex === null
      ? axios.post(`/api/invoices/${invoice._id}/followups`, payload) // POST for new
      : axios.put(`/api/invoices/${invoice._id}/followups/${editingIndex}`, payload); // PUT for update

    request
      .then(() => {
        toast.success(editingIndex === null ? 'Follow-up added successfully!' : 'Follow-up updated successfully!');
        setComment(''); // Clear input fields
        setFollowupDate(null);
        setEditingIndex(null); // Reset editing state
        fetchFollowUps(); // Refresh the list of follow-ups
        refreshInvoices(); // Refresh the main invoice list
      })
      .catch((err) => {
        console.error("Error saving follow-up:", err);
        toast.error(err?.response?.data?.message || 'Failed to save follow-up.');
      })
      .finally(() => setLoading(false));
  };

  /**
   * Sets up the drawer for editing an existing follow-up.
   * @param {number} index - The index of the follow-up to edit in the `followUps` array.
   */
  const handleEdit = (index) => {
    const f = followUps[index];
    setComment(f.note);
    setFollowupDate(moment(f.date)); // Set date with moment object
    setEditingIndex(index);
  };

  /**
   * Handles the deletion of a follow-up after confirmation.
   * @param {number} index - The index of the follow-up to delete in the `followUps` array.
   */
  const handleDelete = (index) => {
    Modal.confirm({
      title: 'Delete Follow-up',
      content: 'Are you sure you want to delete this follow-up? This action cannot be undone.',
      okText: 'Yes, Delete',
      cancelText: 'No',
      okButtonProps: { danger: true },
      onOk: () => {
        axios.delete(`/api/invoices/${invoice._id}/followups/${index}`)
          .then(() => {
            toast.success('Follow-up deleted successfully!');
            fetchFollowUps(); // Refresh the list
            refreshInvoices(); // Refresh the main invoice list
          })
          .catch((err) => {
            console.error("Error deleting follow-up:", err);
            toast.error(err?.response?.data?.message || 'Failed to delete follow-up.');
          });
      }
    });
  };

  // Filter and sort follow-ups by date for display in tabs
  const today = moment().format('YYYY-MM-DD');
  const sorted = [...followUps].sort((a, b) => new Date(b.date) - new Date(a.date));

  const todayFollowUps = sorted.filter(f =>
    moment(f.date).format('YYYY-MM-DD') === today
  );
  const upcoming = sorted.filter(f =>
    moment(f.date).isAfter(today, 'day')
  );
  const past = sorted.filter(f =>
    moment(f.date).isBefore(today, 'day')
  );

  /**
   * Renders a single follow-up item for the Ant Design List component.
   * @param {object} item - The follow-up object to render.
   * @param {number} actualIndex - The original index of the item in the `followUps` array (needed for edit/delete actions).
   * @returns {JSX.Element} The rendered List.Item.
   */
  const renderFollowUpItem = (item, actualIndex) => (
    <List.Item
      actions={[
        <Button key="edit" type="link" onClick={() => handleEdit(actualIndex)}>Edit</Button>,
        <Button key="delete" type="link" danger onClick={() => handleDelete(actualIndex)}>Delete</Button>
      ]}
    >
      <div>
        <Text strong>
          {moment(item.date).format('DD-MM-YYYY')}
        </Text><br />
        {item.note}<br />
        <Text type="secondary">
          By {item.addedBy?.name || item.addedBy?.email || 'Unknown User'}
        </Text>
      </div>
    </List.Item>
  );

  return (
    <Drawer
      title={`Follow-ups for Invoice: ${invoice?.invoiceNumber || invoice?.proformaNumber || 'N/A'}`}
      open={visible}
      onClose={() => {
        // Reset state when closing the drawer
        setEditingIndex(null);
        setComment('');
        setFollowupDate(null);
        onClose(); // Call parent onClose handler
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
                      style={{ marginTop: 10 , backgroundColor: '#0E2B43', borderColor: '#orange', color: 'white' }}

          block
          onClick={handleAddOrUpdate}
          loading={loading}
        >
          {editingIndex === null ? 'Add Follow-up' : 'Update Follow-up'}
        </Button>
      </div>

      <Divider>Existing Follow-ups</Divider>
      <Tabs defaultActiveKey="today">
        <TabPane tab={`Today's (${todayFollowUps.length})`} key="today">
          <List
            dataSource={todayFollowUps}
            // Pass the original index for edit/delete
            renderItem={(item) => renderFollowUpItem(item, followUps.indexOf(item))}
            locale={{ emptyText: 'No follow-ups scheduled for today.' }}
          />
        </TabPane>
        <TabPane tab={`Upcoming (${upcoming.length})`} key="upcoming">
          <List
            dataSource={upcoming}
            renderItem={(item) => renderFollowUpItem(item, followUps.indexOf(item))}
            locale={{ emptyText: 'No upcoming follow-ups.' }}
          />
        </TabPane>
        <TabPane tab={`Past (${past.length})`} key="past">
          <List
            dataSource={past}
            renderItem={(item) => renderFollowUpItem(item, followUps.indexOf(item))}
            locale={{ emptyText: 'No past follow-ups.' }}
          />
        </TabPane>
      </Tabs>
    </Drawer>
  );
};

export default FollowUpDrawer;
