// Dashboard.jsx
import React, { useEffect, useState } from "react";
import {
  Card,
  Col,
  Row,
  Table,
  Tag,
  Typography,
  Tooltip,
  Spin,
  Select,
  Modal,
  Form,
  Input,
  DatePicker,
  message,
  Calendar, // Added Calendar
  Button, // Added Button
} from "antd";
import { Pie } from "@ant-design/plots";
import axios from "../../api/axios";
import "./Dashboard.css";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween"; // Import the plugin
import {
  GlobalOutlined,
  TeamOutlined,
  EyeOutlined,
  EditOutlined,
  FacebookOutlined,
  ShopOutlined,
  QuestionCircleOutlined,
  FireOutlined, // Icon for Hot Lead
  ThunderboltOutlined, // Icon for Warm Lead
  CloudOutlined, // Icon for Cold Lead
  ShareAltOutlined, // Icon for Referral
  CalendarOutlined, // Added CalendarOutlined icon
} from '@ant-design/icons'; // Import Ant Design Icons

import DashboardMetricCard from "./DashboardMetricCard";

dayjs.extend(isBetween); // Extend dayjs with the isBetween plugin

const { Title, Text } = Typography; // Add Text here
const { Option } = Select;
const { TextArea } = Input;

const Dashboard = () => {
  const [latestQuotations, setLatestQuotations] = useState([]);
  const [latestAccounts, setLatestAccounts] = useState([]);
  const [invoiceDetails, setInvoiceDetails] = useState([]); // Keep invoice details for the latest invoices table
  const [allAccounts, setAllAccounts] = useState([]); // Keep all accounts for potential broader filtering/analysis later
  const [loading, setLoading] = useState(true);

  const [allAccountFollowUps, setAllAccountFollowUps] = useState([]);
  const [allQuotationFollowUps, setAllQuotationFollowUps] = useState([]);
  const [allInvoiceFollowUps, setAllInvoiceFollowUps] = useState([]);

  const [filteredAccountFollowups, setFilteredAccountFollowups] = useState([]);
  const [filteredQuotationFollowups, setFilteredQuotationFollowups] = useState([]);
  const [filteredInvoiceFollowups, setFilteredInvoiceFollowups] = useState([]); // State for filtered invoice follow-ups

  // Separate state variables for each table's follow-up filter
  const [accountFollowUpFilter, setAccountFollowUpFilter] = useState("today");
  const [quotationFollowUpFilter, setQuotationFollowUpFilter] = useState("today");
  // const [invoiceFollowUpFilter, setInvoiceFollowUpFilter] = useState("today"); // Uncomment if you re-enable invoice follow-up table

  const [selectedMonth, setSelectedMonth] = useState(dayjs()); // Initialize with current month

  // States for the new Pie Chart data
  const [activeLeadsPie, setActiveLeadsPie] = useState(0);
  const [waitingLeadsPie, setWaitingLeadsPie] = useState(0);
  const [customersPie, setCustomersPie] = useState(0);
  const [closedAccountsPie, setClosedAccountsPie] = useState(0);
  // State for Quotations Sent Leads (already existed from previous change)
  const [quotationsSentPie, setQuotationsSentPie] = useState(0);


  // States for Metric Cards (already exist)
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalClosedAccounts, setTotalClosedAccounts] = useState(0);
  // New state for Total Pending Follow-ups
  const [totalPendingFollowUpsThisMonth, setTotalPendingFollowUpsThisMonth] = useState(0);

  // New state for Source data as requested by the user
  const [sourceData, setSourceData] = useState({
    Direct: 0,
    socialmedia: 0,
    online: 0,
    client: 0,
    tradefair: 0,
    Other: 0,
  });
  // New state to store the total number of leads from all sources
  const [totalSourceLeads, setTotalSourceLeads] = useState(0);

  // New states for Lead Type data - ONLY HotLead, WarmLead, ColdLead, and Other
  const [leadTypeData, setLeadTypeData] = useState({
    WarmLead: 0,
    ColdLead: 0,
    HotLead: 0,
    Other: 0, // 'Other' to catch any types not explicitly listed as Hot, Warm, or Cold
  });
  const [totalLeadTypes, setTotalLeadTypes] = useState(0);


  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState(null);
  const [editForm] = Form.useForm();

  // New state for Calendar Modal visibility
  const [isCalendarModalVisible, setIsCalendarModalVisible] = useState(false);

  // User and Role from local storage for conditional fetching
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;
  const currentUserId = user?._id;

  // Dummy trend data for DashboardMetricCard - these would ideally be dynamic.
  const totalInvoiceTrendData = [
    { x: "2024-01-01", y: 1000, category: "trend" },
    { x: "2024-02-01", y: 1200, category: "trend" },
    { x: "2024-03-01", y: 1100, category: "trend" },
    { x: "2024-04-01", y: 1300, category: "trend" },
    { x: "2024-05-01", y: 1250, category: "trend" },
    { x: "2024-06-01", y: 1400, category: "trend" },
  ];
  const paidTrendData = [
    { x: "2024-01-01", y: 800, category: "trend" },
    { x: "2024-02-01", y: 900, category: "trend" },
    { x: "2024-03-01", y: 850, category: "trend" },
    { x: "2024-04-01", y: 1000, category: "trend" },
    { x: "2024-05-01", y: 950, category: "trend" },
    { x: "2024-06-01", y: 1100, category: "trend" },
  ];
  const pendingTrendData = [
    { x: "2024-01-01", y: 200, category: "trend" },
    { x: "2024-02-01", y: 300, category: "trend" },
    { x: "2024-03-01", y: 250, category: "trend" },
    { x: "2024-04-01", y: 300, category: "trend" },
    { x: "2024-05-01", y: 300, category: "trend" },
    { x: "2024-06-01", y: 300, category: "trend" },
  ];

  const totalLeadsTrendData = [
    { x: "2024-01-01", y: 50, category: "trend" },
    { x: "2024-02-01", y: 55, category: "trend" },
    { x: "2024-03-01", y: 60, category: "trend" },
    { x: "2024-04-01", y: 58, category: "trend" },
    { x: "2024-05-01", y: 65, category: "trend" },
    { x: "2024-06-01", y: 70, category: "trend" },
  ];
  const convertedCustomersTrendData = [
    { x: "2024-01-01", y: 10, category: "trend" },
    { x: "2024-02-01", y: 12, category: "trend" },
    { x: "2024-03-01", y: 15, category: "trend" },
    { x: "2024-04-01", y: 14, category: "trend" },
    { x: "2024-05-01", y: 17, category: "trend" },
    { x: "2024-06-01", y: 20, category: "trend" },
  ];
  const closedAccountsTrendData = [
    { x: "2024-01-01", y: 5, category: "trend" },
    { x: "2024-02-01", y: 7, category: "trend" },
    { x: "2024-03-01", y: 8, category: "trend" },
    { x: "2024-04-01", y: 9, category: "trend" },
    { x: "2024-05-01", y: 11, category: "trend" },
    { x: "2024-06-01", y: 13, category: "trend" },
  ];

  // New dummy trend data for pending follow-ups
  const pendingFollowUpsTrendData = [
    { x: "2024-01-01", y: 3, category: "trend" },
    { x: "2024-02-01", y: 5, category: "trend" },
    { x: "2024-03-01", y: 4, category: "trend" },
    { x: "2024-04-01", y: 6, category: "trend" },
    { x: "2024-05-01", y: 5, category: "trend" },
    { x: "2024-06-01", y: 7, category: "trend" },
  ];

  // New dummy trend data for pipeline leads
  const pipelineLeadsTrendData = [
    { x: "2024-01-01", y: 10, category: "trend" },
    { x: "2024-02-01", y: 15, category: "trend" },
    { x: "2024-03-01", y: 12, category: "trend" },
    { x: "2024-04-01", y: 18, category: "trend" },
    { x: "2024-05-01", y: 16, category: "trend" },
    { x: "2024-06-01", y: 20, category: "trend" },
  ];

  // NEW: Dummy trend data for Quotations Sent
  const quotationsSentTrendData = [
    { x: "2024-01-01", y: 8, category: "trend" },
    { x: "2024-02-01", y: 10, category: "trend" },
    { x: "2024-03-01", y: 9, category: "trend" },
    { x: "2024-04-01", y: 12, category: "trend" },
    { x: "2024-05-01", y: 11, category: "trend" },
    { x: "2024-06-01", y: 14, category: "trend" },
  ];

  /**
   * Returns the appropriate Ant Design Icon for a given source type.
   * Ensures all defined source types have a specific icon and provides a fallback.
   * @param {string} sourceType - The type of lead source (e.g., 'Direct', 'Facebook', 'client').
   * @returns {JSX.Element} An Ant Design Icon component.
   */
  const getSourceIcon = (sourceType) => {
    switch (sourceType) {
      case 'Direct':
        return <ShopOutlined />; // Represents direct interaction or walk-in
      case 'socialmedia':
        return <FacebookOutlined />; // Represents Facebook as a source
      case 'online':
        return <GlobalOutlined />; // Represents website traffic as a source
      case 'client':
        return <TeamOutlined />; // Represents referrals from existing clients/teams
      case 'tradefair':
        return <GlobalOutlined />; // Represents leads from a trade fair or exhibition (global event)
      case 'Other':
        return <QuestionCircleOutlined />; // Fallback for 'Other' explicitly defined
      default:
        return <QuestionCircleOutlined />; // General fallback for any unhandled source types
    }
  };

  /**
   * Returns the appropriate Ant Design Icon for a given lead type.
   * Ensures only 'HotLead', 'WarmLead', 'ColdLead', and 'Other' are handled with specific icons.
   * @param {string} leadType - The type of lead (e.g., 'HotLead', 'WarmLead', 'ColdLead').
   * @returns {JSX.Element} An Ant Design Icon component with specific styling.
   */
  const getLeadTypeIcon = (leadType) => {
    switch (leadType) {
      case 'HotLead':
        return <FireOutlined style={{ color: '#ff4d4f' }} />; // Red for Hot
      case 'WarmLead':
        return <ThunderboltOutlined style={{ color: '#faad14' }} />; // Orange for Warm
      case 'ColdLead':
        return <CloudOutlined style={{ color: '#0E2B43' }} />; // Blue for Cold
      case 'Other':
        return <QuestionCircleOutlined style={{ color: '#bfbfbf' }} />; // Grey for Other
      default:
        return <QuestionCircleOutlined style={{ color: '#bfbfbf' }} />; // General fallback for any unhandled lead types
    }
  };


  const fetchAllDashboardData = async (monthMoment = dayjs()) => {
    try {
      setLoading(true);

      const month = monthMoment.month() + 1; // dayjs month is 0-indexed
      const year = monthMoment.year();
      const monthStart = monthMoment.startOf("month");
      const monthEnd = monthMoment.endOf("month");

      // Conditionally add assignedTo query parameter if the user is an employee
      const accountApiUrl = role === 'employee' ? `/api/accounts?assignedTo=${currentUserId}` : "/api/accounts";
      const quotationApiUrl = role === 'employee' ? `/api/quotations?assignedTo=${currentUserId}` : "/api/quotations";
      // Assuming invoices are not directly assigned, or fetching all is acceptable
      const invoiceApiUrl = "/api/invoices";

      const [quotRes, accRes, invRes] = await Promise.all([
        axios.get(quotationApiUrl),
        axios.get(accountApiUrl),
        axios.get(invoiceApiUrl),
      ]);

      // --- FIX START ---
      // Ensure quotRes.data is an array before slicing
      const quotationsData = Array.isArray(quotRes.data) ? quotRes.data : [];
      setLatestQuotations(quotationsData.slice(0, 5));

      // Ensure accRes.data is an array before slicing and filtering
      const accountsData = Array.isArray(accRes.data) ? accRes.data : [];
      setLatestAccounts(accountsData.slice(0, 5)); // Still display latest overall accounts

      // Ensure invRes.data is an array before filtering
      const invoicesData = Array.isArray(invRes.data) ? invRes.data : [];
      const filteredInvoices = invoicesData.filter((invoice) => {
        if (!invoice.date) return false;
        const invoiceDate = dayjs(invoice.date);
        return invoiceDate.month() + 1 === month && invoiceDate.year() === year;
      });
      setInvoiceDetails(filteredInvoices);

      setAllAccounts(accountsData); // Keep all accounts in state for broader analysis

      // Filter accounts for the selected month for metric cards AND new pie chart
      // IMPORTANT: Added condition to exclude soft-deleted accounts (assuming a 'isDeleted' field)
      const accountsInSelectedMonth = accountsData.filter((account) => { // Use accountsData here
        if (!account.createdAt) return false;
        const accountDate = dayjs(account.createdAt);
        // Exclude accounts where isDeleted is true. If your soft-delete field is different (e.g., 'deletedAt'), adjust this line.
        return accountDate.isBetween(monthStart, monthEnd, null, "[]") && !account.isDeleted;
      });
      // --- FIX END ---


      // Metric Card Calculations
      // Updated: This now counts all accounts in the selected month regardless of customer status
      setTotalLeads(accountsInSelectedMonth.length);

      setTotalCustomers(
        accountsInSelectedMonth.filter(
          (account) =>
            account.isCustomer &&
            dayjs(account.convertedDate).isBetween(
              monthStart,
              monthEnd,
              null,
              "[]"
            )
        ).length
      );
      setTotalClosedAccounts(
        accountsInSelectedMonth.filter(
          (account) =>
            account.status === "Closed" &&
            dayjs(account.closedDate).isBetween(
              monthStart,
              monthEnd,
              null,
              "[]"
            )
        ).length
      );

      // New Pie Chart Data Calculations (from accounts created/active in the selected month)
      const monthlyActiveLeads = accountsInSelectedMonth.filter(
        (account) => !account.isCustomer && account.status === "Active"
      ).length;
      const monthlyWaitingLeads = accountsInSelectedMonth.filter(
        (account) => !account.isCustomer && account.status === "Pipeline"
      ).length;
      // Calculate Quotations Sent Leads (re-using quotationsSentPie)
      const monthlyQuotationsSent = accountsInSelectedMonth.filter(
        (account) => account.status === "Quotations"
      ).length;
      const monthlyConvertedCustomers = accountsInSelectedMonth.filter(
        (account) =>
          account.isCustomer &&
          dayjs(account.convertedDate).isBetween(
            monthStart,
            monthEnd,
            null,
            "[]"
          )
      ).length;
      const monthlyClosedAccounts = accountsInSelectedMonth.filter(
        (account) =>
          account.status === "Closed" &&
          dayjs(account.closedDate).isBetween(monthStart, monthEnd, null, "[]")
      ).length;

      setActiveLeadsPie(monthlyActiveLeads);
      setWaitingLeadsPie(monthlyWaitingLeads);
      setQuotationsSentPie(monthlyQuotationsSent); // Set the state for the new card and pie chart
      setCustomersPie(monthlyConvertedCustomers);
      setClosedAccountsPie(monthlyClosedAccounts);

      // Calculate Source Data for the new card - NOW FILTERED BY SELECTED MONTH
      const currentSourceCounts = {
        Direct: 0,
        socialmedia: 0,
        online: 0,
        client: 0,
        tradefair: 0,
        Other: 0,
      };

      // Using accountsInSelectedMonth for source distribution
      accountsInSelectedMonth.forEach(account => { // Changed from accRes.data to accountsInSelectedMonth
        if (!account.isDeleted) {
          let sourceKey = 'Other';
          // Use a switch statement to correctly map sourceType to the keys in currentSourceCounts
          switch (account.sourceType) {
            case 'Direct':
              sourceKey = 'Direct';
              break;
            case 'socialmedia':
              sourceKey = 'socialmedia';
              break;

            case 'online':
              sourceKey = 'online';
              break;

            case 'client': // Handle 'client' source type
              sourceKey = 'client';
              break;
            case 'tradefair': // Handle 'tradefair' source type
              sourceKey = 'tradefair';
              break;
            default:
              sourceKey = 'Other'; // Any other source type falls into 'Other'
          }
          currentSourceCounts[sourceKey]++;
        }
      });
      setSourceData(currentSourceCounts);

      // Calculate the total number of leads from all sources (for the selected month)
      const total = Object.values(currentSourceCounts).reduce((sum, count) => sum + count, 0);
      setTotalSourceLeads(total);

      // Calculate Lead Type Data - Only Hot, Warm, Cold - NOW FILTERED BY SELECTED MONTH
      const currentLeadTypeCounts = {
        WarmLead: 0,
        ColdLead: 0,
        HotLead: 0,
        Other: 0, // For any lead types not explicitly Hot, Warm, or Cold
      };

      // Corrected: Using 'accountsInSelectedMonth' and mapping to specific keys
      accountsInSelectedMonth.forEach(account => { // Changed from accRes.data to accountsInSelectedMonth
        if (!account.isDeleted) {
          let leadTypeKey = 'Other'; // Default to 'Other'

          switch (account.type) {
            case 'Hot':
              leadTypeKey = 'HotLead';
              break;
            case 'Warm':
              leadTypeKey = 'WarmLead';
              break;
            case 'Cold':
              leadTypeKey = 'ColdLead';
              break;
            default:
              // Any other 'account.type' (like 'Referral', 'client', 'tradefair') will fall into 'Other'
              leadTypeKey = 'Other';
          }
          currentLeadTypeCounts[leadTypeKey]++;
        }
      });
      setLeadTypeData(currentLeadTypeCounts);
      const totalTypes = Object.values(currentLeadTypeCounts).reduce((sum, count) => sum + count, 0);
      setTotalLeadTypes(totalTypes);


      // Fetch all follow-ups and filter them by month
      const { allAccountFUs, allQuotationFUs, allInvoiceFUs } = await fetchAllFollowUps(
        quotationsData, // Pass the ensured array
        accountsData,   // Pass the ensured array
        invoicesData,   // Pass the ensured array
        monthMoment
      );

      // Calculate Total Pending Follow-ups for the month
      const pendingAccounts = allAccountFUs.filter(f => f.status === 'pending').length;
      const pendingQuotations = allQuotationFUs.filter(f => f.status === 'pending').length;
      const pendingInvoices = allInvoiceFUs.filter(f => f.status === 'pending').length;
      setTotalPendingFollowUpsThisMonth(pendingAccounts + pendingQuotations + pendingInvoices);


    } catch (err) {
      console.error("Failed to load dashboard data", err);
      message.error("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };
  // Modified fetchAllFollowUps to include month filtering and return filtered data
  const fetchAllFollowUps = async (
    quotations,
    accounts,
    invoices,
    monthMoment
  ) => {
    const month = monthMoment.month() + 1;
    const year = monthMoment.year();

    const filterFollowUpsByMonth = (followUps) => {
      return followUps.filter((f) => {
        if (!f.followupDate) return false;

        // Ensure followupDate is treated as a date object
        const followupDate = dayjs(f.followupDate);
        return (
          followupDate.isValid() &&
          followupDate.month() + 1 === month &&
          followupDate.year() === year
        );
      });
    };

    // Account Follow-ups
    // Pass only the already filtered accounts to avoid fetching follow-ups for non-assigned accounts
    const accountFollowUpPromises = accounts.map(async (account) => {
      try {
        const res = await axios.get(`/api/accounts/${account._id}/followups`);
        return res.data.map((f, index) => ({
          ...f,
          type: "account",
          parentName: account.businessName,
          parentId: account._id,
          followupDate: f.date, // Ensure this matches the backend field name
          originalIndex: index,
        }));
      } catch (error) {
        console.error(
          `Failed to fetch follow-ups for account ${account.businessName} (${account._id}):`,
          error
        );
        return [];
      }
    });

    // Quotation Follow-ups
    // Pass only the already filtered quotations
    const quotationFollowUpPromises = quotations.map(async (quotation) => {
      try {
        const res = await axios.get(
          `/api/quotations/${quotation._id}/followups`
        );
        return res.data.map((f, index) => ({
          ...f,
          type: "quotation",
          parentName: quotation.businessName,
          parentId: quotation._id,
          followupDate: f.date, // Ensure this matches the backend field name
          originalIndex: index,
        }));
      } catch (error) {
        console.error(
          `Failed to fetch follow-ups for quotation ${quotation.quotationNumber} (${quotation._id}):`,
          error
        );
        return [];
      }
    });

    // Invoice Follow-ups
    // Pass only the already filtered invoices
    const invoiceFollowUpPromises = invoices.map(async (invoice) => {
      try {
        const res = await axios.get(`/api/invoices/${invoice._id}/followups`);
        return res.data.map((f, index) => ({
          ...f,
          type: "invoice",
          parentName: invoice.businessName,
          parentId: invoice._id,
          followupDate: f.date, // Ensure this matches the backend field name
          originalIndex: index,
        }));
      } catch (error) {
        console.error(
          `Failed to fetch follow-ups for invoice ${invoice.invoiceNumber || invoice.proformaNumber
          } (${invoice._id}):`,
          error
        );
        return [];
      }
    });

    const allAccountFUs = (await Promise.all(accountFollowUpPromises)).flat();
    const allQuotationFUs = (
      await Promise.all(quotationFollowUpPromises)
    ).flat();
    const allInvoiceFUs = (await Promise.all(invoiceFollowUpPromises)).flat();

    // Apply month filter to all follow-ups before setting them
    const monthlyAccountFUs = filterFollowUpsByMonth(allAccountFUs);
    const monthlyQuotationFUs = filterFollowUpsByMonth(allQuotationFUs);
    const monthlyInvoiceFUs = filterFollowUpsByMonth(allInvoiceFUs);

    setAllAccountFollowUps(monthlyAccountFUs);
    setAllQuotationFollowUps(monthlyQuotationFUs);
    setAllInvoiceFollowUps(monthlyInvoiceFUs);

    // Apply existing relative date filter ("today", "upcoming", "past") on the *monthly filtered* data
    // Use the specific filter states for initial application
    applyFollowUpFilter(
      accountFollowUpFilter, // Use account specific filter
      monthlyAccountFUs,
      setFilteredAccountFollowups
    );
    applyFollowUpFilter(
      quotationFollowUpFilter, // Use quotation specific filter
      monthlyQuotationFUs,
      setFilteredQuotationFollowups
    );
    applyFollowUpFilter(
      // invoiceFollowUpFilter, // Uncomment if you re-enable invoice follow-up table
      "today", // Default or specific filter for invoices if re-enabled
      monthlyInvoiceFUs,
      setFilteredInvoiceFollowups
    );

    // Return the monthly filtered follow-ups for further calculations in fetchAllDashboardData
    return { allAccountFUs: monthlyAccountFUs, allQuotationFUs: monthlyQuotationFUs, allInvoiceFUs: monthlyInvoiceFUs };
  };

  useEffect(() => {
    // Initial fetch using the default selectedMonth (current month)
    fetchAllDashboardData(selectedMonth);
  }, [selectedMonth, role, currentUserId]); // Re-fetch data when selectedMonth, role or currentUserId changes

  const applyFollowUpFilter = (filterType, followUps, setFilteredState) => {
    const today = dayjs().startOf("day");

    const filtered = followUps.filter((f) => {
      if (!f.followupDate) return false;

      const followupDate = dayjs(f.followupDate).startOf("day");

      // Filter out 'completed' follow-ups regardless of date filter type
      if (f.status === 'completed') {
        return false;
      }

      if (filterType === "today") {
        return followupDate.isSame(today, "day");
      } else if (filterType === "upcoming") {
        return followupDate.isAfter(today, "day");
      } else if (filterType === "past") {
        return followupDate.isBefore(today, "day");
      }
      return false;
    });
    setFilteredState(filtered);
  };

  // This function will now be triggered by the Calendar's onSelect
  const handleCalendarSelect = (value) => {
    setSelectedMonth(value); // value here is a dayjs object of the selected date
    setIsCalendarModalVisible(false); // Close modal after selection
  };

  const renderStatusTag = (status) => {
    let color;
    switch (status) {
      case "Active":
        color = "green";
        break;
      case "Inactive":
        color = "red";
        break;
      case "Pipeline":
        color = "orange";
        break;
      case "Closed":
        color = "purple"; // Color for Closed status
        break;
      default:
        color = "blue";
    }
    return <Tag color={color}>{status}</Tag>;
  };

  const showEditModal = (followUp) => {
    setEditingFollowUp(followUp);
    editForm.setFieldsValue({
      note: followUp.note,
      followupDate: followUp.followupDate ? dayjs(followUp.followupDate) : null,
      status: followUp.status, // Load existing status into the form
    });
    setIsEditModalVisible(true);
  };

  const handleEditModalCancel = () => {
    setIsEditModalVisible(false);
    setEditingFollowUp(null);
    editForm.resetFields();
  };

  // Separate handlers for each table's filter change
  const handleAccountFollowUpFilterChange = (value) => {
    setAccountFollowUpFilter(value);
    applyFollowUpFilter(
      value,
      allAccountFollowUps,
      setFilteredAccountFollowups
    );
  };

  const handleQuotationFollowUpFilterChange = (value) => {
    setQuotationFollowUpFilter(value);
    applyFollowUpFilter(
      value,
      allQuotationFollowUps,
      setFilteredQuotationFollowups
    );
  };

  // const handleInvoiceFollowUpFilterChange = (value) => { // Uncomment if you re-enable invoice follow-up table
  //   setInvoiceFollowUpFilter(value);
  //   applyFollowUpFilter(
  //     value,
  //     allInvoiceFollowUps,
  //     setFilteredInvoiceFollowups
  //   );
  // };

  const handleEditModalOk = async () => {
    try {
      const values = await editForm.validateFields();
      const { note, followupDate, status } = values; // Destructure status

      if (!editingFollowUp) return;

      const { type, parentId, originalIndex } = editingFollowUp;

      let apiUrl = "";
      if (type === "account") {
        apiUrl = `/api/accounts/${parentId}/followups/${originalIndex}`;
      } else if (type === "quotation") {
        apiUrl = `/api/quotations/${parentId}/followups/${originalIndex}`;
      } else if (type === "invoice") {
        apiUrl = `/api/invoices/${parentId}/followups/${originalIndex}`;
      } else {
        message.error("Unknown follow-up type.");
        return;
      }

      await axios.put(apiUrl, {
        date: followupDate ? followupDate.format("DD-MM-YYYY") : null,
        note: note,
        status: status, // Include status in the update payload
      });

      message.success("Follow-up updated successfully!");
      setIsEditModalVisible(false);
      setEditingFollowUp(null);
      editForm.resetFields();
      fetchAllDashboardData(selectedMonth); // Refresh all dashboard data with current month filter
    } catch (error) {
      console.error("Failed to update follow-up:", error);
      message.error("Failed to update follow-up. Please try again.");
    }
  };

 const columnsFollowups = [
  { title: "S.No", render: (_, __, i) => i + 1,  width: 50 },
  {
    title: "Business Name",
    dataIndex: "parentName",
    render: (text) => text ? text.charAt(0).toUpperCase() + text.slice(1) : "N/A", // Added a check for 'text'
    width: 180,
  },
  {
    title: "Added By",
    dataIndex: "addedBy",
    render: (addedBy) => addedBy?.name || addedBy?.email || "Unknown",
  },
  {
    title: "Date",
    dataIndex: "followupDate",
    render: (d) => (d ? dayjs(d).toDate().toLocaleDateString() : "N/A"),
  },
  {
    title: "Status",
    dataIndex: "status",
    width: 100,
    render: (status) => {
      let color;
      switch (status) {
        case "pending":
          color = "gold";
          break;
        case "completed":
          color = "green";
          break;
        default:
          color = "blue";
      }
      return <Tag color={color}>{status}</Tag>;
    },
  },
  {
    title: "Action",
    key: "action",
    render: (_, record) => <a onClick={() => showEditModal(record)}><EditOutlined /></a>,
    width: 80,
  },
  {
    title: "View message",
    dataIndex: "note",
    width: 150,
    render: (note) => (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{
          maxWidth: '80px',
          whiteWhiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          marginRight: '8px'
        }}>
        </span>
        {note && note.length > 0 && (
          <Tooltip title={note}>
            <EyeOutlined style={{ cursor: 'pointer', color: '#1890ff' }} />
          </Tooltip>
        )}
      </div>
    ),
  },
];

  const columnsAccounts = [
    { title: "S.No", render: (_, __, i) => i + 1 },
    { title: "Lead Name", dataIndex: "businessName" },
    { title: "Company Name", dataIndex: "businessName" },
    { title: "Phone", dataIndex: "phoneNumber" },
    { title: "Lead Status", dataIndex: "status", render: renderStatusTag },
  ];

  const columnsQuotations = [
    { title: "S.No", render: (_, __, i) => i + 1 },
    { title: "Business Name", dataIndex: "businessName" },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => <Tag>{status || "N/A"}</Tag>,
    },
    {
      title: "Notes",
      render: (_, record) =>
        record.notes?.length ? record.notes.at(-1).text : "No notes",
    },
    {
      title: "Date",
      dataIndex: "date",
      render: (d) => (d ? new Date(d).toLocaleDateString() : "N/A"),
    },
  ];

  const columnsInvoices = [
    { title: "S.No", render: (_, __, i) => i + 1 },
    { title: "Invoice No.", dataIndex: "invoiceNumber" },
    { title: "Business", dataIndex: "businessName" },
    {
      title: "Status",
      dataIndex: "paymentStatus",
      render: (status) => (
        <Tag color={status === "paid" ? "green" : "orange"}>{status}</Tag>
      ),
    },
    {
      title: "Amount",
      dataIndex: "totalAmount",
      render: (amt) => `₹${amt?.toFixed(2) || "0.00"}`,
    },
    {
      title: "Date",
      dataIndex: "date",
      render: (d) => (d ? new Date(d).toLocaleDateString() : "N/A"),
    },
  ];

  // Updated Pie Chart Data for Accounts Distribution
  const accountsPieData = [
    { type: "Lead", value: activeLeadsPie },
    { type: "Enquiry ", value: waitingLeadsPie },
    { type: "Quotations ", value: quotationsSentPie }, // Added "Quotations Sent"
    { type: "Converted ", value: customersPie },
    { type: "Closed ", value: closedAccountsPie },
  ].filter((item) => item.value > 0); // Only show categories with a value > 0

  const accountsPieConfig = {
    appendPadding: 10,
    data: accountsPieData,
    angleField: "value",
    colorField: "type",
    radius: 1,
    height: 250,
    innerRadius: 0.6,
    label: {
      type: "inner",
      offset: "-50%",
      content: ({ type, value }) => `${type}: ${value}`,
      style: {
        textAlign: "center",
        fontSize: 14,
      },
    },
    interactions: [{ type: "element-selected" }, { type: "element-active" }],
    legend: { position: "bottom" },
    // Updated color array to include a color for "Quotations Sent"
    color: ["#52c41a", "#faad14", "#FFC107", "#2196F3", "#673AB7"], // Green, Orange, Yellow (for Quotations), Blue, Purple
  };

  if (loading) return <Spin fullscreen />;

  return (
    <div>
      <Title level={2}>Dashboard</Title>

      {/* Metric Cards for Business Accounts, Converted Customers, and Total Invoice Amount */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={12} lg={5}>
          <DashboardMetricCard
            title="Leads"
            value={totalLeads}
            valuePrefix=""
            percentageChange={15} // This is static, would need dynamic calculation for real trend
            trendData={totalLeadsTrendData}
            cardColor="linear-gradient(135deg, #2196F3, #64B5F6)"
            trendLabel="Accounts Growth"
          />
        </Col>
        <Col xs={24} sm={12} md={12} lg={5}>
          <DashboardMetricCard
            title="Enquiry  "
            value={waitingLeadsPie}
            valuePrefix=""
            percentageChange={5} // Dummy percentage change
            trendData={pipelineLeadsTrendData} // Dummy trend data
            cardColor="linear-gradient(135deg, #f7b414,#f7b414)" // Yellow/Amber for Pipeline
            trendLabel="Pipeline Growth"
          />
        </Col>
        {/* NEW CARD: Quotations Sent */}
        <Col xs={24} sm={12} md={12} lg={5}>
          <DashboardMetricCard
            title="Quotations "
            value={quotationsSentPie}
            valuePrefix=""
            percentageChange={7} // Dummy percentage change
            trendData={quotationsSentTrendData}
            cardColor="linear-gradient(135deg, #0dcccc, #0dcccc)" // Yellow/Amber gradient
            trendLabel="Quotations Sent Trend"
          />
        </Col>
        <Col xs={24} sm={12} md={12} lg={5}>
          <DashboardMetricCard
            title="Converted  "
            value={totalCustomers}
            valuePrefix=""
            percentageChange={20} // This is static, would need dynamic calculation for real trend
            trendData={convertedCustomersTrendData} // This is static, would need dynamic calculation for real trend
            cardColor="linear-gradient(135deg, #4CAF50, #8BC34A)"
            trendLabel="Customer Conversion"
          />
        </Col>

        {/* Metric Card for Closed Accounts */}
        <Col xs={24} sm={12} md={12} lg={4}>
          <DashboardMetricCard
            title="Closed  "
            value={totalClosedAccounts}
            valuePrefix=""
            percentageChange={10} // Dummy percentage change, would need dynamic calculation for real trend
            trendData={closedAccountsTrendData} // Dummy trend data, would need dynamic calculation for real trend
            cardColor="linear-gradient(135deg,rgb(216, 87, 28),rgb(205, 182, 117))"
            trendLabel="Closed Accounts Trend"
          />
        </Col>
        {/* New Metric Card for Pipeline Leads */}

      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={24} md={12} lg={12}>
          <Card
            title={
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GlobalOutlined /> Leads by Source (This Month) ({totalSourceLeads}) {/* Updated title */}
              </span>
            }
            bordered
            style={{ height: '100%' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(sourceData).map(([source, count]) => (
                <div key={source} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 15px',
                  backgroundColor: '#f0f2f5', // Light grey background for each item
                  borderRadius: '8px', // Rounded corners for each item
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)', // Subtle shadow
                }}>
                  <Typography.Text strong style={{ fontSize: 15, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getSourceIcon(source)} {source.replace(/([A-Z])/g, ' $1').trim()} {/* Formats camelCase to "Camel Case" for display */}
                  </Typography.Text>
                  <Tag color="blue" style={{ fontSize: '14px', padding: '5px 10px', borderRadius: '4px' }}>
                    {count}
                  </Tag>
                </div>
              ))}
              {/* Display the total number of leads from all sources */}

            </div>
          </Card>
        </Col>
        {/* Account Status Distribution Pie Chart */}
        <Col xs={24} sm={24} md={12} lg={12}>
          <Card
            title={
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>Account Status (This Month) ({activeLeadsPie +
                  waitingLeadsPie +
                  quotationsSentPie + // Added to total count
                  customersPie +
                  closedAccountsPie} )</span>

                <Button onClick={() => setIsCalendarModalVisible(true)}>
                  <CalendarOutlined /> Select Month
                </Button>
              </div>
            }
            bordered
          >
            <div className="chart-wrapper">
              {accountsPieData.length > 0 ? (
                <Pie {...accountsPieConfig} />
              ) : (
                <div style={{ textAlign: "center", padding: "50px" }}>
                  No account data available for this month.
                </div>
              )}
            </div>
            {/* You can add summary info related to these account types if needed */}

          </Card>
        </Col>

      </Row>

      {/* <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title="Recently Created Leads"
            bordered
            extra={<a href="/leads">View All</a>}
          >
            <Table
              columns={columnsAccounts}
              dataSource={latestAccounts}
              rowKey="_id"
              pagination={false}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title="Latest Quotations"
            bordered
            extra={<a href="/quotation">View All</a>}
          >
            <Table
              columns={columnsQuotations}
              dataSource={latestQuotations}
              rowKey="_id"
              pagination={false}
            />
          </Card>
        </Col>
      </Row> */}

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        {/* <Col xs={24} lg={12}>
          <Card
            title="Latest Invoices (This Month)"
            bordered
            extra={<a href="/invoice">View All</a>}
          >
            <Table
              columns={columnsInvoices}
              dataSource={invoiceDetails.slice(0, 5)} // Display latest 5 from the month-filtered invoices
              rowKey="_id"
              pagination={false}
              locale={{ emptyText: "No invoices for this month" }}
            />
          </Col>
        {/* Follow-up sections - now split by type */}
        {/* Account Follow-ups Card */}
        <Col xs={24} sm={24} md={12} lg={12}>
<Card
  title={
    <div
      style={{
        display: "flex",
        justifyContent: "space-around",
        alignItems: "left",
        flexWrap: "wrap",
        gap: "8px",
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 500 }}>
        {accountFollowUpFilter.charAt(0).toUpperCase() + accountFollowUpFilter.slice(1)} Leads Follow-ups
      </span>
      <Select
        value={accountFollowUpFilter} // Use specific filter state
        onChange={handleAccountFollowUpFilterChange} // Use specific handler
        style={{ width: 90 }}
        size="small"
      >
        <Option value="today">Today</Option>
        <Option value="upcoming">Upcoming</Option>
        <Option value="past">Past</Option>
      </Select>
    </div>
  }
  bordered
  extra={<a href="/leads">All Leads</a>}
  style={{ width: "100%" }}
>
  <div style={{ overflowX: "auto" }}>
    <Table
      columns={columnsFollowups}
      dataSource={filteredAccountFollowups}
      rowKey={(record, index) => `${record.parentId || "no-parent"}-${record.originalIndex || index}`}
      pagination={false}
      scroll={{ x: "max-content" }}
      size="small"
      locale={{ emptyText: "No account follow-ups in this category" }}
    />
  </div>
</Card>
</Col>

<Col xs={24} sm={24} md={12} lg={12}>
<Card
  title={
    <div
      style={{
        display: "flex",
        justifyContent: "space-around",
        alignItems: "left",
        flexWrap: "wrap",
        gap: "8px",
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 500, width: 180 }}>
        {quotationFollowUpFilter.charAt(0).toUpperCase() + quotationFollowUpFilter.slice(1)} Quotation Follow-ups
      </span>
      <Select
        value={quotationFollowUpFilter} // Use specific filter state
        onChange={handleQuotationFollowUpFilterChange} // Use specific handler
        style={{ width: 90 }}
        size="small"
      >
        <Option value="today">Today</Option>
        <Option value="upcoming">Upcoming</Option>
        <Option value="past">Past</Option>
      </Select>
    </div>
  }
  bordered
  extra={<a href="/quotation"> All Quotations</a>}
  style={{ width: "100%" }}
>
  <div style={{ overflowX: "auto" }}>
    <Table
      columns={columnsFollowups}
      dataSource={filteredQuotationFollowups}
      rowKey={(record, index) => `${record.parentId || "no-parent"}-${record.originalIndex || index}`}
      pagination={false}
      scroll={{ x: "max-content" }}
      size="small"
      locale={{ emptyText: "No quotation follow-ups in this category" }}
    />
  </div>
</Card>
</Col>

      </Row>
      {/* <Row gutter={[16, 16]} style={{ marginTop: 24 }}>

        <Col xs={24} lg={12}>
          <Card
            title={
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-around",
                  alignItems: "center",
                }}
              >
                <span>
                  {invoiceFollowUpFilter.charAt(0).toUpperCase() + // Use specific filter state
                    invoiceFollowUpFilter.slice(1)}{" "}
                  Invoice Follow-ups
                </span>
                <Select
                  value={invoiceFollowUpFilter} // Use specific filter state
                  onChange={handleInvoiceFollowUpFilterChange} // Use specific handler
                  style={{ width: 120 }}
                >
                  <Option value="today">Today</Option>
                  <Option value="upcoming">Upcoming</Option>
                  <Option value="past">Past</Option>
                </Select>
              </div>
            }
            bordered
            extra={<a href="/invoice">View All Invoices</a>}
          >
            <div className="responsive-table">
              <Table
                columns={columnsFollowups}
                dataSource={filteredInvoiceFollowups}
                rowKey={(record, index) =>
                  `${record.parentId || "no-parent"}-${record.originalIndex || index
                  }`
                }
                pagination={false}
                locale={{ emptyText: "No invoice follow-ups in this category" }}
                scroll={{ x: 'max-content' }}
              />
            </div>
          </Card>
        </Col>
      </Row> */}

      {/* Edit Follow-up Modal */}
      <Modal
        title={`Edit Follow-up `}
        open={isEditModalVisible}
        onOk={handleEditModalOk}
        onCancel={handleEditModalCancel}
        okText="Update"
        cancelText="Cancel"
      >
        {editingFollowUp && (
          <Text strong>
            {`${editingFollowUp.parentName || ""} (${editingFollowUp.type.charAt(0).toUpperCase() +
              editingFollowUp.type.slice(1) || ""
              })`}
          </Text>
        )}
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="note"
            label="Follow-up Comment"
            rules={[
              { required: true, message: "Please enter a follow-up comment!" },
            ]}
          >
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item
            name="followupDate"
            label="Follow-up Date"
            rules={[
              { required: true, message: "Please select a follow-up date!" },
            ]}
          >
            <DatePicker style={{ width: "100%" }} format="DD-MM-YYYY" />
          </Form.Item>
          <Form.Item
            name="status"
            label="Follow-up Status"
            rules={[
              { required: true, message: "Please select a follow-up status!" },
            ]}
          >
            <Select>
              <Option value="pending">Pending</Option>
              <Option value="completed">Closed</Option>

            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Calendar Selection Modal */}
       <Modal
        title={`Select Month for Account Status (${selectedMonth.format('MMMM YYYY')})`}
        open={isCalendarModalVisible}
        onCancel={() => setIsCalendarModalVisible(false)}
        footer={null}
      >
        <Calendar
          value={selectedMonth}
          onSelect={handleCalendarSelect}
          mode="month"
          style={{ width: '100%', height: 'auto' }}

          onPanelChange={(value, mode) => {
            if (mode === 'month') {
                setSelectedMonth(value);
            }
          }}
        />
      </Modal>
    </div>
  );
};

export default Dashboard;