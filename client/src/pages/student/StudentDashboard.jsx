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
            <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-header">
                    <h2 className="card-title">📋 Attendance Overview</h2>
                </div>
                <div className="year-cards-grid">
                    {stats?.attendanceStats && stats.attendanceStats.length > 0 ? (
                        stats.attendanceStats.map((subject, index) => {
                            const getStatusColor = (status) => {
                                if (status === 'good') return 'var(--success)';
                                if (status === 'warning') return 'var(--warning)';
                                return 'var(--danger)';
                            };
                            const getStatusClassLocal = (status) => {
                                if (status === 'good') return 'good';
                                if (status === 'warning') return 'warning';
                                return 'critical';
                            };
                            return (
                                <div key={index} className="year-card">
                                    <div className="year-header">
                                        <span className="year-number">{subject.subject}</span>
                                        <span className={`attendance-badge ${getStatusClassLocal(subject.status)}`}>
                                            {subject.percentage}%
                                        </span>
                                    </div>
                                    <div className="year-stats">
                                        <div className="year-stat">
                                            <span className="stat-value">{subject.attended}</span>
                                            <span className="stat-label">Attended</span>
                                        </div>
                                        <div className="year-stat">
                                            <span className="stat-value">{subject.totalLectures}</span>
                                            <span className="stat-label">Total Lectures</span>
                                        </div>
                                    </div>
                                    <div className="attendance-bar">
                                        <div
                                            className="attendance-fill"
                                            style={{
                                                width: `${subject.percentage}%`,
                                                background: getStatusColor(subject.status)
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--gray-500)' }}>
                            No attendance records yet
                        </div>
                    )}
                </div>
            </div>

            {/* Test Performance Overview */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-header">
                    <h2 className="card-title">📝 Performance Overview</h2>
                </div>
                <div className="year-cards-grid">
                    {stats?.testStats && stats.testStats.length > 0 ? (
                        stats.testStats.map((test, index) => {
                            const getStatusColor = (percentage) => {
                                if (percentage >= 75) return 'var(--success)';
                                if (percentage >= 60) return 'var(--warning)';
                                return 'var(--danger)';
                            };
                            const getStatusClassLocal = (percentage) => {
                                if (percentage >= 75) return 'good';
                                if (percentage >= 60) return 'warning';
                                return 'critical';
                            };
                            return (
                                <div key={index} className="year-card">
                                    <div className="year-header">
                                        <span className="year-number">{test.subject}</span>
                                        <span className={`attendance-badge ${getStatusClassLocal(test.percentage)}`}>
                                            {test.percentage}%
                                        </span>
                                    </div>
                                    <div style={{ padding: '8px 0', color: 'var(--gray-600)', fontSize: '0.85rem' }}>
                                        {test.testType}
                                    </div>
                                    <div className="year-stats">
                                        <div className="year-stat">
                                            <span className="stat-value">{test.score}</span>
                                            <span className="stat-label">Score</span>
                                        </div>
                                        <div className="year-stat">
                                            <span className="stat-value">{test.maxScore}</span>
                                            <span className="stat-label">Max Score</span>
                                        </div>
                                    </div>
                                    <div className="attendance-bar">
                                        <div
                                            className="attendance-fill"
                                            style={{
                                                width: `${test.percentage}%`,
                                                background: getStatusColor(test.percentage)
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--gray-500)' }}>
                            No test records yet
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
