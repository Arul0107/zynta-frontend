import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  Select,
  DatePicker,
  Typography,
  Row,
  Col,
  Statistic,
  message,
  Tag,
  Empty,
  Button, // <-- Added Button
} from "antd";
import { DownloadOutlined } from '@ant-design/icons'; // <-- Added Icon
import dayjs from "dayjs";
import api from "../../api/axios";

// 1. IMPORT EXCEL LIBRARIES
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const { Title, Text } = Typography;

export default function AdminAttendance() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [month, setMonth] = useState(dayjs()); // Initialize with current month

  // Load all users
  const getUsers = async () => {
    try {
      const res = await api.get("/api/users");
      setUsers(res.data || []);
    } catch {
      message.error("Failed to load users");
    }
  };

  // Load attendance for user
  const loadAttendance = async () => {
    if (!selectedUser || !month) return;

    try {
      const year = month.year();
      const m = month.month() + 1;

      const res = await api.get(
        `/api/work-sessions/attendance?userId=${selectedUser}&year=${year}&month=${m}`
      );

      setAttendance(res.data || null);
    } catch {
      message.error("Failed to load attendance");
    }
  };

  useEffect(() => {
    getUsers();
  }, []);

  useEffect(() => {
    loadAttendance();
    // eslint-disable-next-line
  }, [selectedUser, month]);

  // --- Date Calculations (Safe fallback included) ---
  const currentMonth = month || dayjs();
  const yearVal = currentMonth.year();
  const monthVal = currentMonth.month() + 1;
  const monthName = currentMonth.format("MMMM YYYY");
  const totalCalendarDays = currentMonth.daysInMonth();

  const presentDates = attendance?.presentDates || [];
  const leaveDetails = attendance?.leaveDetails || [];
  const leaveDatesPlain = attendance?.leaveDates || [];
  const absentDates = attendance?.absentDates || [];

  const leaveTypeByDate = {};
  leaveDetails.forEach((ld) => {
    if (ld?.date) leaveTypeByDate[ld.date] = ld.type || "Leave";
  });

  const dataSource =
    attendance &&
    Array.from({ length: totalCalendarDays }, (_, i) => {
      const dateDayjs = dayjs(`${yearVal}-${monthVal}-${i + 1}`);
      const date = dateDayjs.format("YYYY-MM-DD");

      let status = "Absent";
      const isSunday = dateDayjs.day() === 0; // 0 = Sunday

      if (isSunday) {
        status = "Non-Working Day (Sunday)";
      } else if (presentDates.includes(date)) {
        status = "Present";
      } else if (leaveTypeByDate[date]) {
        status = `${leaveTypeByDate[date]} Leave`;
      } else if (leaveDatesPlain.includes(date)) {
        status = "Leave";
      }

      return {
        key: i,
        date,
        status,
        isSunday,
      };
    }).filter(item => item.dateDayjs?.isValid() !== false);


  const columns = [
    { title: "Date", dataIndex: "date" },
    {
      title: "Day",
      dataIndex: "date",
      render: (date) => dayjs(date).format("ddd"),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => {
        const isPresent = status.includes("Present");
        const isLeave = status.includes("Leave");
        const isSunday = status.includes("Sunday");

        let color = "red";
        if (isPresent) color = "green";
        else if (isLeave) color = "blue";
        else if (isSunday) color = "default";

        return <Tag color={color}>{status}</Tag>;
      },
    },
  ];

  // --- 2. EXPORT FUNCTION ---
  const handleExportExcel = () => {
    if (!dataSource || dataSource.length === 0) {
      return message.warning("No attendance data to export.");
    }
    
    // Find the selected user's name for the filename
    const userName = users.find(u => u._id === selectedUser)?.name || "Employee";

    // 2a. Map the data to the desired Excel format (excluding the key and isSunday fields)
    const dataToExport = dataSource.map(item => ({
      Date: item.date,
      Day: dayjs(item.date).format("ddd"),
      Status: item.status,
    }));

    // 2b. Create a new workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

    // 2c. Write the workbook and trigger download
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    
    const filename = `${userName}_Attendance_${monthName.replace(' ', '_')}.xlsx`;
    saveAs(data, filename);

    message.success(`Exported attendance for ${userName}`);
  };

  // --- Rest of your component logic for rendering...
  const renderDateTags = (dates, color) =>
    dates && dates.length > 0 ? (
      dates.map((d) => (
        <Tag key={d} color={color} style={{ marginBottom: 6 }}>
          {dayjs(d).format("DD MMM")}
        </Tag>
      ))
    ) : (
      <Text type="secondary">No records</Text>
    );

  const groupedLeaveByType = leaveDetails.reduce((acc, ld) => {
    if (!ld?.type || !ld?.date) return acc;
    if (!acc[ld.type]) acc[ld.type] = [];
    acc[ld.type].push(ld.date);
    return acc;
  }, {});
  
  const workingDaysSource = dataSource ? dataSource.filter(d => !d.isSunday) : [];
  const totalWorkingDaysInMonth = workingDaysSource.length;
  const daysPresent = workingDaysSource.filter(d => d.status.includes("Present")).length;
  const daysOnLeave = workingDaysSource.filter(d => d.status.includes("Leave")).length;
  const daysAbsent = workingDaysSource.filter(d => d.status.includes("Absent")).length;


  return (
    <div style={{ padding: 20 }}>
      <Title level={3}>Attendance Dashboard</Title>

      <Row gutter={16} style={{ marginBottom: 20, alignItems: 'center' }}>
        <Col span={8}>
          <Select
            placeholder="Select Employee"
            style={{ width: "100%" }}
            onChange={(v) => setSelectedUser(v)}
            options={users.map((u) => ({
              label: u.name,
              value: u._id,
            }))}
            value={selectedUser}
          />
        </Col>

        <Col span={8}>
          <DatePicker.MonthPicker
            value={month}
            onChange={(date) => setMonth(date || dayjs())}
            style={{ width: "100%" }}
          />
        </Col>
        
        {/* 3. EXPORT BUTTON */}
        <Col span={8} style={{ textAlign: 'right' }}>
          <Button 
            type="primary"  className="add-event-button"    
            icon={<DownloadOutlined />} 
            onClick={handleExportExcel}
            disabled={!attendance} // Disable if no data is loaded
          >
            Export to Excel
          </Button>
        </Col>
      </Row>

      {selectedUser && attendance ? (
        <>
          {/* Summary Cards */}
          <Row gutter={16} style={{ marginBottom: 20 }}>
            {/* ... Summary Card content remains the same ... */}
            <Col span={6}><Card><Statistic title="Total Working Days" value={totalWorkingDaysInMonth} /></Card></Col>
            <Col span={6}><Card><Statistic title="Present" value={daysPresent} valueStyle={{ color: "green" }} /></Card></Col>
            <Col span={6}><Card><Statistic title="Leave" value={daysOnLeave} valueStyle={{ color: "blue" }} /></Card></Col>
            <Col span={6}><Card><Statistic title="Absent" value={daysAbsent} valueStyle={{ color: "red" }} /></Card></Col>
          </Row>

          {/* Detail cards: Present / Leave / Absent day lists */}
          <Row gutter={16} style={{ marginBottom: 20 }}>
            {/* ... Detail Card content remains the same ... */}
            <Col xs={24} md={8}>
              <Card title="Present Days">
                {renderDateTags(presentDates, "green")}
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card title="Leave Days (by type)">
                {leaveDetails.length > 0 ? (
                  Object.entries(groupedLeaveByType).map(([type, dates]) => (
                    <div key={type} style={{ marginBottom: 8 }}>
                      <Text strong>{type}:</Text>
                      <div style={{ marginTop: 4 }}>
                        {renderDateTags(dates, "blue")}
                      </div>
                    </div>
                  ))
                ) : leaveDatesPlain.length > 0 ? (
                  renderDateTags(leaveDatesPlain, "blue")
                ) : (
                  <Text type="secondary">No leave taken</Text>
                )}
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card title="Absent Days (Excl. Sun)">
                {absentDates && absentDates.length > 0 ? (
                  renderDateTags(absentDates.filter(d => dayjs(d).day() !== 0), "red")
                ) : (
                  <Text type="secondary">No absents 🎉</Text>
                )}
              </Card>
            </Col>
          </Row>

          {/* Table */}
          <Card title={`Daily Attendance - ${monthName}`}>
            <Table
              columns={columns}
              dataSource={dataSource}
              pagination={false}
              locale={{ emptyText: <Empty description="No attendance found" /> }}
            />
          </Card>
        </>
      ) : (
        <Empty description="Select employee & month to view attendance" />
      )}
    </div>
  );
}