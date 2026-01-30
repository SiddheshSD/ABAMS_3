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

    // Student navigation items
    const studentNavItems = [
        { path: '/student/dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/student/timetable', icon: '📅', label: 'Timetable' },
        { path: '/student/attendance', icon: '📋', label: 'Attendance' },
        { path: '/student/tests', icon: '📝', label: 'Test Scores' },
        { path: '/student/leave-requests', icon: '🏖️', label: 'Leave Requests' },
        { path: '/student/complaints', icon: '📢', label: 'Complaints' },
    ];

    // Parent navigation items
    const parentNavItems = [
        { path: '/parent/dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/parent/timetable', icon: '📅', label: 'Timetable' },
        { path: '/parent/attendance', icon: '📋', label: 'Attendance' },
        { path: '/parent/tests', icon: '📝', label: 'Test Scores' },
        { path: '/parent/leave-requests', icon: '🏖️', label: 'Leave Requests' },
        { path: '/parent/complaints', icon: '📢', label: 'Complaints' },
    ];

    // Class Coordinator navigation items
    const ccNavItems = [
        { path: '/cc/dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/cc/timetable', icon: '📅', label: 'Timetable' },
        { path: '/cc/attendance', icon: '📋', label: 'Attendance' },
        { path: '/cc/tests', icon: '📝', label: 'Test Scores' },
        { path: '/cc/students', icon: '👨‍🎓', label: 'Students' },
        { path: '/cc/leave-requests', icon: '🏖️', label: 'Leave Requests' },
        { path: '/cc/complaints', icon: '📢', label: 'Complaints' },
    ];

    // Select nav items based on user role
    const getNavItems = () => {
        switch (user?.role) {
            case 'hod':
                return hodNavItems;
            case 'teacher':
                return teacherNavItems;
            case 'classcoordinator':
                return ccNavItems;
            case 'student':
                return studentNavItems;
            case 'parent':
                return parentNavItems;
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
