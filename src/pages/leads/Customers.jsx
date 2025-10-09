// File: src/pages/customers/Customers.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import {
    Card, Input, Button, Table, Tabs, Typography, Empty, Tag, Modal, Dropdown, Menu, Popconfirm, Spin, Space, Row, Col, Select
} from 'antd';
import {
    SearchOutlined, EditOutlined, MessageOutlined, CustomerServiceOutlined, DeleteOutlined, MoreOutlined, FilePdfOutlined, FileExcelOutlined
} from '@ant-design/icons';
import { toast } from 'react-hot-toast';
import BusinessAccountForm from '../leads/BusinessAccountForm';
import NotesDrawer from '../leads/NotesDrawer';
import FollowUpDrawer from '../leads/FollowUpDrawer';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

const { Title } = Typography;
const { TabPane } = Tabs;

const API_URL = "/api/accounts";

const Customers = () => {
    const [searchText, setSearchText] = useState('');
    const [activeZoneTab, setActiveZoneTab] = useState('all'); // State for zone tabs
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [zones, setZones] = useState([]);
    const [loadingZones, setLoadingZones] = useState(false);
    const [formVisible, setFormVisible] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [accountToUpdate, setAccountToUpdate] = useState(null);
    const [newStatus, setNewStatus] = useState(null);
    const [notesDrawerVisible, setNotesDrawerVisible] = useState(false);
    const [followUpDrawerVisible, setFollowUpDrawerVisible] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const navigate = useNavigate();
    const tableRef = useRef(null);

    const user = JSON.parse(localStorage.getItem("user"));
    const role = user?.role;
    const currentUserId = user?._id;

    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    const fetchCustomers = async (params = {}) => {
        setLoading(true);
        try {
            const {
                current = pagination.current,
                pageSize = pagination.pageSize,
                searchText = '',
                sortBy = 'createdAt',
                sortOrder = 'desc',
                zoneId = activeZoneTab,
            } = params;

            let apiUrl = `${API_URL}/paginated?page=${current}&pageSize=${pageSize}&search=${searchText}&status=Customer`;

            if (sortBy) {
                apiUrl += `&sortBy=${sortBy}`;
            }
            if (sortOrder) {
                apiUrl += `&sortOrder=${sortOrder}`;
            }

            if (role === "Employee" && currentUserId) {
                apiUrl += `&userId=${currentUserId}&role=${role}`;
            } else if (role === "Team Leader" && currentUserId) {
                 apiUrl += `&teamLeaderId=${currentUserId}&role=${role}`;
            }

            if (zoneId && zoneId !== 'all') {
                apiUrl += `&zone=${zoneId}`;
            }

            const response = await axios.get(apiUrl);
            setCustomers(response.data.data);
            setPagination({
                ...pagination,
                current: response.data.page,
                pageSize: response.data.pageSize,
                total: response.data.total,
            });

        } catch (err) {
            toast.error('Failed to load customers');
            console.error("Error fetching customers:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllUsers = async () => {
        setLoadingUsers(true);
        try {
            const res = await axios.get('/api/accounts/users');
            setUsers(res.data);
        } catch (err) {
            toast.error('Failed to load user list');
            console.error("Error fetching users:", err);
        } finally {
            setLoadingUsers(false);
        }
    };

    const fetchZones = async () => {
        setLoadingZones(true);
        try {
            let zonesApiUrl = '/api/zones';
            if (role === "Employee" && currentUserId) {
                zonesApiUrl += `?userId=${currentUserId}`;
            } else if (role === "Team Leader" && currentUserId) {
                zonesApiUrl += `?teamLeaderId=${currentUserId}`;
            }
            const response = await axios.get(zonesApiUrl);
            setZones(response.data);
        } catch (error) {
            console.error("Error fetching zones:", error);
            toast.error("Failed to load zones.");
        } finally {
            setLoadingZones(false);
        }
    };

    const handleZoneTabChange = (key) => {
        setActiveZoneTab(key);
        setPagination({ ...pagination, current: 1 }); // Reset to the first page when the tab changes
    };

    useEffect(() => {
        fetchCustomers({
            current: pagination.current,
            pageSize: pagination.pageSize,
            searchText: searchText,
            zoneId: activeZoneTab,
        });
        fetchAllUsers();
        fetchZones();
    }, [pagination.current, pagination.pageSize, searchText, role, currentUserId, activeZoneTab]);

    const handleEdit = (record) => {
        setCurrentCustomer(record);
        setFormVisible(true);
    };

    const handleSave = async (values) => {
        setLoading(true);
        try {
            if (currentCustomer?._id) {
                await axios.put(`${API_URL}/${currentCustomer._id}`, values);
                toast.success(`Customer updated successfully`);
            } else {
                await axios.post(API_URL, values);
                toast.success(`Customer created successfully`);
            }
            fetchCustomers({
                current: pagination.current,
                pageSize: pagination.pageSize,
                searchText: searchText,
                zoneId: activeZoneTab,
            });
        } catch (err) {
            toast.error(`Failed to ${currentCustomer?._id ? 'update' : 'create'} customer`);
            console.error("Save customer error:", err.response?.data || err.message);
        } finally {
            setFormVisible(false);
            setCurrentCustomer(null);
            setLoading(false);
        }
    };

    const handleStatusChange = (statusValue, record) => {
        setAccountToUpdate(record);
        setNewStatus(statusValue);
        setIsModalVisible(true);
    };

    const confirmStatusChange = async () => {
        setLoading(true);
        try {
            const updated = { ...accountToUpdate, status: newStatus };
            await axios.put(`${API_URL}/${accountToUpdate._id}`, updated);
            toast.success(`Status updated to ${newStatus}`);
            fetchCustomers({
                current: pagination.current,
                pageSize: pagination.pageSize,
                searchText: searchText,
                zoneId: activeZoneTab,
            });
        } catch (err) {
            toast.error('Failed to update status');
            console.error("Status update error:", err.response?.data || err.message);
        } finally {
            setIsModalVisible(false);
            setAccountToUpdate(null);
            setNewStatus(null);
            setLoading(false);
        }
    };

    const handleDeleteAccount = async (recordId) => {
        setLoading(true);
        try {
            await axios.put(`${API_URL}/${recordId}`, { status: 'Closed', isCustomer: false });
            toast.success('Customer status set to Closed');
            fetchCustomers({
                current: pagination.current,
                pageSize: pagination.pageSize,
                searchText: searchText,
                zoneId: activeZoneTab,
            });
        } catch (err) {
            toast.error('Failed to close customer account');
            console.error("Soft delete error:", err.response?.data || err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenNotesDrawer = (account) => {
        setSelectedAccount(account);
        setNotesDrawerVisible(true);
    };

    const handleOpenFollowUpDrawer = (account) => {
        setSelectedAccount(account);
        setFollowUpDrawerVisible(true);
    };

    const goToCustomerProfile = (record) => {
        navigate(`/customers/${record._id}`);
    };

    const exportTableToPdf = async () => {
        const input = document.getElementById('customerTable');
        if (!input) {
            toast.error("Table content not found for PDF export.");
            return;
        }

        toast.loading("Generating PDF...", { id: "pdf-toast" });

        try {
            const canvas = await html2canvas(input, { scale: 2 });
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const imgWidth = 210;
            const pageHeight = 297;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }
            pdf.save(`Customers_Details.pdf`);
            toast.success("PDF generated!", { id: "pdf-toast" });
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast.error("Failed to generate PDF.", { id: "pdf-toast" });
        }
    };

    const exportTableToExcel = () => {
        if (customers.length === 0) {
            toast.error("No data to export to Excel.");
            return;
        }

        const dataForExcel = customers.map((customer, index) => {
            const row = {
                "S.No": index + 1 + (pagination.current - 1) * pagination.pageSize,
                "Business Name": customer.businessName,
                "Contact Name": customer.contactName,
                Email: customer.email,
                "Mobile Number": customer.mobileNumber,
                "Lead Type": customer.type,
                Status: customer.status,
                "Source Type": customer.sourceType,
                "Assigned To": customer.assignedTo?.name || "Unassigned",
                "GST Number": customer.gstNumber,
                "Phone Number": customer.phoneNumber,
                "Address Line 1": customer.addressLine1,
                "Address Line 2": customer.addressLine2,
                "Address Line 3": customer.addressLine3,
                Landmark: customer.landmark,
                City: customer.city,
                Pincode: customer.pincode,
                State: customer.state,
                Country: customer.country,
                Website: customer.website,
                "Is Customer": customer.isCustomer ? "Yes" : "No",
                "Created At": new Date(customer.createdAt).toLocaleString(),
                "Zone": customer.zone?.name || "N/A",
            };
            return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Customers Data");
        XLSX.writeFile(workbook, "Customers_Data.xlsx");
        toast.success("Data exported to Excel!");
    };

    const typeTag = (type) => {
        switch (type) {
            case 'Hot':
                return <Tag color="red">Hot</Tag>;
            case 'Warm':
                return <Tag color="orange">Warm</Tag>;
            case 'Cold':
                return <Tag color="blue">Cold</Tag>;
            default:
                return <Tag>Unknown</Tag>;
        }
    };

    const columns = [
        { title: 'Sno.', render: (_, __, i) => i + 1 + (pagination.current - 1) * pagination.pageSize, width: 60 },
        {
            title: 'Business Name',
            dataIndex: 'businessName',
            render: (text, record) => (
                <a onClick={() => goToCustomerProfile(record)} style={{ cursor: 'pointer', color: '#0E2B43' }}>
                    {text}
                </a>
            ),
            sorter: true,
        },
        { title: 'Contact Name', dataIndex: 'contactName', sorter: true },
        { title: 'Email Id', dataIndex: 'email', sorter: true },
        { title: 'Type', dataIndex: 'type', render: typeTag, sorter: true },
        {
            title: 'Assigned To',
            dataIndex: ['assignedTo', 'name'],
            render: (_, record) =>
                record.assignedTo ? (
                    <span>{record.assignedTo.name} ({record.assignedTo.role})</span>
                ) : (
                    <em>Unassigned</em>
                ),
            sorter: true,
        },
        {
            title: 'Zone',
            dataIndex: ['zone', 'name'],
            render: (text) => text || 'N/A',
            sorter: (a, b) => {
                const zoneA = a.zone?.name || '';
                const zoneB = b.zone?.name || '';
                return zoneA.localeCompare(zoneB);
            },
        },
        {
            title: 'Latest Note',
            render: (_, record) => {
                const note = record.notes?.[record.notes.length - 1];
                return note ? (
                    <div>
                        <small style={{ color: '#888' }}>{new Date(note.timestamp).toLocaleString()}</small><br />
                        {note.text}
                    </div>
                ) : <em>No notes</em>;
            }
        },
        {
            title: 'Status',
            dataIndex: 'status',
            render: (_, record) => (
                <Tag color={record.status === 'Customer' ? 'blue' : 'gray'}>
                    {record.status}
                </Tag>
            ),
            sorter: true,
        },
        {
            title: 'Actions',
            render: (_, record) => (
                <Dropdown
                    overlay={
                        <Menu>
                            <Menu.Item key="edit" icon={<EditOutlined />} onClick={() => handleEdit(record)}>Edit Customer</Menu.Item>
                            <Menu.Item key="notes" icon={<MessageOutlined />} onClick={() => handleOpenNotesDrawer(record)}>View/Add Notes</Menu.Item>
                            <Menu.Item key="followups" icon={<CustomerServiceOutlined />} onClick={() => handleOpenFollowUpDrawer(record)}>View/Add Follow-ups</Menu.Item>
                            <Menu.Item key="change-to-active" onClick={() => handleStatusChange("Active", record)}>
                                Change to Active Lead
                            </Menu.Item>

                            {role === "Superadmin" && (
                                <Menu.Item key="close-account">
                                    <Popconfirm
                                        title="Are you sure you want to close this account? This will set its status to 'Closed'."
                                        onConfirm={() => handleDeleteAccount(record._id)}
                                        okText="Yes"
                                        cancelText="No"
                                    >
                                        <DeleteOutlined />
                                        Close Account
                                    </Popconfirm>
                                </Menu.Item>
                            )}
                        </Menu>
                    }
                    trigger={['click']}
                >
                    <Button icon={<MoreOutlined />} />
                </Dropdown>
            )
        }
    ];

    const handleTableChange = (newPagination, filters, sorter) => {
        setPagination(newPagination);
        const sortBy = sorter.field;
        const sortOrder = sorter.order === 'ascend' ? 'asc' : (sorter.order === 'descend' ? 'desc' : undefined);

        fetchCustomers({
            current: newPagination.current,
            pageSize: newPagination.pageSize,
            searchText: searchText,
            sortBy,
            sortOrder,
            zoneId: activeZoneTab,
        });
    };

    return (
        <div>
            <Card>
                <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Title level={4} style={{ margin: 0 }}>Customers</Title>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Input
                            placeholder="Search by Business Name, Contact Name or Email"
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={(e) => {
                                setSearchText(e.target.value);
                                setPagination({ ...pagination, current: 1 });
                            }}
                            style={{ width: '100%' }}
                        />
                    </Col>
                    <Col xs={24} sm={24} md={8} lg={12} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Space wrap>
                            <Button
                                icon={<FilePdfOutlined />}
                                onClick={exportTableToPdf}
                                style={{ backgroundColor: '#0E2B43', borderColor: '#0E2B43', color: 'white' }}
                                className="orange-button"
                            >
                                Export to PDF
                            </Button>
                            <Button
                                icon={<FileExcelOutlined />}
                                onClick={exportTableToExcel}
                                style={{ backgroundColor: '#0E2B43', borderColor: '#0E2B43', color: 'white' }}
                                className="orange-button"
                            >
                                Export to Excel
                            </Button>
                        </Space>
                    </Col>
                </Row>

                <Tabs activeKey={activeZoneTab} onChange={handleZoneTabChange} style={{ marginBottom: 16 }}>
                    <TabPane tab="All Customers" key="all" />
                    {zones.map(zone => (
                        <TabPane
                            tab={<span>{zone.name}</span>}
                            key={zone._id}
                        />
                    ))}
                </Tabs>

                {loading ? (
                    <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />
                ) : customers.length > 0 ? (
                    <div id="customerTable">
                        <Table
                            columns={columns}
                            dataSource={customers}
                            rowKey="_id"
                            pagination={pagination}
                            onChange={handleTableChange}
                            scroll={{ x: 'max-content' }}
                            className="customers-table"
                        />
                    </div>
                ) : (
                    <Empty description="No customers found." />
                )}
            </Card>

            <BusinessAccountForm
                visible={formVisible}
                onClose={() => setFormVisible(false)}
                onSave={handleSave}
                initialValues={currentCustomer}
                allUsers={users}
                loadingUsers={loadingUsers}
                allZones={zones}
                loadingZones={loadingZones}
            />

            <Modal
                title="Confirm Status Change"
                open={isModalVisible}
                onOk={confirmStatusChange}
                onCancel={() => setIsModalVisible(false)}
                okText="Yes"
                cancelText="No"
                confirmLoading={loading}
            >
                <p>Are you sure you want to change the status of <strong>{accountToUpdate?.businessName}</strong> to <strong>{newStatus}</strong>?</p>
            </Modal>

            {selectedAccount && (
                <>
                    <FollowUpDrawer
                        visible={followUpDrawerVisible}
                        onClose={() => setFollowUpDrawerVisible(false)}
                        account={selectedAccount}
                        refreshAccounts={() => fetchCustomers({ current: pagination.current, pageSize: pagination.pageSize, searchText: searchText, zoneId: activeZoneTab })}
                    />
                    <NotesDrawer
                        visible={notesDrawerVisible}
                        onClose={() => setNotesDrawerVisible(false)}
                        account={selectedAccount}
                        refreshAccounts={() => fetchCustomers({ current: pagination.current, pageSize: pagination.pageSize, searchText: searchText, zoneId: activeZoneTab })}
                    />
                </>
            )}
        </div>
    );
};

export default Customers;