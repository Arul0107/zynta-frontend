// File: src/components/leads/LeadsFilter.jsx

import React from "react";
import { Input, Select, Space, Button } from "antd";
import { SearchOutlined, FilterOutlined } from "@ant-design/icons";

const { Option } = Select;

const LeadsFilter = ({
    searchText,
    onSearchChange,
    selectedZone,
    onZoneChange,
    zones,
    loadingZones,
    onApplyFilters,
    onResetFilters
}) => {
    return (
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <Input
                placeholder="Search by business or contact name"
                prefix={<SearchOutlined />}
                style={{ width: 300 }}
                value={searchText}
                onChange={onSearchChange}
                onPressEnter={onApplyFilters}
            />
            <Space>
                <Select
                    placeholder="Filter by Zone"
                    style={{ width: 200 }}
                    value={selectedZone}
                    onChange={onZoneChange}
                    loading={loadingZones}
                    allowClear
                >
                    {zones.map(zone => (
                        <Option key={zone._id} value={zone._id}>{zone.name}</Option>
                    ))}
                </Select>
                <Button 
                    type="primary" 
                    icon={<FilterOutlined />} 
                    onClick={onApplyFilters}
                    style={{ backgroundColor: "#0E2B43", borderColor: "#orange", color: "white" }}
                >
                    Apply Filters
                </Button>
                <Button onClick={onResetFilters}>
                    Reset
                </Button>
            </Space>
        </Space>
    );
};

export default LeadsFilter;