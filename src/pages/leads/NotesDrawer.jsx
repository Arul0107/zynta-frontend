import React, { useState, useEffect } from 'react';
import {
  Drawer, List, Typography, Form, Input, Button, Divider
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { toast } from 'react-hot-toast';
import axios from '../../api/axios';
import './NotesDrawer.css';

const { TextArea } = Input;
const { Title, Text } = Typography;

const NotesDrawer = ({ visible, onClose, account, refreshAccounts }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState([]);

  // ✅ Fetch latest notes when drawer opens
  useEffect(() => {
    if (visible && account?._id) {
      setNotes(account.notes || []);
    }
  }, [visible, account]);

  const getCurrentUser = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      return user?.email || 'Unknown';
    } catch {
      return 'Unknown';
    }
  };

  const handleAddNote = async () => {
    try {
      const { note } = await form.validateFields();
      setLoading(true);

      const newNote = {
        text: note,
        timestamp: new Date().toLocaleString(),
        author: getCurrentUser()
      };

      const updatedNotes = [...notes, newNote];

      await axios.put(`/api/accounts/${account._id}`, {
        ...account,
        notes: updatedNotes
      });

      toast.success('Note added successfully!');
      setNotes(updatedNotes); // ✅ update state immediately
      form.resetFields();
      refreshAccounts();
    } catch (error) {
      toast.error('Failed to add note.');
    } finally {
      setLoading(false);
    }
  };

  const renderNotes = () => {
    if (!notes || notes.length === 0) {
      return <Text type="secondary">No notes to show</Text>;
    }

    return notes.map((note, index) => {
      const prevNote = index > 0 ? notes[index - 1] : null;
      const currentDate = new Date(note.timestamp).toDateString();
      const prevDate = prevNote ? new Date(prevNote.timestamp).toDateString() : null;
      const showDate = currentDate !== prevDate;

      return (
        <div key={index}>
          {showDate && <div className="note-date-header">{currentDate}</div>}
          <div className="note-bubble">
            <div className="note-meta">
              {note.author} &nbsp;&nbsp; {note.timestamp}
            </div>
            <div className="note-text">{note.text}</div>
          </div>
        </div>
      );
    });
  };

  return (
    <Drawer
      title={<Title level={4} style={{ margin: 0 }}>Notes for {account.businessName}</Title>}
      open={visible}
      onClose={onClose}
      width={440}
      bodyStyle={{ padding: '24px' }}
      destroyOnClose
    >
      {renderNotes()}
      <Divider />
      <Form form={form} layout="vertical">
        <Form.Item
          name="note"
          label="Add Note"
          rules={[{ required: true, message: 'Please enter a note' }]}
        >
          <TextArea rows={3} placeholder="Type your note here..." disabled={loading} />
        </Form.Item>
        <Button
          type="primary"
           style={{ backgroundColor: '#0E2B43', borderColor: '#orange', color: 'white' }}
          icon={<PlusOutlined />}
          onClick={handleAddNote}
          loading={loading}
          block
        >
          Add Note
        </Button>
      </Form>
    </Drawer>
  );
};

export default NotesDrawer;
