import React, { useState, useEffect } from 'react';
import {
  Drawer, Typography, Form, Input, Button, Spin, message
} from 'antd';
import {
  SendOutlined
} from '@ant-design/icons';
import axios from '../../api/axios';
import './NotesDrawer.css';

const { TextArea } = Input;

const NotesDrawer = ({ visible, onClose, account, invoice, refreshInvoices, refreshAccounts }) => {
  const [form] = Form.useForm();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initialNotes = (invoice || account)?.notes || [];
    setNotes(Array.isArray(initialNotes) ? initialNotes : []);
  }, [invoice, account]);

  const getCurrentUser = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      return user?.name || user?.email || 'Unknown';
    } catch {
      return 'Unknown';
    }
  };

  const getEndpoint = () => {
    return invoice
      ? `/api/invoices/${invoice._id}`
      : `/api/accounts/${account._id}`;
  };

  const handleAddNote = async ({ note }) => {
    if (!note) return;
    
    const newNote = {
      text: note,
      timestamp: new Date().toISOString(),
      addedBy: getCurrentUser()
    };
    const updatedNotes = [...notes, newNote];

    try {
      setLoading(true);
      await axios.put(getEndpoint(), {
        ...(invoice || account),
        notes: updatedNotes
      });
      message.success('Note added');
      setNotes(updatedNotes);
      form.resetFields();
      invoice ? refreshInvoices?.() : refreshAccounts?.();
    } catch (error) {
      console.error('Failed to add note:', error);
      message.error('Failed to add note');
    } finally {
      setLoading(false);
    }
  };

  const groupByDate = (notesArray) => {
    const grouped = {};
    notesArray.forEach(note => {
      if (!note || typeof note !== 'object') return;
      const date = note.timestamp ? new Date(note.timestamp).toLocaleDateString() : 'Unknown Date';
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(note);
    });
    return grouped;
  };

  const groupedNotes = groupByDate(notes);

  return (
    <Drawer
      title={
        <div>
          Notes for {invoice ? 'Invoice' : 'Account'}{' '}
          <Typography.Text code>
            #{invoice?.invoiceNumber || account?.businessName}
          </Typography.Text>
        </div>
      }
      open={visible}
      onClose={onClose}
      width={450}
      destroyOnClose
    >
      <Spin spinning={loading}>
        <div style={{ padding: '0 8px' }}>
          {Object.entries(groupedNotes).map(([date, notes]) => (
            <div key={date}>
              <div className="note-date-header">{date}</div>
              {notes.map((note, index) => (
                <div key={index} className="note-bubble">
                  <div className="note-meta">
                    {note.addedBy || 'Unknown'} • {note.timestamp ? new Date(note.timestamp).toLocaleTimeString() : ''}
                  </div>
                  <div className="note-text">
                    {typeof note.text === 'string' ? note.text : JSON.stringify(note.text)}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddNote}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="note"
            rules={[{ required: true, message: 'Enter note' }]}
          >
            <TextArea rows={3} placeholder="Type your note here..." />
          </Form.Item>
          <Button
            htmlType="submit"
            type="primary"
             style={{ backgroundColor: '#0E2B43', borderColor: '#orange', color: 'white' }}
            icon={<SendOutlined />}
            block
          >
            Add Note
          </Button>
        </Form>
      </Spin>
    </Drawer>
  );
};

export default NotesDrawer;