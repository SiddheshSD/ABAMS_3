import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Departments from './pages/Departments';
import Classes from './pages/Classes';
import Rooms from './pages/Rooms';
import TimeSlots from './pages/TimeSlots';
import Timetable from './pages/Timetable';
import Subjects from './pages/Subjects';
import PlaceholderDashboard from './pages/PlaceholderDashboard';

// HOD Pages
import HodDashboard from './pages/hod/HodDashboard';
import HodAttendance from './pages/hod/HodAttendance';
import HodStudents from './pages/hod/HodStudents';
import HodTeachers from './pages/hod/HodTeachers';
import HodClasses from './pages/hod/HodClasses';
import HodTimetable from './pages/hod/HodTimetable';
import HodLeaveRequests from './pages/hod/HodLeaveRequests';
import HodComplaints from './pages/hod/HodComplaints';

import './index.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  return children;
};

// Admin Only Route
const AdminRoute = ({ children }) => {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return <PlaceholderDashboard />;
  }

  return children;
};

// HOD Only Route
const HodRoute = ({ children }) => {
  const { user } = useAuth();

  if (user?.role !== 'hod') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Smart Dashboard - redirects based on role
const SmartDashboard = () => {
  const { user } = useAuth();

  if (user?.role === 'hod') {
    return <Navigate to="/hod/dashboard" replace />;
  }

  return <Dashboard />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/change-password" element={<ChangePassword />} />

          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<SmartDashboard />} />

            {/* Admin Routes */}
            <Route path="users" element={<AdminRoute><Users /></AdminRoute>} />
            <Route path="departments" element={<AdminRoute><Departments /></AdminRoute>} />
            <Route path="classes" element={<AdminRoute><Classes /></AdminRoute>} />
            <Route path="rooms" element={<AdminRoute><Rooms /></AdminRoute>} />
            <Route path="timeslots" element={<AdminRoute><TimeSlots /></AdminRoute>} />
            <Route path="timetable" element={<AdminRoute><Timetable /></AdminRoute>} />
            <Route path="subjects" element={<AdminRoute><Subjects /></AdminRoute>} />

            {/* HOD Routes */}
            <Route path="hod/dashboard" element={<HodRoute><HodDashboard /></HodRoute>} />
            <Route path="hod/attendance" element={<HodRoute><HodAttendance /></HodRoute>} />
            <Route path="hod/students" element={<HodRoute><HodStudents /></HodRoute>} />
            <Route path="hod/teachers" element={<HodRoute><HodTeachers /></HodRoute>} />
            <Route path="hod/classes" element={<HodRoute><HodClasses /></HodRoute>} />
            <Route path="hod/timetable" element={<HodRoute><HodTimetable /></HodRoute>} />
            <Route path="hod/leave-requests" element={<HodRoute><HodLeaveRequests /></HodRoute>} />
            <Route path="hod/complaints" element={<HodRoute><HodComplaints /></HodRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
