import { useState, useEffect } from 'react';
import api from '../../services/api';

const HodDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await api.get('/hod/stats');
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch HOD stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (percentage) => {
        if (percentage >= 75) return 'var(--success)';
        if (percentage >= 60) return 'var(--warning)';
        return 'var(--danger)';
    };

    const getStatusClass = (percentage) => {
        if (percentage >= 75) return 'good';
        if (percentage >= 60) return 'warning';
        return 'critical';
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div>
            {/* Quick Stats Row */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon students">👨‍🎓</div>
                    <div className="stat-info">
                        <h3>{stats?.totalStudents || 0}</h3>
                        <p>Total Students</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon teachers">👨‍🏫</div>
                    <div className="stat-info">
                        <h3>{stats?.totalTeachers || 0}</h3>
                        <p>Total Teachers</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon classes">📚</div>
                    <div className="stat-info">
                        <h3>{stats?.totalClasses || 0}</h3>
                        <p>Classes</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}>📋</div>
                    <div className="stat-info">
                        <h3>{stats?.pendingLeaves || 0}</h3>
                        <p>Pending Leaves</p>
                    </div>
                </div>
            </div>

            {/* Year-wise Attendance Overview */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-header">
                    <h2 className="card-title">Year-wise Attendance Overview</h2>
                </div>
                <div className="year-cards-grid">
                    {[1, 2, 3, 4].map(year => {
                        const yearData = stats?.yearStats?.[year] || { classCount: 0, studentCount: 0, avgAttendance: 0 };
                        return (
                            <div key={year} className="year-card">
                                <div className="year-header">
                                    <span className="year-number">{year}{year === 1 ? 'st' : year === 2 ? 'nd' : year === 3 ? 'rd' : 'th'} Year</span>
                                    <span className={`attendance-badge ${getStatusClass(yearData.avgAttendance)}`}>
                                        {yearData.avgAttendance}%
                                    </span>
                                </div>
                                <div className="year-stats">
                                    <div className="year-stat">
                                        <span className="stat-value">{yearData.classCount}</span>
                                        <span className="stat-label">Classes</span>
                                    </div>
                                    <div className="year-stat">
                                        <span className="stat-value">{yearData.studentCount}</span>
                                        <span className="stat-label">Students</span>
                                    </div>
                                </div>
                                <div className="attendance-bar">
                                    <div
                                        className="attendance-fill"
                                        style={{
                                            width: `${yearData.avgAttendance}%`,
                                            background: getStatusColor(yearData.avgAttendance)
                                        }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Quick Actions & Alerts */}
            <div className="dashboard-grid">
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Quick Actions</h2>
                    </div>
                    <div className="quick-actions">
                        <a href="/hod/students" className="action-btn">
                            <span className="action-icon">👥</span>
                            <span>Manage Students</span>
                        </a>
                        <a href="/hod/timetable" className="action-btn">
                            <span className="action-icon">📅</span>
                            <span>View Timetable</span>
                        </a>
                        <a href="/hod/leave-requests" className="action-btn">
                            <span className="action-icon">📝</span>
                            <span>Review Leaves</span>
                        </a>
                        <a href="/hod/complaints" className="action-btn">
                            <span className="action-icon">📢</span>
                            <span>View Complaints</span>
                        </a>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Pending Items</h2>
                    </div>
                    <div className="pending-list">
                        <div className="pending-item">
                            <div className="pending-icon warning">⏳</div>
                            <div className="pending-info">
                                <span className="pending-count">{stats?.pendingLeaves || 0}</span>
                                <span className="pending-label">Leave Requests Pending</span>
                            </div>
                        </div>
                        <div className="pending-item">
                            <div className="pending-icon danger">⚠️</div>
                            <div className="pending-info">
                                <span className="pending-count">{stats?.openComplaints || 0}</span>
                                <span className="pending-label">Open Complaints</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HodDashboard;
