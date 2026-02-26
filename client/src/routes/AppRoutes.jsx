import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Loader from '../components/common/Loader';
import PrivateRoute from './PrivateRoute';
import RoleBasedRoute from './RoleBasedRoute';
import ProtectedLayout from '../components/layout/ProtectedLayout';

// Lazy load pages
const Login = lazy(() => import('../pages/auth/Login.jsx'));
const Register = lazy(() => import('../pages/auth/Register.jsx'));
const NotFound = lazy(() => import('../pages/common/NotFound'));
const Unauthorized = lazy(() => import('../pages/common/Unauthorized'));

// Employee Pages
const EmployeeDashboard = lazy(() => import('../pages/employee/EmployeeDashboard.jsx'));
const ApplyLeave = lazy(() => import('../pages/employee/ApplyLeave.jsx'));
const LeaveHistory = lazy(() => import('../pages/employee/LeaveHistory'));
const ReimbursementPage = lazy(() => import('../pages/employee/ReimbursementPage.jsx'));

// Manager Pages
const ManagerDashboard = lazy(() => import('../pages/manager/ManagerDashboard.jsx'));
const LeaveRequests = lazy(() => import('../pages/manager/LeaveRequests.jsx'));
const TeamView = lazy(() => import('../pages/manager/TeamView'));
const ReimbursementApprovals = lazy(() => import('../pages/manager/ReimbursementApprovals.jsx'));

// Admin Pages
const AdminPanel = lazy(() => import('../pages/admin/AdminPanel.jsx'));
const UserManagement = lazy(() => import('../pages/admin/UserManagement.jsx'));
const Reports = lazy(() => import('../pages/admin/Reports.jsx'));
const AllReimbursements = lazy(() => import('../pages/admin/AllReimbursements.jsx'));

const AppRoutes = () => {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected Routes with Layout */}
        <Route path="/" element={<PrivateRoute><ProtectedLayout /></PrivateRoute>}>
          {/* Employee Routes */}
          <Route path="employee" element={
            <RoleBasedRoute allowedRoles={['employee']}>
              <EmployeeDashboard />
            </RoleBasedRoute>
          } />
          <Route path="employee/apply-leave" element={
            <RoleBasedRoute allowedRoles={['employee', 'manager']}>
              <ApplyLeave />
            </RoleBasedRoute>
          } />
          <Route path="employee/leave-history" element={
            <RoleBasedRoute allowedRoles={['employee', 'manager']}>
              <LeaveHistory />
            </RoleBasedRoute>
          } />
          <Route path="employee/reimbursements" element={
            <RoleBasedRoute allowedRoles={['employee']}>
              <ReimbursementPage />
            </RoleBasedRoute>
          } />

          {/* Manager Routes */}
          <Route path="manager" element={
            <RoleBasedRoute allowedRoles={['manager']}>
              <ManagerDashboard />
            </RoleBasedRoute>
          } />
          <Route path="manager/leave-requests" element={
            <RoleBasedRoute allowedRoles={['manager']}>
              <LeaveRequests />
            </RoleBasedRoute>
          } />
          <Route path="manager/team" element={
            <RoleBasedRoute allowedRoles={['manager']}>
              <TeamView />
            </RoleBasedRoute>
          } />
          <Route path="manager/reimbursements" element={
            <RoleBasedRoute allowedRoles={['manager']}>
              <ReimbursementApprovals />
            </RoleBasedRoute>
          } />

          {/* Admin Routes */}
          <Route path="admin" element={
            <RoleBasedRoute allowedRoles={['admin']}>
              <AdminPanel />
            </RoleBasedRoute>
          } />
          <Route path="admin/users" element={
            <RoleBasedRoute allowedRoles={['admin']}>
              <UserManagement />
            </RoleBasedRoute>
          } />
          <Route path="admin/reports" element={
            <RoleBasedRoute allowedRoles={['admin']}>
              <Reports />
            </RoleBasedRoute>
          } />
          <Route path="admin/reimbursements" element={
            <RoleBasedRoute allowedRoles={['admin']}>
              <AllReimbursements />
            </RoleBasedRoute>
          } />
        </Route>

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;