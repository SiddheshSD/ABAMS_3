import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ collapsed, mobileOpen, onMobileClose }) => {
    const { user } = useAuth();

    // Admin navigation items
    const adminNavItems = [
        { path: '/dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/students', icon: '👨‍🎓', label: 'Students' },
        { path: '/teachers', icon: '👨‍🏫', label: 'Teachers' },
        { path: '/departments', icon: '🏢', label: 'Departments' },
        { path: '/classes', icon: '📚', label: 'Classes' },
        { path: '/subjects', icon: '📖', label: 'Subjects' },
        { path: '/test-types', icon: '📝', label: 'Test Types' },
        { path: '/lectures', icon: '🎯', label: 'Lectures' },
        { path: '/timetable', icon: '📅', label: 'Timetable' },
        { path: '/rooms', icon: '🚪', label: 'Classrooms' },
        { path: '/timeslots', icon: '⏰', label: 'Time Slots' },
    ];

    // HOD navigation items
    const hodNavItems = [
        { path: '/hod/dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/hod/attendance', icon: '📋', label: 'Attendance' },
        { path: '/hod/students', icon: '👨‍🎓', label: 'Students' },
        { path: '/hod/teachers', icon: '👨‍🏫', label: 'Teachers' },
        { path: '/hod/lectures', icon: '📖', label: 'Lectures' },
        { path: '/hod/classes', icon: '📚', label: 'Classes' },
        { path: '/hod/timetable', icon: '📅', label: 'Timetable' },
        { path: '/hod/leave-requests', icon: '📝', label: 'Leave Requests' },
        { path: '/hod/complaints', icon: '📢', label: 'Complaints' },
    ];

    // Teacher navigation items
    const teacherNavItems = [
        { path: '/teacher/dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/teacher/attendance', icon: '📋', label: 'Attendance' },
        { path: '/teacher/tests', icon: '📝', label: 'Tests' },
        { path: '/teacher/timetable', icon: '📅', label: 'Timetable' },
        { path: '/teacher/leave-requests', icon: '🏖️', label: 'Leave Requests' },
        { path: '/teacher/complaints', icon: '📢', label: 'Complaints' },
    ];

    // Select nav items based on user role
    const getNavItems = () => {
        switch (user?.role) {
            case 'hod':
                return hodNavItems;
            case 'teacher':
            case 'classcoordinator':
                return teacherNavItems;
            default:
                return adminNavItems;
        }
    };

    const navItems = getNavItems();

    return (
        <>
            <div className={`mobile-overlay ${mobileOpen ? 'show' : ''}`} onClick={onMobileClose}></div>
            <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-header">
                    <div className="logo">
                        <div className="logo-icon">🎓</div>
                        <span className="logo-text">ABAMS</span>
                    </div>
                </div>
                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            onClick={onMobileClose}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
            </aside>
        </>
    );
};

export default Sidebar;
