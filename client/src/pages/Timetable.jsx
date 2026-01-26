import { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';

const Timetable = () => {
    const [timetables, setTimetables] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [timeSlots, setTimeSlots] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedClass, setSelectedClass] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const [formData, setFormData] = useState({
        classId: '',
        subject: '',
        teacherId: '',
        day: 'Monday',
        timeSlotId: '',
        roomId: '',
        type: 'lecture'
    });

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchTimetable();
        }
    }, [selectedClass]);

    const fetchData = async () => {
        try {
            const [classesRes, teachersRes, slotsRes, roomsRes, subjectsRes] = await Promise.all([
                api.get('/classes'),
                api.get('/users?role=teacher'),
                api.get('/timeslots'),
                api.get('/rooms'),
                api.get('/subjects')
            ]);
            setClasses(classesRes.data);
            setTeachers(teachersRes.data);
            setTimeSlots(slotsRes.data);
            setRooms(roomsRes.data);
            setSubjects(subjectsRes.data);
            if (classesRes.data.length > 0) {
                setSelectedClass(classesRes.data[0]._id);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTimetable = async () => {
        try {
            const response = await api.get(`/timetables?classId=${selectedClass}`);
            setTimetables(response.data);
        } catch (error) {
            console.error('Failed to fetch timetable:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingEntry) {
                await api.put(`/timetables/${editingEntry._id}`, formData);
            } else {
                await api.post('/timetables', formData);
            }
            fetchTimetable();
            closeModal();
        } catch (error) {
            alert(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleEdit = (entry) => {
        setEditingEntry(entry);
        setFormData({
            classId: entry.classId?._id || selectedClass,
            subject: entry.subject,
            teacherId: entry.teacherId?._id || '',
            day: entry.day,
            timeSlotId: entry.timeSlotId?._id || '',
            roomId: entry.roomId?._id || '',
            type: entry.type
        });
        setModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this timetable entry?')) return;
        try {
            await api.delete(`/timetables/${id}`);
            fetchTimetable();
        } catch (error) {
            alert('Delete failed');
        }
    };

    const openAddModal = (day = 'Monday', slotId = '') => {
        setEditingEntry(null);
        setFormData({
            classId: selectedClass,
            subject: '',
            teacherId: '',
            day: day,
            timeSlotId: slotId,
            roomId: '',
            type: 'lecture'
        });
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingEntry(null);
    };

    const getEntry = (day, slotId) => {
        return timetables.find(t => t.day === day && t.timeSlotId?._id === slotId);
    };

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    return (
        <div>
            <div className="card">
                <div className="toolbar">
                    <div className="filter-group">
                        <label style={{ fontWeight: '500', marginRight: '8px' }}>Select Class:</label>
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            style={{ minWidth: '200px' }}
                        >
                            {classes.map((cls) => (
                                <option key={cls._id} value={cls._id}>
                                    {cls.name} ({cls.departmentId?.name})
                                </option>
                            ))}
                        </select>
                    </div>
                    <button className="btn btn-primary" onClick={() => openAddModal()}>
                        ➕ Add Entry
                    </button>
                </div>

                {classes.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📅</div>
                        <h3>No classes available</h3>
                        <p>Create classes first to manage timetables</p>
                    </div>
                ) : timeSlots.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">⏰</div>
                        <h3>No time slots configured</h3>
                        <p>Configure time slots first to create timetables</p>
                    </div>
                ) : (
                    <div className="table-container" style={{ overflowX: 'auto' }}>
                        <table className="table" style={{ minWidth: '900px' }}>
                            <thead>
                                <tr>
                                    <th style={{ minWidth: '100px' }}>Time</th>
                                    {days.map(day => (
                                        <th key={day} style={{ minWidth: '120px' }}>{day}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {timeSlots.filter(s => s.type !== 'break').map((slot) => (
                                    <tr key={slot._id}>
                                        <td style={{ fontWeight: '500', fontSize: '13px' }}>
                                            {slot.startTime}<br />
                                            <span style={{ color: 'var(--gray-500)' }}>{slot.endTime}</span>
                                        </td>
                                        {days.map(day => {
                                            const entry = getEntry(day, slot._id);
                                            return (
                                                <td key={day} style={{ padding: '8px' }}>
                                                    {entry ? (
                                                        <div
                                                            style={{
                                                                background: entry.type === 'practical' ? 'rgba(14, 165, 233, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                                                                padding: '8px',
                                                                borderRadius: '8px',
                                                                fontSize: '12px',
                                                                cursor: 'pointer'
                                                            }}
                                                            onClick={() => handleEdit(entry)}
                                                        >
                                                            <strong>{entry.subject}</strong><br />
                                                            <span style={{ color: 'var(--gray-600)' }}>{entry.teacherId?.fullName}</span><br />
                                                            <span style={{ color: 'var(--gray-500)' }}>{entry.roomId?.roomNumber}</span>
                                                            <button
                                                                className="btn-icon"
                                                                style={{ float: 'right', padding: '2px' }}
                                                                onClick={(e) => { e.stopPropagation(); handleDelete(entry._id); }}
                                                            >🗑️</button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            style={{
                                                                width: '100%',
                                                                padding: '12px',
                                                                background: 'var(--gray-50)',
                                                                border: '2px dashed var(--gray-300)',
                                                                borderRadius: '8px',
                                                                cursor: 'pointer',
                                                                color: 'var(--gray-400)'
                                                            }}
                                                            onClick={() => openAddModal(day, slot._id)}
                                                        >
                                                            + Add
                                                        </button>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Modal
                isOpen={modalOpen}
                onClose={closeModal}
                title={editingEntry ? 'Edit Timetable Entry' : 'Add Timetable Entry'}
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleSubmit}>
                            {editingEntry ? 'Update' : 'Create'}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Subject *</label>
                        <select
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            required
                        >
                            <option value="">Select Subject</option>
                            {subjects.map(sub => (
                                <option key={sub._id} value={sub.name}>
                                    {sub.name} ({sub.code})
                                </option>
                            ))}
                        </select>
                        <small style={{ color: 'var(--gray-500)', marginTop: '4px', display: 'block' }}>
                            Or type custom:
                            <input
                                type="text"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                placeholder="Custom subject name"
                                style={{ marginLeft: '8px', width: '60%' }}
                            />
                        </small>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Day *</label>
                            <select
                                value={formData.day}
                                onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                            >
                                {days.map(day => (
                                    <option key={day} value={day}>{day}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Time Slot *</label>
                            <select
                                value={formData.timeSlotId}
                                onChange={(e) => setFormData({ ...formData, timeSlotId: e.target.value })}
                                required
                            >
                                <option value="">Select Slot</option>
                                {timeSlots.filter(s => s.type !== 'break').map(slot => (
                                    <option key={slot._id} value={slot._id}>
                                        {slot.label} ({slot.startTime} - {slot.endTime})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Teacher *</label>
                            <select
                                value={formData.teacherId}
                                onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                                required
                            >
                                <option value="">Select Teacher</option>
                                {teachers.map(t => (
                                    <option key={t._id} value={t._id}>{t.fullName}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Room *</label>
                            <select
                                value={formData.roomId}
                                onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                                required
                            >
                                <option value="">Select Room</option>
                                {rooms.map(r => (
                                    <option key={r._id} value={r._id}>
                                        {r.roomNumber} ({r.roomType})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Type *</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option value="lecture">Lecture</option>
                            <option value="practical">Practical</option>
                        </select>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Timetable;
