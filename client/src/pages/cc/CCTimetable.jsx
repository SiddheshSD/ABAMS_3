import { useState, useEffect } from 'react';
import api from '../../services/api';

const CCTimetable = () => {
    const [timetable, setTimetable] = useState([]);
    const [timeSlots, setTimeSlots] = useState([]);
    const [loading, setLoading] = useState(true);

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    useEffect(() => {
        fetchTimetable();
    }, []);

    const fetchTimetable = async () => {
        try {
            const response = await api.get('/cc/timetable');
            setTimetable(response.data.timetable || []);
            setTimeSlots(response.data.timeSlots || []);
        } catch (error) {
            console.error('Failed to fetch timetable:', error);
        } finally {
            setLoading(false);
        }
    };

    const getEntryForSlot = (day, slotId) => {
        return timetable.find(t => t.day === day && t.timeSlotId?._id === slotId);
    };

    const formatTime = (time) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    // Separate regular slots and breaks
    const regularSlots = timeSlots.filter(slot => slot.type !== 'break');
    const breakSlots = timeSlots.filter(slot => slot.type === 'break');

    return (
        <div>
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">📅 Class Timetable</h2>
                </div>

                <div className="timetable-container" style={{ overflowX: 'auto' }}>
                    <table className="timetable-table">
                        <thead>
                            <tr>
                                <th style={{ minWidth: '100px' }}>Day</th>
                                {timeSlots.map(slot => (
                                    <th key={slot._id} style={{
                                        minWidth: slot.type === 'break' ? '80px' : '140px',
                                        background: slot.type === 'break' ? 'var(--warning-light)' : undefined
                                    }}>
                                        <div style={{ fontSize: '12px' }}>
                                            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                        </div>
                                        {slot.type === 'break' && (
                                            <div style={{ fontSize: '11px', color: 'var(--warning)' }}>
                                                {slot.label || 'Break'}
                                            </div>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {days.map(day => (
                                <tr key={day}>
                                    <td style={{ fontWeight: '600' }}>{day}</td>
                                    {timeSlots.map(slot => {
                                        if (slot.type === 'break') {
                                            return (
                                                <td key={slot._id} style={{
                                                    background: 'var(--warning-light)',
                                                    textAlign: 'center',
                                                    color: 'var(--text-secondary)'
                                                }}>
                                                    🍔
                                                </td>
                                            );
                                        }

                                        const entry = getEntryForSlot(day, slot._id);
                                        if (!entry) {
                                            return <td key={slot._id} style={{ color: 'var(--text-tertiary)' }}>—</td>;
                                        }

                                        return (
                                            <td key={slot._id}>
                                                <div className="timetable-entry">
                                                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                                                        {entry.subject}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                        {entry.teacherId?.fullName || entry.teacherId?.firstName || 'TBA'}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                                                        {entry.roomId?.roomNumber || ''} • {entry.type}
                                                    </div>
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {timetable.length === 0 && (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No timetable entries found for this class
                    </div>
                )}
            </div>
        </div>
    );
};

export default CCTimetable;
