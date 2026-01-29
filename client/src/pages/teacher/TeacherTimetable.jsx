import { useState, useEffect } from 'react';
import api from '../../services/api';

const TeacherTimetable = () => {
    const [timetable, setTimetable] = useState([]);
    const [timeSlots, setTimeSlots] = useState([]);
    const [loading, setLoading] = useState(true);

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [timetableResponse, timeSlotsResponse] = await Promise.all([
                api.get('/teacher/timetable'),
                api.get('/teacher/timeslots')
            ]);
            setTimetable(timetableResponse.data);
            setTimeSlots(timeSlotsResponse.data);
        } catch (error) {
            console.error('Failed to fetch timetable:', error);
        } finally {
            setLoading(false);
        }
    };

    const getEntryForSlot = (day, slotId) => {
        return timetable.find(entry =>
            entry.day === day &&
            (entry.timeSlotId?._id === slotId || entry.timeSlotId === slotId)
        );
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
                    <h2 className="card-title">📅 My Weekly Timetable</h2>
                    <p style={{ margin: 0, color: 'var(--gray-500)', fontSize: '0.9rem' }}>
                        Your teaching schedule for the week
                    </p>
                </div>
            </div>

            <div className="card" style={{ marginTop: '24px', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="table timetable-table" style={{ minWidth: '800px' }}>
                        <thead>
                            <tr>
                                <th style={{ width: '120px', background: 'var(--gray-100)' }}>Day</th>
                                {timeSlots.map(slot => (
                                    <th key={slot._id} style={{ textAlign: 'center', minWidth: '150px' }}>
                                        <div style={{ fontWeight: '600' }}>{slot.label || 'Slot'}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 'normal' }}>
                                            {slot.startTime} - {slot.endTime}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {days.map(day => (
                                <tr key={day}>
                                    <td style={{
                                        fontWeight: '600',
                                        background: 'var(--gray-50)',
                                        color: 'var(--gray-700)'
                                    }}>
                                        {day}
                                    </td>
                                    {timeSlots.map(slot => {
                                        const entry = getEntryForSlot(day, slot._id);
                                        return (
                                            <td key={slot._id} style={{
                                                padding: '8px',
                                                verticalAlign: 'top',
                                                background: entry ? 'var(--primary-light)' : 'white'
                                            }}>
                                                {entry ? (
                                                    <div style={{
                                                        padding: '8px',
                                                        borderRadius: '8px',
                                                        background: entry.type === 'practical'
                                                            ? 'linear-gradient(135deg, #10b981, #34d399)'
                                                            : 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                                                        color: 'white',
                                                        fontSize: '0.85rem'
                                                    }}>
                                                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                                                            {entry.classId?.name || 'Class'}
                                                        </div>
                                                        <div style={{ opacity: 0.9, fontSize: '0.8rem' }}>
                                                            {entry.subject}
                                                        </div>
                                                        <div style={{
                                                            marginTop: '6px',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            fontSize: '0.75rem',
                                                            opacity: 0.85
                                                        }}>
                                                            <span>📍 {entry.roomId?.roomNumber || 'Room'}</span>
                                                            <span style={{
                                                                padding: '2px 6px',
                                                                background: 'rgba(255,255,255,0.2)',
                                                                borderRadius: '4px',
                                                                textTransform: 'capitalize'
                                                            }}>
                                                                {entry.type}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div style={{
                                                        textAlign: 'center',
                                                        color: 'var(--gray-400)',
                                                        padding: '20px 0',
                                                        fontSize: '0.9rem'
                                                    }}>
                                                        —
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Legend */}
            <div className="card" style={{ marginTop: '24px' }}>
                <div style={{ padding: '16px 24px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '4px',
                            background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))'
                        }}></div>
                        <span style={{ fontSize: '0.9rem', color: 'var(--gray-600)' }}>Lecture</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '4px',
                            background: 'linear-gradient(135deg, #10b981, #34d399)'
                        }}></div>
                        <span style={{ fontSize: '0.9rem', color: 'var(--gray-600)' }}>Practical</span>
                    </div>
                </div>
            </div>

            {/* Stats */}
            {timetable.length > 0 && (
                <div className="stats-grid" style={{ marginTop: '24px' }}>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))' }}>📚</div>
                        <div className="stat-info">
                            <h3>{timetable.filter(t => t.type === 'lecture').length}</h3>
                            <p>Lectures/Week</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #34d399)' }}>🔬</div>
                        <div className="stat-info">
                            <h3>{timetable.filter(t => t.type === 'practical').length}</h3>
                            <p>Practicals/Week</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon classes">📊</div>
                        <div className="stat-info">
                            <h3>{timetable.length}</h3>
                            <p>Total Sessions</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherTimetable;
