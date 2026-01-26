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
        const titles = {
            '/dashboard': 'Dashboard',
            '/users': 'User Management',
            '/departments': 'Departments',
            '/classes': 'Classes',
            '/timetable': 'Timetable',
            '/rooms': 'Classrooms & Labs',
            '/timeslots': 'Time Slots',
            '/profile': 'Profile'
        };
        return titles[path] || 'Dashboard';
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
