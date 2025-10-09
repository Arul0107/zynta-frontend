import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  message,
  Spin,
  Button,
  Space,
  Typography,
  Table,
  Input,
  Select,
  Tag,
  Flex,
} from "antd";
import {
  RiseOutlined,
  FallOutlined,
  SearchOutlined,
  FilterOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "antd/dist/reset.css"; // Ensure Ant Design styles are loaded

import moment from 'moment'; // Import moment for date formatting and filtering

import axios from "../../api/axios"; // Your configured axios instance

const { Title, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

// Define colors for the Pie Chart and Area Chart
const PIE_CHART_COLORS = ["#52c41a", "#faad14"]; // Green for Paid, Orange for Pending/Partial
const AREA_CHART_COLORS = ["#0E2B43"]; // A vibrant blue for the area chart

// Define colors for the statistic cards, mimicking the uploaded image
const STATISTIC_CARD_COLORS = [
  "#6ab84d", // Orange
  "#38a1f4", // Blue (RoyalBlue)
  "#7c55c1", // Green (LimeGreen)
  "#f18e56", // Purple (BlueViolet)
];

const InvoiceDashboard = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States for Invoice List filtering and pagination
  const [searchText, setSearchText] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10; // Max 10 items per page in table

  /**
   * Helper function to determine an invoice's payment status based on its total amount
   * and the sum of its payment history.
   * @param {number} totalAmount - The total amount of the invoice.
   * @param {Array<Object>} paymentHistory - An array of payment objects for the invoice.
   * @returns {string} The derived payment status ("Paid", "Partially Paid", "Pending", "Not Applicable").
   */
  const determinePaymentStatus = (totalAmount, paymentHistory) => {
    const paidAmount = (paymentHistory || []).reduce((sum, p) => sum + (p.amount || 0), 0);
    const outstanding = totalAmount - paidAmount;
    const EPSILON = 0.01;

    if (totalAmount === 0 || totalAmount === undefined || totalAmount === null) {
      return "Not Applicable";
    }
    if (outstanding <= EPSILON) {
      return "Paid";
    }
    if (paidAmount > EPSILON) {
      return "Partially Paid";
    }
    return "Pending";
  };

  /**
   * Fetches all invoices from the backend, processes their payment status,
   * and updates the component's state.
   */
  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/invoices");
      const fetchedData = res.data;

      const processedInvoices = fetchedData.map(inv => {
        const invoiceTotal = inv.totalAmount ? parseFloat(inv.totalAmount) : 0;
        const derivedStatus = determinePaymentStatus(invoiceTotal, inv.paymentHistory);
        return {
          ...inv,
          totalAmount: invoiceTotal,
          paymentStatus: derivedStatus, // Assign the derived status
        };
      });

      setInvoices(processedInvoices);

      // --- Debugging derived statuses ---
      console.log("--- Derived Invoice Payment Statuses (for Dashboard) ---");
      processedInvoices.forEach((invoice) => {
        const sumPayments = invoice.paymentHistory?.reduce((sum, p) => sum + p.amount, 0)?.toFixed(2) || '0.00';
        console.log(`ID: ${invoice._id}, Type: ${invoice.invoiceType}, Total: ${invoice.totalAmount?.toFixed(2)}, Payments Sum: ${sumPayments}, Derived Status: '${invoice.paymentStatus}'`);
      });
      console.log("-------------------------------------------------------");

    } catch (err) {
      console.error("Failed to fetch invoices:", err);
      setError("Failed to fetch invoices. Please check your network or backend API.");
      message.error("Failed to fetch invoices");
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch on component mount
  useEffect(() => {
    fetchInvoices();
  }, []);

  // --- Filtering Logic for Table ---
  const applyFiltersAndSearch = () => {
    let currentFiltered = invoices; // Start with the full list from state

    // Apply month and year filters
    if (selectedMonth && selectedYear) {
      currentFiltered = currentFiltered.filter(invoice => {
        const invoiceDate = moment(invoice.date);
        return invoiceDate.month() === selectedMonth - 1 && invoiceDate.year() === selectedYear;
      });
    } else if (selectedMonth) {
      currentFiltered = currentFiltered.filter(invoice => {
        const invoiceDate = moment(invoice.date);
        return invoiceDate.month() === selectedMonth - 1;
      });
    } else if (selectedYear) {
      currentFiltered = currentFiltered.filter(invoice => {
        const invoiceDate = moment(invoice.date);
        return invoiceDate.year() === selectedYear;
      });
    }

    // Apply search text filter
    if (searchText) {
      const lowerCaseSearchText = searchText.toLowerCase();
      currentFiltered = currentFiltered.filter(
        (inv) =>
          inv?.businessName?.toLowerCase().includes(lowerCaseSearchText) ||
          inv?.contactName?.toLowerCase().includes(lowerCaseSearchText) ||
          inv?.invoiceNumber?.toLowerCase().includes(lowerCaseSearchText) ||
          inv?.proformaNumber?.toLowerCase().includes(lowerCaseSearchText) ||
          inv?.paymentStatus?.toLowerCase().includes(lowerCaseSearchText)
      );
    }
    return currentFiltered;
  };

  const filteredInvoicesForTable = applyFiltersAndSearch();

  // Reset to first page on new filter/search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, selectedMonth, selectedYear]);

  // --- Generate Month/Year Options for Filters ---
  const months = moment.months(); // Returns an array of month names from moment
  const currentYear = moment().year();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i); // 5 years back, 4 years forward

  // --- Table Columns Definition (Actions column removed) ---
  const columns = [
    {
      title: 'S.No',
      key: 'sno',
      render: (text, record, index) => (currentPage - 1) * pageSize + index + 1,
      width: 60,
      align: 'center', // Center align S.No
    },
    {
      title: 'Number',
      dataIndex: 'invoiceNumber',
      key: 'number',
      render: (text, record) => record.invoiceNumber || record.proformaNumber || 'N/A',
      sorter: (a, b) => (a.invoiceNumber || a.proformaNumber || '').localeCompare(b.invoiceNumber || b.proformaNumber || ''),
      width: 120,
      align: 'left', // Left align for text
    },
    {
      title: 'Type',
      dataIndex: 'invoiceType',
      key: 'type',
      width: 100,
      render: (type) => <Tag color={type === 'Invoice' ? 'blue' : 'purple'}>{type}</Tag>,
      align: 'center', // Center align tags
    },
    {
      title: 'Business',
      dataIndex: 'businessName',
      key: 'business',
      sorter: (a, b) => (a.businessName || '').localeCompare(b.businessName || ''),
      ellipsis: true, // Add ellipsis for long text
      width: 180, // Give more width
      align: 'left',
    },
    // {
    //   title: 'Customer',
    //   dataIndex: 'customerName',
    //   key: 'customer',
    //   sorter: (a, b) => (a.contactName || '').localeCompare(b.contactName || ''),
    //   ellipsis: true, // Add ellipsis for long text
    //   width: 180, // Give more width
    //   align: 'left',
    // },
    {
      title: 'Amount (₹)',
      dataIndex: 'totalAmount',
      key: 'amount',
      render: (text) => `₹${Number(text).toFixed(2)}`,
      sorter: (a, b) => (a.totalAmount || 0) - (b.totalAmount || 0),
      width: 120,
      align: 'right', // Right align for currency
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (text) => moment(text).format('DD/MM/YYYY'),
      sorter: (a, b) => moment(a.date).unix() - moment(b.date).unix(),
      width: 120,
      align: 'center', // Center align dates
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (text) => text ? moment(text).format('DD/MM/YYYY') : 'N/A',
      sorter: (a, b) => (moment(a.dueDate).isValid() ? moment(a.dueDate).unix() : -Infinity) - (moment(b.dueDate).isValid() ? moment(b.dueDate).unix() : -Infinity),
      width: 120,
      align: 'center', // Center align dates
    },
    {
      title: 'Payment Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status) => {
        let color = 'default';
        if (status === 'Paid') color = 'green';
        else if (status === 'Pending') color = 'volcano';
        else if (status === 'Partially Paid') color = 'orange';
        return <Tag color={color}>{status}</Tag>;
      },
      sorter: (a, b) => (a.paymentStatus || '').localeCompare(b.paymentStatus || ''),
      width: 140,
      align: 'center', // Center align tags
    },
  ];

  // --- Row Rendering with Ribbon/Badge (using Badge for simplicity and direct control) ---
  const getRowClassName = (record) => {
    if (record.paymentStatus === 'Paid') {
      return 'invoice-row-paid'; // Custom CSS class for green background
    } else if (record.paymentStatus === 'Pending') {
      return 'invoice-row-pending'; // Custom CSS class for light red background
    } else if (record.paymentStatus === 'Partially Paid') {
      return 'invoice-row-partial'; // Custom CSS class for light orange background
    }
    return '';
  };

  // Filter for 'Invoice' type documents for dashboard stats/charts
  const actualInvoices = invoices.filter((inv) => inv.invoiceType === "Invoice");

  // --- Calculation for Card Statistics (using derived paymentStatus) ---
  const totalInvoiceCount = actualInvoices.length;
  const totalInvoiceAmount = actualInvoices.reduce(
    (sum, invoice) => sum + (invoice.totalAmount || 0),
    0
  );

  const paidInvoiceCount = actualInvoices.filter(
    (invoice) => invoice.paymentStatus === "Paid"
  ).length;

  const pendingAndPartialInvoiceCount = actualInvoices.filter(
    (invoice) => invoice.paymentStatus === "Pending" || invoice.paymentStatus === "Partially Paid"
  ).length;

  // Pie Chart Data
  const pieChartData = [
    { name: "Paid", value: paidInvoiceCount, amount: actualInvoices.filter(inv => inv.paymentStatus === 'Paid').reduce((sum, inv) => sum + inv.totalAmount, 0) },
    { name: "Pending / Partially Paid", value: pendingAndPartialInvoiceCount, amount: actualInvoices.filter(inv => inv.paymentStatus === 'Pending' || inv.paymentStatus === 'Partially Paid').reduce((sum, inv) => sum + inv.totalAmount, 0) },
  ].filter(data => data.value > 0);

  // Prepare data for the Area Chart (Total Amount by Date)
  const aggregatedChartData = actualInvoices.reduce((acc, invoice) => {
    const date = invoice.createdAt
      ? moment(invoice.createdAt).format('YYYY-MM-DD')
      : "Unknown Date";
    if (!acc[date]) {
      acc[date] = { totalAmount: 0 };
    }
    acc[date].totalAmount += invoice.totalAmount || 0;
    return acc;
  }, {});

  const chartData = Object.keys(aggregatedChartData)
    .map((date) => ({
      date: date,
      amount: aggregatedChartData[date].totalAmount,
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (loading && !invoices.length) { // Only show full screen loader if no data yet
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <Spin size="large" tip="Loading invoice data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "red", fontSize: "1.2em" }}>
        <Paragraph type="danger">{error}</Paragraph>
        <Button onClick={fetchInvoices} type="primary"
                    style={{ backgroundColor: '#0E2B43', borderColor: '#orange', color: 'white' }}
>
          Retry Loading Invoices
        </Button>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1600px", margin: "0 auto" }}>
      <Flex justify="start" align="center" style={{ marginBottom: "24px", flexWrap: 'wrap' }}>
        <Title level={2} style={{ margin: 0 }}>Invoice Dashboard</Title>
      </Flex>
      <Paragraph style={{ marginBottom: "30px" }}>
        Welcome to your Invoice Dashboard. All statistics and charts below reflect documents categorized as 'Invoice'.
      </Paragraph>

      {/* Card Section - Key Statistics */}
      <Title level={3} style={{ marginBottom: "20px" }}>Invoice Overview</Title>
      <Row gutter={[24, 24]} style={{ marginBottom: "30px" }}>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} hoverable className="dashboard-card statistic-card-orange">
            <Statistic
              title={<span style={{ color: 'white' }}>Total Invoices</span>}
              value={totalInvoiceCount}
              valueStyle={{ color: 'white' }}
              prefix={<RiseOutlined style={{ color: 'white' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} hoverable className="dashboard-card statistic-card-blue">
            <Statistic
              title={<span style={{ color: 'white' }}>Total Amount</span>}
              value={totalInvoiceAmount.toFixed(2)}
              prefix={<span style={{ color: 'white' }}>₹</span>}
              valueStyle={{ color: 'white' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} hoverable className="dashboard-card statistic-card-green">
            <Statistic
              title={<span style={{ color: 'white' }}>Paid Invoices</span>}
              value={paidInvoiceCount}
              valueStyle={{ color: 'white' }}
              prefix={<RiseOutlined style={{ color: 'white' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} hoverable className="dashboard-card statistic-card-purple">
            <Statistic
              title={<span style={{ color: 'white' }}>Pending/Partial Invoices</span>}
              value={pendingAndPartialInvoiceCount}
              valueStyle={{ color: 'white' }}
              prefix={<FallOutlined style={{ color: 'white' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Chart Section - Area Chart and Pie Chart */}
      <Row gutter={[24, 24]} style={{ marginBottom: "30px" }}>
       
        <Col xs={24} >
          <Card title="Invoice Payment Status" bordered={false} hoverable className="dashboard-card chart-card">
            <div style={{ height: 300 }}>
              {pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent, amount }) =>
                        `${name}: ${amount.toFixed(2)} (${(percent * 100).toFixed(0)}%)`
                      }
                      animationBegin={800}
                      animationDuration={800}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value, name, props) => [`₹ ${props.payload.amount.toFixed(2)}`, props.payload.name]}
                      contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', border: '1px solid #ddd', borderRadius: '4px' }}
                      labelStyle={{ color: '#333', fontWeight: 'bold' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Paragraph style={{ textAlign: 'center', marginTop: '50px', color: '#888' }}>
                  No invoice data to display for payment status.
                </Paragraph>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* --- Invoice List Section --- */}
      <Title level={3} style={{ marginBottom: "20px" }}>All Invoices</Title>
      <div style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)' }}>
        <Flex justify="space-between" align="center" style={{ marginBottom: 20, gap: '10px', flexWrap: 'wrap' }}>
          <Space wrap size={[16, 16]}>
            <Search
              placeholder="Search by name, number, status..."
              allowClear
              onSearch={(value) => setSearchText(value)}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 300 }}
              enterButton
            />
            <Select
              placeholder="Filter by Month"
              allowClear
              style={{ width: 160 }}
              onChange={(value) => setSelectedMonth(value)}
              value={selectedMonth}
            >
              {months.map((month, index) => (
                <Option key={index + 1} value={index + 1}>{month}</Option>
              ))}
            </Select>
            <Select
              placeholder="Filter by Year"
              allowClear
              style={{ width: 120 }}
              onChange={(value) => setSelectedYear(value)}
              value={selectedYear}
            >
              {years.map((year) => (
                <Option key={year} value={year}>{year}</Option>
              ))}
            </Select>
            {(selectedMonth || selectedYear || searchText) && (
              <Button
                icon={<ClearOutlined />}
                onClick={() => {
                  setSearchText('');
                  setSelectedMonth(null);
                  setSelectedYear(null);
                }}
              >
                Clear Filters
              </Button>
            )}
          </Space>
        </Flex>

        <Table
          columns={columns}
          dataSource={filteredInvoicesForTable}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: filteredInvoicesForTable.length,
            showSizeChanger: false,
            onChange: (page) => setCurrentPage(page),
            position: ['bottomCenter'],
          }}
          rowClassName={getRowClassName}
          scroll={{ x: 'max-content' }}
          bordered
          locale={{ emptyText: 'No invoices found matching your criteria.' }}
        />

        {/* --- Custom CSS for row background colors and general dashboard styles --- */}
        <style jsx>{`
          .dashboard-card {
            border-radius: 12px; /* More rounded corners */
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            transition: all 0.3s;
          }
          .dashboard-card:hover {
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
            transform: translateY(-2px);
          }
          .statistic-card-orange {
            background-color: ${STATISTIC_CARD_COLORS[0]};
          }
          .statistic-card-blue {
            background-color: ${STATISTIC_CARD_COLORS[1]};
          }
          .statistic-card-green {
            background-color: ${STATISTIC_CARD_COLORS[2]};
          }
          .statistic-card-purple {
            background-color: ${STATISTIC_CARD_COLORS[3]};
          }
          /* Ensure text within statistic cards is white */
          .statistic-card-orange .ant-statistic-title,
          .statistic-card-blue .ant-statistic-title,
          .statistic-card-green .ant-statistic-title,
          .statistic-card-purple .ant-statistic-title,
          .statistic-card-orange .ant-statistic-content,
          .statistic-card-blue .ant-statistic-content,
          .statistic-card-green .ant-statistic-content,
          .statistic-card-purple .ant-statistic-content {
            color: white !important; /* Use !important to override Ant Design defaults if necessary */
          }
          .chart-card .ant-card-head {
            border-bottom: none;
            padding-bottom: 0;
          }
          .invoice-row-paid {
            background-color: #f6ffed; /* Ant Design success background */
          }
          .invoice-row-pending {
            background-color: #fff1f0; /* Ant Design error background */
          }
          .invoice-row-partial {
            background-color: #fffbe6; /* Ant Design warning background */
          }
        `}</style>
      </div>
    </div>
  );
};

export default InvoiceDashboard;
