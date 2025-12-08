// Scheduler.jsx (Advanced UI)
import React, { useState, useRef, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import dayjs from "dayjs";
import axios from "../../api/axios";

import {
    Drawer,
    Button,
    Form,
    Input,
    TimePicker,
    DatePicker,
    Space,
    Popconfirm,
    message,
    Select,
    Tag,
    Row,
    Col,
} from "antd";

import "./Scheduler.css"; // Ensure this file exists for the new styles

// ------------------------------------------------------------------
// CONSTANTS & HELPERS
// ------------------------------------------------------------------
const { Option } = Select;

const typeColors = {
    meeting: "#1677ff",
    birthday: "#ff4d4f",
    task: "#13c2c2",
    reminder: "#722ed1",
};

const priorityTags = {
    low: { color: "green", label: "Low" },
    medium: { color: "gold", label: "Medium" },
    high: { color: "red", label: "High" },
};

const combineDateTime = (date, time) => {
    if (!date || !time) return null;
    return date.hour(time.hour()).minute(time.minute()).second(0).toDate();
};

// ------------------------------------------------------------------
// EVENT FORM COMPONENT
// ------------------------------------------------------------------
const EventForm = ({ form, accountOptions, serviceOptions, selectedEvent, handleSave, handleDelete }) => {
    const isNew = selectedEvent?.isNew;

    return (
        <Form layout="vertical" form={form}>
            <Row gutter={16}>
                <Col span={24}>
                    <Form.Item name="title" label="Title" rules={[{ required: true, message: "Title is required" }]}>
                        <Input placeholder="Event title" />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item name="type" label="Type" rules={[{ required: true, message: "Type is required" }]}>
                        <Select
                            onChange={(v) => form.setFieldValue("color", typeColors[v])}
                            placeholder="Select Type"
                        >
                            <Option value="meeting">Meeting</Option>
                            <Option value="birthday">Birthday</Option>
                            <Option value="task">Task</Option>
                            <Option value="reminder">Reminder</Option>
                        </Select>
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="priority" label="Priority" rules={[{ required: true, message: "Priority is required" }]}>
                        <Select placeholder="Select Priority">
                            <Option value="low">Low</Option>
                            <Option value="medium">Medium</Option>
                            <Option value="high">High</Option>
                        </Select>
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item name="accountId" label="Account">
                        <Select placeholder="Select Account" options={accountOptions} allowClear />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="serviceId" label="Service">
                        <Select placeholder="Select Service" options={serviceOptions} allowClear />
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item name="description" label="Description">
                <Input.TextArea rows={3} placeholder="Event details..." />
            </Form.Item>

            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item
                        name="startDate"
                        label="Start Date"
                        rules={[{ required: true, message: "Start date required" }]}
                    >
                        <DatePicker style={{ width: "100%" }} />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        name="startTime"
                        label="Start Time"
                        rules={[{ required: true, message: "Start time required" }]}
                    >
                        <TimePicker format="HH:mm" style={{ width: "100%" }} />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item
                        name="endDate"
                        label="End Date"
                        rules={[{ required: true, message: "End date required" }]}
                    >
                        <DatePicker style={{ width: "100%" }} />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        name="endTime"
                        label="End Time"
                        rules={[{ required: true, message: "End time required" }]}
                    >
                        <TimePicker format="HH:mm" style={{ width: "100%" }} />
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item name="color" label="Color Preview">
                <Input type="color" className="color-preview-input" />
                <div className="ant-form-text">Selected color will be used for the event.</div>
            </Form.Item>

            <div className="drawer-footer-actions">
                <Space>
                    <Button type="primary" onClick={handleSave}>
                        {isNew ? "Create Event" : "Update Event"}
                    </Button>

                    {!isNew && (
                        <Popconfirm title="Delete this event permanently?" onConfirm={() => handleDelete(selectedEvent.id)}>
                            <Button danger>Delete</Button>
                        </Popconfirm>
                    )}

                    <Button onClick={() => form.resetFields()}>Reset</Button>
                </Space>
            </div>
        </Form>
    );
};

// ------------------------------------------------------------------
// SCHEDULER COMPONENT
// ------------------------------------------------------------------
const Scheduler = () => {
    const [events, setEvents] = useState([]);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);

    const [viewMode, setViewMode] = useState("week");
    const [calendarDate, setCalendarDate] = useState(dayjs());

    const [yearDetail, setYearDetail] = useState(null);
    const [yearDrawerOpen, setYearDrawerOpen] = useState(false);

    const [accountOptions, setAccountOptions] = useState([]);
    const [serviceOptions, setServiceOptions] = useState([]);

    const calendarRef = useRef(null);
    const [form] = Form.useForm();

    // ------------------------------------------------------------------
    // FETCH ACCOUNTS + SERVICES + EVENTS
    // ------------------------------------------------------------------
    useEffect(() => {
        fetchEvents();
        fetchAccounts();
        fetchServices();
    }, []);

    const fetchAccounts = useCallback(async () => {
        try {
            const res = await axios.get("/api/accounts");
            const accountsData = res.data.accounts || res.data;

            setAccountOptions(
                accountsData.map((acc) => ({
                    label: acc.businessName,
                    value: acc._id,
                    // Store the full name for event rendering
                    name: acc.businessName,
                }))
            );
        } catch (err) {
            console.error(err);
            message.error("Failed to load account options.");
        }
    }, []);

    const fetchServices = useCallback(async () => {
        try {
            const res = await axios.get("/api/service");
            const servicesData = res.data.services || res.data;

            setServiceOptions(
                servicesData.map((s) => ({
                    label: s.title || s.serviceName,
                    value: s._id,
                    // Store the full name for event rendering
                    name: s.title || s.serviceName,
                }))
            );
        } catch (err) {
            console.error(err);
            message.error("Failed to load service options.");
        }
    }, []);

    const fetchEvents = useCallback(async () => {
        try {
            const res = await axios.get("/api/events");

            setEvents(
                res.data.events.map((e) => ({
                    ...e,
                    id: e._id,
                    title: e.title,
                    start: e.start,
                    end: e.end,
                    backgroundColor: e.color,
                    borderColor: e.color,
                    accountId: e.accountId?._id || e.accountId || null,
                    serviceId: e.serviceId?._id || e.serviceId || null,
                    // Store the *populated* objects/values for custom event rendering
                    account: e.accountId,
                    service: e.serviceId,
                }))
            );
        } catch (err) {
            console.error(err);
            message.error("Failed to load events");
        }
    }, []);

    // ------------------------------------------------------------------
    // EVENT HANDLERS
    // ------------------------------------------------------------------

    const closeDrawer = () => {
        setDrawerOpen(false);
        setSelectedEvent(null);
        form.resetFields();
    };

    const handleSelect = (info) => {
        const { start, end } = info;
        const initialType = "task";

        setSelectedEvent({ id: `evt-${Date.now()}`, start, end, isNew: true });

        form.setFieldsValue({
            title: "",
            description: "",
            type: initialType,
            priority: "medium",
            color: typeColors[initialType],
            accountId: null,
            serviceId: null,
            startDate: dayjs(start),
            startTime: dayjs(start),
            endDate: dayjs(end),
            endTime: dayjs(end),
        });

        setDrawerOpen(true);
    };

    const handleEventClick = (info) => {
        const e = info.event.extendedProps;

        const selected = {
            id: info.event.id,
            title: info.event.title,
            description: e.description,
            type: e.type,
            priority: e.priority,
            color: e.color,
            start: info.event.start,
            end: info.event.end,
            accountId: e.accountId || null,
            serviceId: e.serviceId || null,
            isNew: false,
        };

        setSelectedEvent(selected);

        form.setFieldsValue({
            title: selected.title,
            description: selected.description,
            type: selected.type,
            priority: selected.priority,
            color: selected.color,
            accountId: selected.accountId,
            serviceId: selected.serviceId,
            startDate: dayjs(selected.start),
            startTime: dayjs(selected.start),
            endDate: dayjs(selected.end),
            endTime: dayjs(selected.end),
        });

        setDrawerOpen(true);
    };

    const handleEventChange = async (change) => {
        try {
            const e = change.event;

            await axios.put(`/api/events/${e.id}`, {
                start: e.start,
                end: e.end,
            });

            // Update state: Keep the rest of the object data (e.g., account, service) intact
            setEvents((prev) =>
                prev.map((p) =>
                    p.id === e.id ? { ...p, start: e.start, end: e.end } : p
                )
            );

            message.success("Event time updated");
        } catch (err) {
            console.error(err);
            message.error("Update failed");
        }
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();

            const start = combineDateTime(values.startDate, values.startTime);
            const end = combineDateTime(values.endDate, values.endTime);

            if (!start || !end) return message.error("Invalid timing");
            if (dayjs(start).isAfter(dayjs(end)))
                return message.error("End must be after start");

            // Get account/service name for UI update without a re-fetch
            const selectedAccount = accountOptions.find(opt => opt.value === values.accountId);
            const selectedService = serviceOptions.find(opt => opt.value === values.serviceId);

            const data = {
                title: values.title,
                description: values.description,
                type: values.type,
                priority: values.priority,
                color: values.color,
                start,
                end,
                accountId: values.accountId || null,
                serviceId: values.serviceId || null,
            };

            let savedEvent;

            if (selectedEvent?.isNew) {
                const res = await axios.post("/api/events", data);
                savedEvent = res.data.event;
            } else {
                const res = await axios.put(`/api/events/${selectedEvent.id}`, data);
                savedEvent = res.data.event;
            }

            setEvents((prev) => {
                const extractId = (field) => field?._id || field || null;

                const newEventState = {
                    ...savedEvent,
                    id: savedEvent._id,
                    backgroundColor: savedEvent.color,
                    borderColor: savedEvent.color,
                    accountId: extractId(savedEvent.accountId),
                    serviceId: extractId(savedEvent.serviceId),
                    // Populate the display name directly in the event state for the UI
                    account: selectedAccount ? { _id: values.accountId, businessName: selectedAccount.name } : null,
                    service: selectedService ? { _id: values.serviceId, title: selectedService.name } : null,
                };

                if (selectedEvent?.isNew) {
                    return [...prev, newEventState];
                } else {
                    return prev.map((p) =>
                        p._id === savedEvent._id ? newEventState : p
                    );
                }
            });

            closeDrawer();
            message.success(`Event ${selectedEvent?.isNew ? "created" : "updated"}!`);
        } catch (err) {
            console.error(err);
            message.error("Save failed. Please check your inputs.");
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`/api/events/${id}`);
            setEvents((prev) => prev.filter((e) => e._id !== id));
            closeDrawer();
            message.success("Event deleted");
        } catch (err) {
            message.error("Delete failed");
        }
    };

    // ------------------------------------------------------------------
    // CUSTOM RENDER FUNCTIONS
    // ------------------------------------------------------------------

    const renderEventContent = (eventInfo) => {
        const e = eventInfo.event.extendedProps;
        const { color: priorityColor, label: priorityLabel } = priorityTags[e.priority] || {};
        const eventTime = eventInfo.view.type.includes("timeGrid")
            ? dayjs(eventInfo.event.start).format("h:mm a")
            : null;

        // Determine the display name for account and service for better context
        const accountName = e.account?.businessName || accountOptions.find(o => o.value === e.accountId)?.name;
        const serviceName = e.service?.title || e.service?.serviceName || serviceOptions.find(o => o.value === e.serviceId)?.name;

        return (
            <div className="custom-event-content">
                {eventTime && <div className="event-time">{eventTime}</div>}
                <div className="event-title-wrap">
                    <div className="event-title">{eventInfo.event.title}</div>
                    <Tag color={priorityColor} className="event-priority-tag">{priorityLabel}</Tag>
                </div>
                <div className="event-meta">
                    {accountName && <Tag color="#009688" size="small" bordered={false}>{accountName}</Tag>}
                    {serviceName && <Tag color="#757575" size="small" bordered={false}>{serviceName}</Tag>}
                </div>
            </div>
        );
    };

    const renderHeaderToolbar = () => (
        <div className="advanced-toolbar">
            <div className="view-mode-buttons">
                <Button
                    type={viewMode === "day" ? "primary" : "default"}
                    onClick={() => handleCustomViewChange("day")}
                >
                    Day
                </Button>
                <Button
                    type={viewMode === "week" ? "primary" : "default"}
                    onClick={() => handleCustomViewChange("week")}
                >
                    Week
                </Button>
                <Button
                    type={viewMode === "month" ? "primary" : "default"}
                    onClick={() => handleCustomViewChange("month")}
                >
                    Month
                </Button>
                <Button
                    type={viewMode === "year" ? "primary" : "default"}
                    onClick={() => handleCustomViewChange("year")}
                >
                    Year
                </Button>
            </div>
            <Button type="primary" onClick={() => handleSelect({ start: new Date(), end: new Date() })} className="add-event-button">
                + Add Event
            </Button>
        </div>
    );

    const handleMonthClick = (m) => {
        const monthlyEvents = events.filter((e) =>
            dayjs(e.start).isSame(m.date, "month")
        ).map(e => ({
            ...e,
            id: e._id,
        })); // Ensure ID is mapped for clicking

        setYearDetail({
            month: m.name,
            events: monthlyEvents,
        });
        setYearDrawerOpen(true);
    };

    const renderYearView = () => {
        const yr = calendarDate.year();

        const months = Array.from({ length: 12 }, (_, i) => {
            const mDate = dayjs().year(yr).month(i).startOf("month");
            const monthlyEvents = events.filter((e) =>
                dayjs(e.start).isSame(mDate, "month")
            );

            return {
                name: mDate.format("MMMM"),
                date: mDate,
                count: monthlyEvents.length,
                sample: monthlyEvents.slice(0, 3),
            };
        });

        return (
            <div className="year-grid">
                {months.map((m, i) => (
                    <div
                        key={i}
                        className="year-month-card"
                        onClick={() => handleMonthClick(m)}
                    >
                        <h3 className="month-title">{m.name}</h3>
                        <p className="month-count-badge">
                            <Tag color={m.count > 0 ? "blue" : "default"}>{m.count} events</Tag>
                        </p>

                        {m.sample.length > 0 && (
                            <ul className="month-preview">
                                {m.sample.map((e) => (
                                    <li key={e.id}>
                                        <span style={{ color: e.color || '#333' }}>●</span> {dayjs(e.start).format("DD")} — {e.title}
                                    </li>
                                ))}
                            </ul>
                        )}
                        {m.count > m.sample.length && <p className="more-events">...and {m.count - m.sample.length} more</p>}
                    </div>
                ))}
            </div>
        );
    };

    const renderYearSelector = () => {
        const currentYear = calendarDate.year();

        const years = [
            currentYear - 2,
            currentYear - 1,
            currentYear,
            currentYear + 1,
            currentYear + 2,
        ];

        const changeYear = (yr) => {
            const newDate = dayjs().year(yr).startOf("year");
            setCalendarDate(newDate);
            setViewMode("year");
        };

        return (
            <div className="year-selector">
                <Button type="text" onClick={() => changeYear(currentYear - 1)}>
                    <span className="arrow-button">← Prev</span>
                </Button>

                <div className="year-list">
                    {years.map((y) => (
                        <div
                            key={y}
                            className={`year-item ${y === currentYear ? "active-year" : ""}`}
                            onClick={() => changeYear(y)}
                        >
                            {y}
                        </div>
                    ))}
                </div>

                <Button type="text" onClick={() => changeYear(currentYear + 1)}>
                    <span className="arrow-button">Next →</span>
                </Button>
            </div>
        );
    };

    const handleCustomViewChange = (mode, newDate = null) => {
        const api = calendarRef.current?.getApi();
        if (!api) return;

        let target = newDate ? newDate : dayjs();

        if (mode === "year") {
            setCalendarDate(dayjs().startOf("year"));
            setViewMode("year");
            return;
        }

        if (mode === "day") target = dayjs();
        if (mode === "week") target = dayjs().startOf("week");
        if (mode === "month") target = dayjs().startOf("month");


        setViewMode(mode);
        setCalendarDate(target);

        const map = {
            day: "timeGridDay",
            week: "timeGridWeek",
            month: "dayGridMonth",
        };

        api.changeView(map[mode], target.toDate());
    };

    const handleDatesSet = (info) => {
        // Only update calendarDate if not in 'year' view
        if (viewMode !== 'year') {
            setCalendarDate(dayjs(info.start));
        }
    };


    // ------------------------------------------------------------------
    // RENDER JSX
    // ------------------------------------------------------------------
    return (
        <div className="scheduler-full-container">
            {renderHeaderToolbar()}
            <div className="calendar-main-content">
                {/* YEAR VIEW */}
                {viewMode === "year" && (
                    <div className="year-view-container">
                        {renderYearSelector()}
                        {renderYearView()}
                    </div>
                )}

                {/* DAY / WEEK / MONTH */}
                {viewMode !== "year" && (
                    <FullCalendar
                        ref={calendarRef}
                        plugins={[timeGridPlugin, interactionPlugin, dayGridPlugin]}
                        initialView="timeGridWeek"
                        selectable
                        editable
                        nowIndicator
                        select={handleSelect}
                        eventClick={handleEventClick}
                        eventDrop={handleEventChange}
                        eventResize={handleEventChange}
                        events={events}
                        datesSet={handleDatesSet}
                        eventContent={renderEventContent} // NEW: Custom event content
                        headerToolbar={{
                            left: "prev,next today",
                            center: "title",
                            right: "", // Removed default buttons, using custom toolbar above
                        }}
                        slotMinTime="06:00:00"
                        slotMaxTime="23:00:00"
                        allDaySlot={false}
                        height="auto"
                    />
                )}
            </div>

            {/* DRAWER: ADD / EDIT */}
            <Drawer
                title={selectedEvent?.isNew ? "✨ Schedule New Event" : `✏️ Edit Event: ${selectedEvent?.title}`}
                width={500}
                open={drawerOpen}
                onClose={closeDrawer}
                destroyOnClose={true} // Important for resetting form state
                className="event-form-drawer"
            >
                {selectedEvent && (
                    <EventForm
                        form={form}
                        accountOptions={accountOptions}
                        serviceOptions={serviceOptions}
                        selectedEvent={selectedEvent}
                        handleSave={handleSave}
                        handleDelete={handleDelete}
                    />
                )}
            </Drawer>

            {/* YEAR-MONTH DETAIL DRAWER */}
            <Drawer
                title={`📅 ${yearDetail?.month} — Events`}
                width={420}
                open={yearDrawerOpen}
                onClose={() => setYearDrawerOpen(false)}
                className="year-detail-drawer"
            >
                {yearDetail && (
                    <>
                        <h3>{yearDetail.events.length} events this month</h3>

                        <ul className="month-event-list">
                            {yearDetail.events.map((evt) => (
                                <li key={evt.id} className="month-event-item" onClick={() => handleEventClick({ event: { id: evt.id, title: evt.title, start: evt.start, end: evt.end, extendedProps: evt }})}>
                                    <Tag color={evt.color || typeColors[evt.type] || '#ccc'} className="event-color-dot" />
                                    <div className="event-details">
                                        <strong>{dayjs(evt.start).format("DD MMM, HH:mm")}</strong>
                                        <br />
                                        <span className="event-list-title">{evt.title}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </Drawer>
        </div>
    );
};

export default Scheduler; 