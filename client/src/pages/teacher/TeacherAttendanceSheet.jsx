import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const TeacherAttendanceSheet = () => {
    const { classId, subject } = useParams();
    const navigate = useNavigate();
    const decodedSubject = decodeURIComponent(subject);

    const [classInfo, setClassInfo] = useState(null);
    const [students, setStudents] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [timeSlots, setTimeSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // New attendance form state
    const [showNewForm, setShowNewForm] = useState(false);
    const [newAttendance, setNewAttendance] = useState({
        date: new Date().toISOString().split('T')[0],
        timeSlotId: '',
        records: []
    });

    // Edit mode state
    const [editingId, setEditingId] = useState(null);
    const [editRecords, setEditRecords] = useState([]);

    useEffect(() => {
        fetchData();
    }, [classId, subject]);

    const fetchData = async () => {
        try {
            const [sheetResponse, timeSlotsResponse] = await Promise.all([
                api.get(`/teacher/attendance/${classId}/${encodeURIComponent(decodedSubject)}`),
                api.get('/teacher/timeslots')
            ]);

            setClassInfo(sheetResponse.data.classInfo);
            setStudents(sheetResponse.data.students);
            setAttendanceRecords(sheetResponse.data.attendanceRecords);
            setTimeSlots(timeSlotsResponse.data);

            // Initialize new attendance records with all students present
            const initialRecords = sheetResponse.data.students.map(s => ({
                studentId: s._id,
                status: 'present'
            }));
            setNewAttendance(prev => ({ ...prev, records: initialRecords }));

            // Set default time slot to first one
            if (timeSlotsResponse.data.length > 0) {
                setNewAttendance(prev => ({ ...prev, timeSlotId: timeSlotsResponse.data[0]._id }));
            }
        } catch (error) {
            console.error('Failed to fetch attendance sheet:', error);
            setMessage({ type: 'error', text: 'Failed to load attendance data' });
        } finally {
            setLoading(false);
        }
    };

    const handleStatusToggle = (studentId, isNew = true) => {
        const targetId = studentId.toString();
        if (isNew) {
            setNewAttendance(prev => ({
                ...prev,
                records: prev.records.map(r =>
                    r.studentId?.toString() === targetId
                        ? { ...r, status: r.status === 'present' ? 'absent' : 'present' }
                        : r
                )
            }));
        } else {
            setEditRecords(prev =>
                prev.map(r => {
                    const recordStudentId = (r.studentId?._id || r.studentId)?.toString();
                    return recordStudentId === targetId
                        ? { ...r, status: r.status === 'present' ? 'absent' : 'present' }
                        : r;
                })
            );
        }
    };

    const handleSaveNew = async () => {
        if (!newAttendance.timeSlotId) {
            setMessage({ type: 'error', text: 'Please select a time slot' });
            return;
        }

        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            await api.post('/teacher/attendance', {
                classId,
                subject: decodedSubject,
                date: newAttendance.date,
                timeSlotId: newAttendance.timeSlotId,
                records: newAttendance.records
            });

            setMessage({ type: 'success', text: 'Attendance saved successfully!' });
            setShowNewForm(false);
            fetchData(); // Refresh data
        } catch (error) {
            console.error('Failed to save attendance:', error);
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save attendance' });
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (record) => {
        setEditingId(record._id);
        // Build edit records for all current students, preserving existing statuses
        const existingRecords = record.records || [];
        const allStudentRecords = students.map(student => {
            // Find existing record for this student
            const existing = existingRecords.find(r =>
                (r.studentId?._id || r.studentId) === student._id
            );
            return {
                studentId: student._id,
                status: existing?.status || 'present'
            };
        });
        setEditRecords(allStudentRecords);
    };

    const handleSaveEdit = async () => {
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            await api.put(`/teacher/attendance/${editingId}`, {
                records: editRecords.map(r => ({
                    studentId: r.studentId?._id || r.studentId,
                    status: r.status
                }))
            });

            setMessage({ type: 'success', text: 'Attendance updated successfully!' });
            setEditingId(null);
            fetchData();
        } catch (error) {
            console.error('Failed to update attendance:', error);
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update attendance' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this attendance record?')) return;

        try {
            await api.delete(`/teacher/attendance/${id}`);
            setMessage({ type: 'success', text: 'Attendance deleted successfully!' });
            fetchData();
        } catch (error) {
            console.error('Failed to delete attendance:', error);
            setMessage({ type: 'error', text: 'Failed to delete attendance' });
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getTimeSlotLabel = (timeSlotId) => {
        const slot = timeSlots.find(s => s._id === timeSlotId);
        return slot ? `${slot.startTime} - ${slot.endTime}` : '';
    };

    const getStudentStatus = (records, studentId) => {
        const record = records.find(r => (r.studentId?._id || r.studentId) === studentId);
        return record?.status || 'present';
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
            {/* Header */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <button
                            className="btn btn-ghost"
                            onClick={() => navigate('/teacher/attendance')}
                            style={{ marginBottom: '8px' }}
                        >
                            ← Back to Attendance
                        </button>
                        <h2 className="card-title" style={{ margin: 0 }}>
                            {classInfo?.className} - {classInfo?.subject}
                        </h2>
                        <p style={{ margin: '4px 0 0', color: 'var(--gray-500)' }}>
                            {classInfo?.department} • Year {classInfo?.year}
                        </p>
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowNewForm(true)}
                        disabled={showNewForm}
                    >
                        + Take New Attendance
                    </button>
                </div>
            </div>

            {/* Messages */}
            {message.text && (
                <div className={`alert alert-${message.type}`} style={{ marginBottom: '24px' }}>
                    {message.text}
                </div>
            )}

            {/* New Attendance Form */}
            {showNewForm && (
                <div className="card" style={{ marginBottom: '24px' }}>
                    <div className="card-header">
                        <h3 className="card-title">📋 New Attendance</h3>
                    </div>
                    <div style={{ padding: '0 24px 24px' }}>
                        <div className="form-row" style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                            <div className="form-group" style={{ flex: '1', minWidth: '200px' }}>
                                <label className="form-label">Date</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={newAttendance.date}
                                    onChange={(e) => setNewAttendance(prev => ({ ...prev, date: e.target.value }))}
                                />
                            </div>
                            <div className="form-group" style={{ flex: '1', minWidth: '200px' }}>
                                <label className="form-label">Time Slot</label>
                                <select
                                    className="form-input"
                                    value={newAttendance.timeSlotId}
                                    onChange={(e) => setNewAttendance(prev => ({ ...prev, timeSlotId: e.target.value }))}
                                >
                                    <option value="">Select Time Slot</option>
                                    {timeSlots.map(slot => (
                                        <option key={slot._id} value={slot._id}>
                                            {slot.label || `${slot.startTime} - ${slot.endTime}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            <table className="table">
                                <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                                    <tr>
                                        <th style={{ width: '60px' }}>#</th>
                                        <th>Roll No</th>
                                        <th>Student Name</th>
                                        <th style={{ width: '120px', textAlign: 'center' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student, index) => {
                                        const record = newAttendance.records.find(r => r.studentId === student._id);
                                        const status = record?.status || 'present';
                                        return (
                                            <tr key={student._id}>
                                                <td>{index + 1}</td>
                                                <td>{student.username}</td>
                                                <td>{student.fullName}</td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <button
                                                        className={`btn ${status === 'present' ? 'btn-success' : 'btn-danger'}`}
                                                        style={{
                                                            minWidth: '80px',
                                                            padding: '6px 12px',
                                                            fontSize: '0.85rem'
                                                        }}
                                                        onClick={() => handleStatusToggle(student._id, true)}
                                                    >
                                                        {status === 'present' ? '✓ Present' : '✗ Absent'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                            <button className="btn btn-ghost" onClick={() => setShowNewForm(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleSaveNew} disabled={saving}>
                                {saving ? 'Saving...' : 'Save Attendance'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Existing Attendance Records */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">📅 Attendance History</h3>
                </div>

                {attendanceRecords.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Time Slot</th>
                                    <th>Present</th>
                                    <th>Absent</th>
                                    <th>Total</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendanceRecords.map(record => (
                                    <tr key={record._id}>
                                        <td>{formatDate(record.date)}</td>
                                        <td>{record.timeSlotId?.label || getTimeSlotLabel(record.timeSlotId)}</td>
                                        <td>
                                            <span className="badge" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
                                                {record.presentCount}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="badge" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>
                                                {record.absentCount}
                                            </span>
                                        </td>
                                        <td>{record.totalCount}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="btn btn-ghost"
                                                    onClick={() => handleEdit(record)}
                                                    title="Edit"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    className="btn btn-ghost"
                                                    onClick={() => handleDelete(record._id)}
                                                    title="Delete"
                                                    style={{ color: 'var(--danger)' }}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-500)' }}>
                        <p>No attendance records yet. Click "Take New Attendance" to get started.</p>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingId && (
                <div className="modal-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div className="modal-content" style={{
                        background: 'white',
                        borderRadius: '12px',
                        width: '90%',
                        maxWidth: '600px',
                        maxHeight: '80vh',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid var(--gray-200)' }}>
                            <h3 style={{ margin: 0 }}>Edit Attendance</h3>
                        </div>
                        <div style={{ flex: 1, overflow: 'auto', padding: '0' }}>
                            <table className="table">
                                <thead style={{ position: 'sticky', top: 0, background: 'white' }}>
                                    <tr>
                                        <th>#</th>
                                        <th>Student Name</th>
                                        <th style={{ textAlign: 'center' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student, index) => {
                                        const status = getStudentStatus(editRecords, student._id);
                                        return (
                                            <tr key={student._id}>
                                                <td>{index + 1}</td>
                                                <td>{student.fullName}</td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <button
                                                        className={`btn ${status === 'present' ? 'btn-success' : 'btn-danger'}`}
                                                        style={{ minWidth: '80px', padding: '6px 12px', fontSize: '0.85rem' }}
                                                        onClick={() => handleStatusToggle(student._id, false)}
                                                    >
                                                        {status === 'present' ? '✓ Present' : '✗ Absent'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ padding: '20px', borderTop: '1px solid var(--gray-200)', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button className="btn btn-ghost" onClick={() => setEditingId(null)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSaveEdit} disabled={saving}>
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherAttendanceSheet;
