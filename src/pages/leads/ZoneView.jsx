// File: src/pages/leads/ZoneView.jsx

import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import { Card, Table, Typography, Spin, Empty, Tabs, DatePicker, Space } from "antd";
import { toast } from "react-hot-toast";
import moment from "moment";

const { Title } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

const API_URL = "/api/accounts";

const ZoneView = () => {
    const [zones, setZones] = useState([]);
    const [counts, setCounts] = useState({});
    const [loadingZones, setLoadingZones] = useState(true);
    const [accounts, setAccounts] = useState([]);
    const [loadingAccounts, setLoadingAccounts] = useState(false);
    const [activeTab, setActiveTab] = useState("all");
    const [dateRange, setDateRange] = useState([]);

    const user = JSON.parse(localStorage.getItem("user"));
    const role = user?.role;
    const currentUserId = user?._id;

    // This function fetches all zones and the count of accounts for each zone
        const fetchZonesAndCounts = async () => {
            setLoadingZones(true);
            try {
                const response = await axios.get("/api/zones");
                setZones(response.data);

                const allZoneCount = await axios.get(`${API_URL}/paginated?pageSize=1000`);
                setCounts(prev => ({ ...prev, all: allZoneCount.data.total }));

                const newCounts = {};
                for (const zone of response.data) {
                    const countResponse = await axios.get(`${API_URL}/paginated?zone=${zone._id}&pageSize=1000`);
                    newCounts[zone._id] = countResponse.data.total;
                }
                setCounts(prev => ({ ...prev, ...newCounts }));

                if (response.data.length > 0) {
                    setActiveTab("all");
                }
            } catch (error) {
                console.error("Error fetching zones and counts:", error);
                toast.error("Failed to load zones and counts.");
            } finally {
                setLoadingZones(false);
            }
        };

    // This function fetches accounts based on the selected zone and date range
    const fetchAccountsByZone = async (zoneId, dates = dateRange) => {
        setLoadingAccounts(true);
        try {
            let accountsApiUrl = `${API_URL}/paginated?pageSize=1000`;
            if (zoneId && zoneId !== "all") {
                accountsApiUrl += `&zone=${zoneId}`;
            }

            if (dates && dates.length === 2) {
                const startDate = dates[0].startOf('day').toISOString();
                const endDate = dates[1].endOf('day').toISOString();
                accountsApiUrl += `&startDate=${startDate}&endDate=${endDate}`;
            }

            if (role === "Employee" && currentUserId) {
                accountsApiUrl += `&userId=${currentUserId}&role=${role}`;
            }

            const accountsResponse = await axios.get(accountsApiUrl);
            setAccounts(accountsResponse.data.data);
        } catch (error) {
            toast.error("Failed to fetch accounts.");
            console.error("Fetch accounts error:", error);
        } finally {
            setLoadingAccounts(false);
        }
    };

    // Fetch zones and initial counts on component mount
    useEffect(() => {
        fetchZonesAndCounts();
    }, []);

    // Fetch accounts whenever the active tab or date range changes
    useEffect(() => {
        fetchAccountsByZone(activeTab);
    }, [activeTab, role, currentUserId, dateRange]);

    const handleDateChange = (dates) => {
        setDateRange(dates);
    };

    const columns = [
        { title: "Business Name", dataIndex: "businessName", key: "businessName" },
        { title: "Contact Name", dataIndex: "contactName", key: "contactName" },
        { title: "Email", dataIndex: "email", key: "email" },
        { title: "Mobile Number", dataIndex: "mobileNumber", key: "mobileNumber" },
        { title: "Status", dataIndex: "status", key: "status" },
        { title: "Source Type", dataIndex: "sourceType", key: "sourceType" },
        {
            title: "Created At",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (text) => moment(text).format("YYYY-MM-DD HH:mm"),
            sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        },
    ];

    return (
        <Card title={<Title level={4}>Leads & Customers by Zone</Title>}>
            

            <Tabs
                defaultActiveKey="all"
                onChange={(key) => setActiveTab(key)}
                activeKey={activeTab}
                loading={loadingZones}
            >
                <TabPane tab={`All Zones (${counts.all || 0})`} key="all" />
                {zones.map(zone => (
                    <TabPane tab={`${zone.name} (${counts[zone._id] || 0})`} key={zone._id} />
                ))}
            </Tabs>

            <Spin spinning={loadingAccounts}>
                {accounts.length > 0 ? (
                    <Table
                        columns={columns}
                        dataSource={accounts}
                        rowKey="_id"
                        scroll={{ x: "max-content" }}
                        pagination={false}
                    />
                ) : (
                    <Empty description="No accounts found for this zone." />
                )}
            </Spin>
        </Card>
    );
};

export default ZoneView;