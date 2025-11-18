import React, { useState, useEffect } from 'react';
import {
  Drawer, Button, Input, DatePicker, Tabs, List, Typography, Divider, Modal
} from 'antd';
import axios from '../../api/axios'; // Adjust path if necessary
import { toast } from 'react-hot-toast';
import moment from 'moment';

const { TextArea } = Input;
const { TabPane } = Tabs;
const { Text } = Typography;

/**
 * QuotationFollowUpDrawer component for managing follow-ups related to a quotation.
 * It allows viewing, adding, editing, and deleting follow-up notes.
 *
 * @param {object} props - The component props.
 * @param {boolean} props.visible - Controls the visibility of the drawer.
 * @param {function} props.onClose - Callback function to close the drawer.
 * @param {object} props.quotation - The quotation object to which follow-ups are associated.
 * @param {function} props.refreshQuotations - Callback to refresh the quotation list after changes.
 */
const QuotationFollowUpDrawer = ({ visible, onClose, quotation, refreshQuotations }) => {
  const [comment, setComment] = useState('');
  const [followupDate, setFollowupDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [followUps, setFollowUps] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);

  // Fetch follow-ups when the drawer becomes visible or the quotation changes
  useEffect(() => {
    if (visible && quotation?._id) {
      fetchFollowUps();
    }
  }, [visible, quotation]);

  /**
   * Fetches the follow-ups for the current quotation from the backend.
   */
  const fetchFollowUps = async () => {
    try {
      const res = await axios.get(`/api/quotations/${quotation._id}/followups`);
      setFollowUps(res.data || []);
    } catch (err) {
      console.error("Failed to fetch follow-ups for quotation:", err);
      toast.error('Failed to fetch follow-ups for this quotation.');
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
    const addedBy = user?._id; // Ensure 'addedBy' is sent (user ID from localStorage)
    if (!addedBy) {
      toast.error('User information not found. Please log in.');
      return;
    }

    setLoading(true);

    const payload = {
      date: followupDate.format('DD-MM-YYYY'),
      note: comment,
      addedBy // The ID of the user adding/updating the follow-up
    };

    const request = editingIndex === null
      ? axios.post(`/api/quotations/${quotation._id}/followups`, payload) // POST for new
      : axios.put(`/api/quotations/${quotation._id}/followups/${editingIndex}`, payload); // PUT for update

    request
      .then(() => {
        toast.success(editingIndex === null ? 'Follow-up added successfully!' : 'Follow-up updated successfully!');
        setComment(''); // Clear input fields
        setFollowupDate(null);
        setEditingIndex(null); // Reset editing state
        fetchFollowUps(); // Refresh the list of follow-ups
        refreshQuotations(); // Refresh the main quotation list
      })
      .catch((err) => {
        console.error("Error saving follow-up:", err);
        toast.error(err?.response?.data?.message );
      })
      .finally(() => setLoading(false));
  };

  /**
   * Sets up the drawer for editing an existing follow-up.
   * @param {number} index - The index of the follow-up to edit in the `followUps` array.
   */
 

  /**
   * Handles the deletion of a follow-up after confirmation.
   * @param {number} index - The index of the follow-up to delete in the `followUps` array.
   */
 

  // Filter and sort follow-ups by date for display in tabs
  const today = moment().format('DD-MM-YYYY');
  const sorted = [...followUps].sort((a, b) => new Date(b.date) - new Date(a.date));

  const todayFollowUps = sorted.filter(f =>
    moment(f.date).format('DD-MM-YYYY') === today
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
      title={`Follow-ups for Quotation: ${quotation?.quotationNumber || 'N/A'}`}
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
          block
          onClick={handleAddOrUpdate}
          loading={loading}
          style={{ marginTop: 10 }}
        >
          {editingIndex === null ? 'Add Follow-up' : 'Update Follow-up'}
        </Button>
      </div>

      <Divider>Existing Follow-ups</Divider>
      <Tabs defaultActiveKey="today">
        <TabPane tab={`Today's (${todayFollowUps.length})`} key="today">
          <List
            dataSource={todayFollowUps}
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

export default QuotationFollowUpDrawer;
