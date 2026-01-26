import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const TopNav = ({ collapsed, onToggle, pageTitle }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getInitials = (name) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const formatRole = (role) => {
        const roles = {
            admin: 'Admin',
            hod: 'HOD',
            classcoordinator: 'Class Coordinator',
            teacher: 'Teacher',
            student: 'Student',
            parent: 'Parent'
        };
        return roles[role] || role;
    };

    return (
        <header className={`topnav ${collapsed ? 'collapsed' : ''}`}>
            <div className="topnav-left">
                <button className="toggle-btn" onClick={onToggle}>
                    ☰
                </button>
                <h1 className="page-title">{pageTitle}</h1>
            </div>
            <div className="topnav-right">
                <div className="user-info" ref={dropdownRef} onClick={() => setDropdownOpen(!dropdownOpen)}>
                    <div className="user-avatar">{getInitials(user?.fullName || 'U')}</div>
                    <div className="user-details">
                        <div className="user-name">{user?.fullName}</div>
                        <span className="user-role">{formatRole(user?.role)}</span>
                    </div>
                    <span>▼</span>
                    <div className={`dropdown-menu ${dropdownOpen ? 'show' : ''}`}>
                        <div className="dropdown-item" onClick={() => navigate('/profile')}>
                            👤 Profile
                        </div>
                        <div className="dropdown-item danger" onClick={handleLogout}>
                            🚪 Logout
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default TopNav;
