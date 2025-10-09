// src/components/CombinedManagement.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { Tabs, Spin } from 'antd';
import UserManagement from './UserManagement';
import DepartmentManagement from './DepartmentManagement';
import TeamManagement from './TeamManagement';
import axios from '../../api/axios';
import toast from 'react-hot-toast';

const { TabPane } = Tabs;

const CombinedManagement = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentUser = JSON.parse(localStorage.getItem('user'));
  const isSuperadmin = currentUser?.role === 'Superadmin';
  const isAdmin = currentUser?.role === 'Admin';
  const isTeamLeader = currentUser?.role === 'Team Leader';

  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get('/api/users');
      setUsers(res.data);
    } catch {
      toast.error('Failed to load users');
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await axios.get('/api/departments');
      setDepartments(res.data);
    } catch {
      toast.error('Failed to load departments');
    } 
  }, []);

  const fetchTeams = useCallback(async () => {
    try {
      const res = await axios.get('/api/teams');
      setTeams(res.data);
    } catch {
      toast.error('Failed to load teams');
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchUsers(),
        fetchDepartments(),
        fetchTeams()
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchUsers, fetchDepartments, fetchTeams]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Management Dashboard</h1>
      <Tabs defaultActiveKey="users" type="card">
        <TabPane tab="User Management" key="users">
          <UserManagement
            users={users}
            departments={departments}
            teams={teams}
            fetchUsers={fetchUsers}
            fetchDepartments={fetchDepartments}
            fetchTeams={fetchTeams}
          />
        </TabPane>

        {(isSuperadmin || isAdmin) && (
          <TabPane tab="Department Management" key="departments">
            <DepartmentManagement
              departments={departments}
              fetchDepartments={fetchDepartments}
              fetchTeams={fetchTeams}
              fetchUsers={fetchUsers}
            />
          </TabPane>
        )}

        {(isSuperadmin || isAdmin) && (
          <TabPane tab="Team Management" key="teams">
            <TeamManagement
              teams={teams}
              departments={departments}
              allUsers={users}
              fetchTeams={fetchTeams}
              fetchDepartments={fetchDepartments}
              fetchUsers={fetchUsers}
            />
          </TabPane>
        )}
      </Tabs>
    </div>
  );
};

export default CombinedManagement;
