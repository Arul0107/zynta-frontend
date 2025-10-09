// File: src/components/leads/Leads.jsx

import React, { useState, useEffect, useRef } from "react";
import axios from "../../api/axios";
import {
    Card,
    Input,
    Button,
    Table,
    Tabs,
    Typography,
    Empty,
    Modal,
    Tag,
    Popconfirm,
    Space,
    Dropdown,
    Menu,
    Spin,
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    SearchOutlined,
    MessageOutlined,
    CustomerServiceOutlined,
    DeleteOutlined,
    MoreOutlined,
    FilePdfOutlined,
    FileExcelOutlined,
} from "@ant-design/icons";
import { toast } from "react-hot-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import BusinessAccountForm from "./BusinessAccountForm";
import NotesDrawer from "./NotesDrawer";
import FollowUpDrawer from "./FollowUpDrawer";

const { Title } = Typography;
const { TabPane } = Tabs;

const API_URL = "/api/accounts";

// REMOVED: getUniqueZoneFilters helper function as requested.

const Leads = () => {
    const [formVisible, setFormVisible] = useState(false);
    const [currentAccount, setCurrentAccount] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [accountToUpdate, setAccountToUpdate] = useState(null);
    const [newStatus, setNewStatus] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [notesDrawerVisible, setNotesDrawerVisible] = useState(false);
    const [followUpDrawerVisible, setFollowUpDrawerVisible] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);

    // State for filters
    const [tableFilters, setTableFilters] = useState({});

    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    const [counts, setCounts] = useState({
        all: 0,
        active: 0,
        customers: 0,
        Pipeline: 0,
        closed: 0,
        quotations: 0,
        TargetLeads: 0,
    });

    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    
    const [loadingAccounts, setLoadingAccounts] = useState(true);

    const user = JSON.parse(localStorage.getItem("user"));
    const role = user?.role;
    const currentUserId = user?._id;

    const tableRef = useRef(null);

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            // NOTE: The endpoint is '/api/accounts/users' which typically fetches all users. 
            // If filtering by zone were needed, the API call here would need to be modified.
            const response = await axios.get("/api/accounts/users");
            setUsers(response.data);
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Failed to load users for assignment.");
        } finally {
            setLoadingUsers(false);
        }
    };

    
    const fetchAllTabCounts = async () => {
        try {
            let countsApiUrl = `${API_URL}/counts`;
            if (role === "Employee" && currentUserId) {
                countsApiUrl += `?userId=${currentUserId}&role=${role}`;
            } else if (role === "Team Leader" && currentUserId) {
                // NOTE: Assuming backend logic handles team leader filter based on teamLeaderId
                countsApiUrl += `?teamLeaderId=${currentUserId}&role=${role}`; 
            }
            const countsResponse = await axios.get(countsApiUrl);
            setCounts(countsResponse.data);
        } catch (error) {
            toast.error("Failed to fetch tab counts.");
            console.error("Fetch counts error:", error);
        }
    };

    const fetchPaginatedAccounts = async (params = {}) => {
        setLoadingAccounts(true);
        try {
            const {
                current = pagination.current,
                pageSize = pagination.pageSize,
                searchText = '',
                activeTab = 'all',
                sortBy = 'createdAt',
                sortOrder = 'desc',
                filters = tableFilters,
            } = params;

            const statusParam = activeTab === 'all' ? '' : activeTab;
            const searchParam = searchText;

            let accountsApiUrl = `${API_URL}/paginated?page=${current}&pageSize=${pageSize}&search=${searchParam}`;

            if (statusParam) {
                accountsApiUrl += `&status=${statusParam}`;
            }
            if (sortBy) {
                accountsApiUrl += `&sortBy=${sortBy}`;
            }
            if (sortOrder) {
                accountsApiUrl += `&sortOrder=${sortOrder}`;
            }

            // Append filters to the URL
            Object.keys(filters).forEach(key => {
                // IMPORTANT: The backend API must be set up to handle multiple comma-separated filter values (e.g., /paginated?typeOfLead=Regular,Revenue)
                if (filters[key] && filters[key].length > 0) {
                    // Ant Design filters return an array, so join them for the URL query
                    accountsApiUrl += `&${key}=${filters[key].join(',')}`; 
                }
            });

            if (role === "Employee" && currentUserId) {
                accountsApiUrl += `&userId=${currentUserId}&role=${role}`;
            } else if (role === "Team Leader" && currentUserId) {
                // NOTE: Assuming backend logic handles team leader filter based on teamLeaderId
                accountsApiUrl += `&teamLeaderId=${currentUserId}&role=${role}`; 
            }

            const accountsResponse = await axios.get(accountsApiUrl);
            setAccounts(accountsResponse.data.data);
            setPagination({
                ...pagination,
                current: accountsResponse.data.page,
                pageSize: accountsResponse.data.pageSize,
                total: accountsResponse.data.total,
            });

        } catch (error) {
            toast.error("Failed to fetch accounts.");
            console.error("Fetch accounts error:", error);
        } finally {
            setLoadingAccounts(false);
        }
    };

    useEffect(() => {
        // Reset to page 1 on search or tab change
        if (pagination.current !== 1) {
            setPagination(prev => ({ ...prev, current: 1 }));
            return; // Prevent double-fetch, useEffect for pagination.current will handle it
        }
        
        fetchPaginatedAccounts({
            current: 1, 
            pageSize: pagination.pageSize,
            searchText: searchText,
            activeTab: activeTab,
            filters: tableFilters
        });
        fetchUsers();
    }, [searchText, activeTab, role, currentUserId]); // Removed pagination.current from here to avoid circular dependency

    useEffect(() => {
        // Fetch accounts when pagination.current changes
        fetchPaginatedAccounts({
            current: pagination.current, 
            pageSize: pagination.pageSize,
            searchText: searchText,
            activeTab: activeTab,
            filters: tableFilters
        });
    }, [pagination.current, pagination.pageSize]);
    
    useEffect(() => {
        fetchAllTabCounts();
    }, [role, currentUserId]);


    const handleSaveAccount = async (values) => {
        try {
            const dataToSend = { ...values };

            if (currentAccount) {
                await axios.put(`${API_URL}/${currentAccount._id}`, dataToSend);
                toast.success("Account updated successfully!");
            } else {
                await axios.post(API_URL, dataToSend);
                toast.success("Account created successfully!");
            }
            setFormVisible(false);
            // Re-fetch data for the current view and update counts
            fetchPaginatedAccounts({
                current: 1, // Go back to page 1 on successful save/update
                pageSize: pagination.pageSize,
                searchText: searchText,
                activeTab: activeTab,
                filters: tableFilters
            });
            fetchAllTabCounts();
        } catch (error) {
            if (error.response && error.response.status === 409) {
                throw error;
            } else {
                toast.error("Failed to save account.");
                console.error(
                    "Save account error:",
                    error.response?.data || error.message
                );
                throw error;
            }
        }
    };

    const showEditForm = (account) => {
        setCurrentAccount(account);
        setFormVisible(true);
    };

    const handleDeleteAccount = async (id) => {
        try {
            // This is a soft delete (status set to 'Closed')
            await axios.delete(`${API_URL}/${id}`); 
            toast.success("Account status set to Closed!");
            // Re-fetch data and counts
            fetchPaginatedAccounts({
                current: pagination.current,
                pageSize: pagination.pageSize,
                searchText: searchText,
                activeTab: activeTab,
                filters: tableFilters
            });
            fetchAllTabCounts();
        } catch (error) {
            toast.error("Failed to set account status to Closed.");
            console.error(
                "Delete account error:",
                error.response?.data || error.message
            );
        }
    };

    const showNotesDrawer = (account) => {
        setSelectedAccount(account);
        setNotesDrawerVisible(true);
    };

    const showFollowUpDrawer = (account) => {
        setSelectedAccount(account);
        setFollowUpDrawerVisible(true);
    };

    const handleStatusChange = (statusValue, account) => {
        setAccountToUpdate(account);
        setNewStatus(statusValue);
        setIsModalVisible(true);
    };

    const handleConfirmStatusChange = async () => {
        try {
            const updatedAccount = { ...accountToUpdate, status: newStatus };
            await axios.put(`${API_URL}/${accountToUpdate._id}`, updatedAccount);
            toast.success(`Account status changed to ${newStatus}!`);
            // Re-fetch data and counts
            fetchPaginatedAccounts({
                current: pagination.current,
                pageSize: pagination.pageSize,
                searchText: searchText,
                activeTab: activeTab,
                filters: tableFilters
            });
            fetchAllTabCounts();
        } catch (error) {
            toast.error("Failed to update account status.");
            console.error(
                "Status update error:",
                error.response?.data || error.message
            );
        } finally {
            setIsModalVisible(false);
            setAccountToUpdate(null);
            setNewStatus(null);
        }
    };

    const handleCancelStatusChange = () => {
        setIsModalVisible(false);
        setAccountToUpdate(null);
        setNewStatus(null);
    };

    const exportTableToPdf = async () => {
        const input = tableRef.current;
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
            pdf.save(`Leads_Customers_Details.pdf`);
            toast.success("PDF generated!", { id: "pdf-toast" });
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast.error("Failed to generate PDF.", { id: "pdf-toast" });
        }
    };

    const exportTableToExcel = () => {
        if (accounts.length === 0) {
            toast.error("No data to export to Excel.");
            return;
        }

        const dataForExcel = accounts.map((account, index) => {
            const row = {
                "S.No": index + 1 + (pagination.current - 1) * pagination.pageSize,
                "Business Name": account.businessName,
                "Contact Name": account.contactName,
                Email: account.contactEmail, // Corrected to use contactEmail
                "Mobile Number": account.contactNumber, // Corrected to use contactNumber
                // NOTE: 'type' is not in schema; 'typeOfLead' is an array. Using the first element or a join.
                "Lead Type": account.typeOfLead && account.typeOfLead.length > 0 ? account.typeOfLead.join(', ') : 'N/A', 
                Status: account.status,
                "Source Type": account.sourceType,
                "Assigned To": account.assignedTo?.name || "Unassigned",
                "GST Number": account.gstNumber,
                // NOTE: Using 'contactNumber' instead of 'phoneNumber'
                "Phone Number (Alt)": account.contactNumber, 
                "Address Line 1": account.addressLine1,
                "Address Line 2": account.addressLine2,
                City: account.city,
                Pincode: account.pincode,
                State: account.state,
                Country: account.country,
                Website: account.website,
                "Is Customer": account.isCustomer ? "Yes" : "No",
                "Created At": new Date(account.createdAt).toLocaleString(),
            };
            // Removed non-schema fields like addressLine3 and landmark from excel export
            return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Leads & Customers");
        XLSX.writeFile(workbook, "Leads_Customers_Data.xlsx");
        toast.success("Data exported to Excel!");
    };


    const columns = [
        {
            title: "S.No",
            key: "sno",
            render: (text, record, index) => index + 1 + (pagination.current - 1) * pagination.pageSize,
            width: 60,
        },
        {
            title: "Business Name",
            dataIndex: "businessName",
            key: "businessName",
            sorter: true,
            filterDropdown: ({
                setSelectedKeys,
                selectedKeys,
                confirm,
                clearFilters,
            }) => (
                <div style={{ padding: 8 }}>
                    <Input
                        placeholder="Search Business Name"
                        value={selectedKeys[0]}
                        onChange={(e) =>
                            setSelectedKeys(e.target.value ? [e.target.value] : [])
                        }
                        onPressEnter={() => confirm()}
                        style={{ marginBottom: 8, display: "block" }}
                    />
                    <Button
                        type="primary"
                        onClick={() => confirm()}
                        icon={<SearchOutlined />}
                        size="small"
                        style={{
                            width: 90,
                            marginRight: 8,
                            backgroundColor: "#0E2B43",
                            borderColor: "orange",
                            color: "white",
                        }}
                    >
                        Search
                    </Button>
                    <Button
                        onClick={() => clearFilters()}
                        size="small"
                        style={{ width: 90 }}
                    >
                        Reset
                    </Button>
                </div>
            ),
            responsive: ["xs", "sm", "md", "lg"],
        },
        {
            title: "Contact Name",
            dataIndex: "contactName",
            key: "contactName",
            sorter: true,
            responsive: ["md", "lg"],
        },
        {
            title: "Email",
            dataIndex: "contactEmail",
            key: "contactEmail",
            responsive: ["lg"],
        },
        {
            title: "Service", // Renamed 'Product' to 'Service' for consistency with backend BrandService model
            dataIndex: "selectedService",
            key: "selectedService",
            // CORRECTED: Used 'selectedService' and 'serviceName' to match BrandService model
            render: (selectedService) => (selectedService ? selectedService.serviceName : "N/A"), 
            responsive: ["md", "lg"],
        },
        {
            title: "Contact Number",
            dataIndex: "contactNumber",
            key: "contactNumber",
            responsive: ["md", "lg"],
        },
        {
            title: "Type of Leads",
            dataIndex: "typeOfLead",
            key: "typeOfLead",
            render: (typeOfLead) => (
                <Space>
                    {typeOfLead && typeOfLead.map(type => (
                        <Tag key={type} color="blue">{type}</Tag>
                    ))}
                </Space>
            ),
            filters: [
                { text: "Regular", value: "Regular" },
                { text: "Revenue", value: "Revenue" }, // Added Revenue from schema
                { text: "Government", value: "Government" }, // Added Government from schema
                { text: "Occupational", value: "Occupational" }, // Added Occupational from schema
            ],
            filterMultiple: true,
            // NOTE: Client-side filtering check is generally fine for embedded arrays
            onFilter: (value, record) => record.typeOfLead?.includes(value), 
            responsive: ["lg"],
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status) => {
                let color;
                switch (status) {
                    case "Active":
                        color = "green";
                        break;
                    case "Pipeline":
                        color = "orange";
                        break;
                    case "Closed":
                        color = "purple";
                        break;
                    case "Customer":
                        color = "blue";
                        break;
                    case "Quotations":
                        color = "cyan";
                        break;
                    case "TargetLeads": // Added TargetLeads status
                        color = "gold";
                        break;
                    default:
                        color = "gray";
                }
                return <Tag color={color}>{status}</Tag>;
            },
            filters: [
                { text: "Active", value: "Active" },
                { text: "Pipeline", value: "Pipeline" },
                { text: "Closed", value: "Closed" },
                { text: "Customer", value: "Customer" },
                { text: "Quotations", value: "Quotations" },
                { text: "Target Leads", value: "TargetLeads" }, // Added to filters
            ],
            filterMultiple: true,
            responsive: ["sm", "md", "lg"],
        },
        {
            title: "Assigned To",
            dataIndex: "assignedTo",
            key: "assignedTo",
            render: (assignedTo) => (assignedTo ? assignedTo.name : "Unassigned"),
            responsive: ["md", "lg"],
        },
        {
            title: "Source Type",
            dataIndex: "sourceType",
            key: "sourceType",
            filters: [
                { text: "Direct", value: "Direct" },
                { text: "Social Media", value: "socialmedia" }, // Renamed from Facebook/Google Ads for generic consistency
                { text: "Website", value: "online" }, // Renamed from Website
                { text: "Existing Client", value: "client" }, // Renamed from Client
                { text: "Tradefair", value: "tradefair" },
                { text: "Other", value: "Other" },
            ],
            onFilter: (value, record) => record.sourceType === value, // Simplified onFilter
            responsive: ["lg"],
        },
        
        {
            title: "Action",
            key: "action",
            width: 80,
            render: (text, record) => (
                <Dropdown
                    overlay={
                        <Menu>
                            <Menu.Item
                                key="edit"
                                icon={<EditOutlined />}
                                onClick={() => showEditForm(record)}
                            >
                                Edit Account
                            </Menu.Item>
                            <Menu.Item
                                key="notes"
                                icon={<MessageOutlined />}
                                onClick={() => showNotesDrawer(record)}
                            >
                                View/Add Notes
                            </Menu.Item>
                            <Menu.Item
                                key="followup"
                                icon={<CustomerServiceOutlined />}
                                onClick={() => showFollowUpDrawer(record)}
                            >
                                View/Add Follow-ups
                            </Menu.Item>

                            {record.status === "Customer" ? (
                                <Menu.Item
                                    key="change-to-lead"
                                    onClick={() => handleStatusChange("Active", record)}
                                >
                                    Change to Lead
                                </Menu.Item>
                            ) : (
                                <Menu.Item
                                    key="change-to-customer"
                                    onClick={() => handleStatusChange("Customer", record)}
                                >
                                    Change to Customer
                                </Menu.Item>
                            )}
                            {/* NOTE: Superadmin is assumed to be an Admin role for the soft delete action */}
                            {(role === "Superadmin" || role === "Admin") && ( 
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
                    trigger={["click"]}
                >
                    <Button icon={<MoreOutlined />} />
                </Dropdown>
            ),
        },
    ];

    const handleTableChange = (newPagination, filters, sorter) => {
        setPagination(newPagination);
        
        // Correctly map sorter object to API query parameters
        const sortBy = sorter.field || 'createdAt';
        const sortOrder = sorter.order === 'ascend' ? 'asc' : (sorter.order === 'descend' ? 'desc' : undefined);

        // Update state with new filters
        setTableFilters(filters);

        fetchPaginatedAccounts({
            current: newPagination.current,
            pageSize: newPagination.pageSize,
            searchText: searchText,
            activeTab: activeTab,
            sortBy,
            sortOrder,
            filters: {
                // Ensure all filtered fields are passed correctly
                status: filters.status,
                sourceType: filters.sourceType,
                typeOfLead: filters.typeOfLead,
            },
        });
    };

    return (
        <Card title={<Title level={4}>Manage Leads & Customers</Title>}>
            <div
                style={{
                    marginBottom: 16,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "10px",
                }}
            >
                <Input
                    placeholder="Search by business or contact name"
                    prefix={<SearchOutlined />}
                    style={{ width: "100%", maxWidth: 300 }}
                    value={searchText}
                    onChange={(e) => {
                        setSearchText(e.target.value);
                        setPagination({ ...pagination, current: 1 });
                    }}
                />
                <Space>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        style={{ backgroundColor: "#0E2B43", borderColor: "orange", color: "white" }}
                        onClick={() => {
                            setCurrentAccount(null);
                            setFormVisible(true);
                        }}
                    >
                        Add New Account
                    </Button>

                    <Button icon={<FilePdfOutlined />} onClick={exportTableToPdf} />
                    <Button icon={<FileExcelOutlined />} onClick={exportTableToExcel} />
                </Space>
            </div>

            <Tabs
                defaultActiveKey="all"
                onChange={(key) => {
                    setActiveTab(key);
                    setPagination({ ...pagination, current: 1 });
                }}
            >
                <TabPane tab={`All Leads (${counts.all || 0})`} key="all" />
                <TabPane tab={`Target Leads (${counts.targetLeads || 0})`} key="TargetLeads" />
                <TabPane tab={`Lead (${counts.active || 0})`} key="Active" />
                <TabPane tab={`Enquiry (${counts.Pipeline || 0})`} key="Pipeline" />
                <TabPane tab={`Quotations Sent (${counts.quotations || 0})`} key="Quotations" />
                <TabPane tab={`Converted (${counts.customers || 0})`} key="Customer" />
                <TabPane tab={`Closed Accounts (${counts.closed || 0})`} key="Closed" />
            </Tabs>

            <div ref={tableRef}>
                {loadingAccounts ? (
                    <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />
                ) : accounts.length > 0 ? (
                    <Table
                        columns={columns}
                        dataSource={accounts}
                        rowKey="_id"
                        scroll={{ x: "max-content" }}
                        pagination={pagination}
                        onChange={handleTableChange}
                    />
                ) : (
                    <Empty description="No accounts found." />
                )}
            </div>

            <BusinessAccountForm
                visible={formVisible}
                onClose={() => setFormVisible(false)}
                onSave={handleSaveAccount}
                initialValues={currentAccount}
                allUsers={users}
                loadingUsers={loadingUsers}
                // Removed allZones property as per request
            />

            {selectedAccount && (
                <>
                    <NotesDrawer
                        visible={notesDrawerVisible}
                        onClose={() => setNotesDrawerVisible(false)}
                        account={selectedAccount}
                        refreshAccounts={() => {
                            fetchPaginatedAccounts({ 
                                current: pagination.current, 
                                pageSize: pagination.pageSize, 
                                searchText: searchText, 
                                activeTab: activeTab, 
                                filters: tableFilters 
                            });
                            fetchAllTabCounts();
                        }}
                    />
                    <FollowUpDrawer
                        visible={followUpDrawerVisible}
                        onClose={() => setFollowUpDrawerVisible(false)}
                        account={selectedAccount}
                        refreshAccounts={() => {
                            fetchPaginatedAccounts({ 
                                current: pagination.current, 
                                pageSize: pagination.pageSize, 
                                searchText: searchText, 
                                activeTab: activeTab, 
                                filters: tableFilters 
                            });
                            fetchAllTabCounts();
                        }}
                    />
                </>
            )}

            <Modal
                title="Change Account Status"
                open={isModalVisible}
                onOk={handleConfirmStatusChange}
                onCancel={handleCancelStatusChange}
                okText="Yes"
                cancelText="No"
            >
                <p>
                    Are you sure you want to change this account's status to{" "}
                    **{newStatus}**?
                </p>
            </Modal>
        </Card>
    );
};

export default Leads;   