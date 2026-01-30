import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const StudentDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Get today's day name
    const getTodayName = () => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[new Date().getDay()];
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/student/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                setStats(data);
            } else {
                setError(data.message || 'Failed to fetch stats');
            }
        } catch (err) {
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'good': return 'status-good';
            case 'warning': return 'status-warning';
            case 'low': return 'status-low';
            default: return '';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'good': return 'Good';
            case 'warning': return 'Warning';
            case 'low': return 'Low';
            default: return status;
        }
    };

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    if (error) {
        return (
            <div className="page-container">
                <div className="alert alert-error">{error}</div>
            </div>
        );
    }

    const todayName = getTodayName();

    return (
        <div className="page-container">
            {/* Student Info Header */}
            <div className="info-header">
                <h2>Welcome, {user?.fullName || user?.firstName || 'Student'}</h2>
                <p className="subtitle">
                    {stats?.className || 'N/A'} • Year {stats?.year || 'N/A'} • {stats?.department || 'N/A'}
                </p>
            </div>

            {/* Today's Schedule - All lectures for today */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-header">
                    <h2 className="card-title">📅 Today's Schedule ({todayName})</h2>
                    <p style={{ margin: 0, color: 'var(--gray-500)', fontSize: '0.9rem' }}>
                        All classes scheduled for today
                    </p>
                </div>

                {stats?.todaysTimetable && stats.todaysTimetable.length > 0 ? (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Subject</th>
                                    <th>Teacher</th>
                                    <th>Room</th>
                                    <th>Type</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.todaysTimetable.map((lecture, index) => (
                                    <tr key={index}>
                                        <td style={{ fontWeight: '600', color: 'var(--primary)' }}>
                                            {lecture.time}
                                        </td>
                                        <td style={{ fontWeight: '500' }}>{lecture.subject}</td>
                                        <td>{lecture.teacher}</td>
                                        <td>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}>
                                                📍 {lecture.room}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: '4px 10px',
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                background: lecture.type === 'practical'
                                                    ? 'rgba(14, 165, 233, 0.1)'
                                                    : 'rgba(99, 102, 241, 0.1)',
                                                color: lecture.type === 'practical'
                                                    ? '#0ea5e9'
                                                    : '#6366f1',
                                                textTransform: 'capitalize'
                                            }}>
                                                {lecture.type}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-500)' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🎉</div>
                        <p>No classes scheduled for today!</p>
                    </div>
                )}
            </div>

            {/* Attendance Overview */}
            <div className="section">
                <h3 className="section-title">📋 Attendance Overview</h3>
                <div className="stats-grid">
                    {stats?.attendanceStats && stats.attendanceStats.length > 0 ? (
                        stats.attendanceStats.map((subject, index) => (
                            <div key={index} className="stat-card">
                                <div className="stat-card-header">
                                    <h4>{subject.subject}</h4>
                                    <span className={`status-badge ${getStatusClass(subject.status)}`}>
                                        {getStatusLabel(subject.status)}
                                    </span>
                                </div>
                                <div className="stat-card-body">
                                    <div className="progress-container">
                                        <div className="progress-bar">
                                            <div
                                                className={`progress-fill ${getStatusClass(subject.status)}`}
                                                style={{ width: `${subject.percentage}%` }}
                                            ></div>
                                        </div>
                                        <span className="progress-text">{subject.percentage}%</span>
                                    </div>
                                    <div className="stat-details">
                                        <span>Attended: {subject.attended}/{subject.totalLectures}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">No attendance records yet</div>
                    )}
                </div>
            </div>

            {/* Test Performance Overview */}
            <div className="section">
                <h3 className="section-title">📝 Latest Test Scores</h3>
                <div className="stats-grid">
                    {stats?.testStats && stats.testStats.length > 0 ? (
                        stats.testStats.map((test, index) => (
                            <div key={index} className="stat-card">
                                <div className="stat-card-header">
                                    <h4>{test.subject}</h4>
                                    <span className="badge">{test.testType}</span>
                                </div>
                                <div className="stat-card-body">
                                    <div className="test-score">
                                        <span className="score-value">{test.score}</span>
                                        <span className="score-divider">/</span>
                                        <span className="score-max">{test.maxScore}</span>
                                    </div>
                                    <div className="progress-container">
                                        <div className="progress-bar">
                                            <div
                                                className={`progress-fill ${test.percentage >= 60 ? 'status-good' : test.percentage >= 40 ? 'status-warning' : 'status-low'}`}
                                                style={{ width: `${test.percentage}%` }}
                                            ></div>
                                        </div>
                                        <span className="progress-text">{test.percentage}%</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">No test records yet</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
