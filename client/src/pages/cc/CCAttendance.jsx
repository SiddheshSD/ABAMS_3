import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const CCAttendance = () => {
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchAttendance();
    }, []);

    const fetchAttendance = async () => {
        try {
            const response = await api.get('/cc/attendance');
            setAttendanceData(response.data);
        } catch (error) {
            console.error('Failed to fetch attendance:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        if (status === 'good') return 'var(--success)';
        if (status === 'warning') return 'var(--warning)';
        return 'var(--danger)';
    };

    const getStatusClass = (status) => {
        if (status === 'good') return 'good';
        if (status === 'warning') return 'warning';
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
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">📋 Attendance Overview</h2>
                </div>

                <div className="year-cards-grid">
                    {attendanceData.map((subject, index) => (
                        <div
                            key={index}
                            className="year-card"
                            style={{ cursor: 'pointer' }}
                            onClick={() => navigate(`/cc/attendance/${encodeURIComponent(subject.subject)}`)}
                        >
                            <div className="year-header">
                                <span className="year-number">{subject.subject}</span>
                                <span className={`attendance-badge ${getStatusClass(subject.status)}`}>
                                    {subject.avgAttendance}%
                                </span>
                            </div>
                            <div className="year-stats">
                                <div className="year-stat">
                                    <span className="stat-value">{subject.totalLectures}</span>
                                    <span className="stat-label">Total Lectures</span>
                                </div>
                                <div className="year-stat">
                                    <span className="stat-value" style={{ color: getStatusColor(subject.status) }}>
                                        {subject.avgAttendance}%
                                    </span>
                                    <span className="stat-label">Avg Attendance</span>
                                </div>
                            </div>
                            <div className="attendance-bar">
                                <div
                                    className="attendance-fill"
                                    style={{
                                        width: `${subject.avgAttendance}%`,
                                        background: getStatusColor(subject.status)
                                    }}
                                ></div>
                            </div>
                            <div style={{ marginTop: '12px', textAlign: 'center' }}>
                                <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px' }}>
                                    View Details →
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {attendanceData.length === 0 && (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No attendance records found for this class
                    </div>
                )}
            </div>
        </div>
    );
};

export default CCAttendance;
