import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

const Layout = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();

    const getPageTitle = () => {
        const path = location.pathname;

        // Exact match titles
        const exactTitles = {
            '/dashboard': 'Dashboard',
            '/users': 'User Management',
            '/departments': 'Departments',
            '/classes': 'Classes',
            '/timetable': 'Timetable',
            '/rooms': 'Classrooms & Labs',
            '/timeslots': 'Time Slots',
            '/students': 'Students',
            '/teachers': 'Teachers',
            '/lectures': 'Lectures',
            '/subjects': 'Subjects',
            '/test-types': 'Test Types',
            '/profile': 'Profile',
            // HOD titles
            '/hod/dashboard': 'HOD Dashboard',
            '/hod/attendance': 'Attendance',
            '/hod/students': 'Students',
            '/hod/teachers': 'Teachers',
            '/hod/lectures': 'Lectures',
            '/hod/classes': 'Classes',
            '/hod/timetable': 'Timetable',
            '/hod/leave-requests': 'Leave Requests',
            '/hod/complaints': 'Complaints',
            // Teacher titles
            '/teacher/dashboard': 'Teacher Dashboard',
            '/teacher/attendance': 'Attendance',
            '/teacher/tests': 'Tests',
            '/teacher/timetable': 'My Timetable',
            '/teacher/leave-requests': 'Leave Requests',
            '/teacher/complaints': 'Complaints',
        };

        // Check exact match first
        if (exactTitles[path]) return exactTitles[path];

        // Handle nested routes (e.g., /teacher/attendance/:classId/:subject)
        if (path.startsWith('/teacher/attendance/')) return 'Attendance Sheet';
        if (path.startsWith('/teacher/tests/')) return 'Test Sheet';

        return 'Dashboard';
    };

    const handleToggle = () => {
        if (window.innerWidth <= 768) {
            setMobileOpen(!mobileOpen);
        } else {
            setCollapsed(!collapsed);
        }
    };

    return (
        <div className="main-layout">
            <Sidebar
                collapsed={collapsed}
                mobileOpen={mobileOpen}
                onMobileClose={() => setMobileOpen(false)}
            />
            <div className={`content-wrapper ${collapsed ? 'collapsed' : ''}`}>
                <TopNav
                    collapsed={collapsed}
                    onToggle={handleToggle}
                    pageTitle={getPageTitle()}
                />
                <main className="main-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
