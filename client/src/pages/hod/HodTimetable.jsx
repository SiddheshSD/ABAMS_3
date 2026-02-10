import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';

const HodTimetable = () => {
    const [timetables, setTimetables] = useState([]);
    const [otherTimetables, setOtherTimetables] = useState([]);
    const [classes, setClasses] = useState([]);
    const [lectures, setLectures] = useState([]);
    const [timeSlots, setTimeSlots] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedClass, setSelectedClass] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const [showOtherDepts, setShowOtherDepts] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        lectureId: '',
        classId: '',
        subject: '',
        teacherId: '',
        day: 'Monday',
        timeSlotId: '',
        timeSlotIds: [],
        roomId: '',
        type: 'lecture',
        batchId: ''
    });

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchTimetables();
            fetchBatches();
        }
    }, [selectedClass]);

    const fetchData = async () => {
        try {
            const [classesRes, lecturesRes, slotsRes, roomsRes] = await Promise.all([
                api.get('/hod/classes'),
                api.get('/hod/lectures'),
                api.get('/timeslots'),
                api.get('/rooms')
            ]);
            setClasses(classesRes.data);
            setLectures(lecturesRes.data);
            setTimeSlots(slotsRes.data);
            setRooms(roomsRes.data);

            if (classesRes.data.length > 0) {
                setSelectedClass(classesRes.data[0]._id);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTimetables = async () => {
        try {
            const response = await api.get(`/hod/timetables?classId=${selectedClass}`);
            setTimetables(response.data);
        } catch (error) {
            console.error('Failed to fetch timetables:', error);
        }
    };

    const fetchBatches = async () => {
        try {
            const response = await api.get(`/hod/timetables/class-batches/${selectedClass}`);
            setBatches(response.data.batches || []);
        } catch (error) {
            console.error('Failed to fetch batches:', error);
            setBatches([]);
        }
    };

    const fetchOtherDeptTimetables = async () => {
        try {
            const response = await api.get('/hod/timetables/other-departments');
            setOtherTimetables(response.data);
        } catch (error) {
            console.error('Failed to fetch other timetables:', error);
        }
    };

    // Filter lectures for the currently selected class
    const getClassLectures = () => {
        return lectures.filter(l => l.classId?._id === selectedClass);
    };

    const handleLectureChange = (lectureId) => {
        if (lectureId === '__blank__') {
            setFormData({
                ...formData,
                lectureId: '__blank__',
                classId: selectedClass,
                subject: 'No Lecture',
                teacherId: '',
                type: 'blank',
                timeSlotIds: [],
                timeSlotId: formData.timeSlotId
            });
            return;
        }
        if (lectureId) {
            const lecture = lectures.find(l => l._id === lectureId);
            if (lecture) {
                setFormData({
                    ...formData,
                    lectureId: lectureId,
                    classId: lecture.classId?._id || selectedClass,
                    subject: lecture.subjectId?.name || '',
                    teacherId: lecture.teacherId?._id || '',
                    type: lecture.type || 'lecture',
                    timeSlotIds: [],
                    timeSlotId: formData.timeSlotId
                });
                return;
            }
        }
        // Reset if no lecture selected
        setFormData({
            ...formData,
            lectureId: '',
            subject: '',
            teacherId: '',
            type: 'lecture',
            timeSlotIds: [],
            timeSlotId: formData.timeSlotId
        });
    };

    const handleTimeSlotSelection = (slotId) => {
        setFormData({
            ...formData,
            timeSlotId: slotId,
            timeSlotIds: []
        });
    };

    const openAddModal = (day = 'Monday', slotId = '') => {
        setEditingEntry(null);
        setFormData({
            lectureId: '',
            classId: selectedClass,
            subject: '',
            teacherId: '',
            day: day,
            timeSlotId: slotId,
            timeSlotIds: [],
            roomId: '',
            type: 'lecture',
            batchId: ''
        });
        setShowModal(true);
    };

    const handleEdit = (entry) => {
        setEditingEntry(entry);
        setFormData({
            lectureId: entry.lectureId?._id || '',
            classId: entry.classId?._id || selectedClass,
            subject: entry.subject,
            teacherId: entry.teacherId?._id || '',
            day: entry.day,
            timeSlotId: entry.timeSlotId?._id || '',
            timeSlotIds: entry.timeSlotIds?.map(s => s._id) || [],
            roomId: entry.roomId?._id || '',
            type: entry.type,
            batchId: entry.batchId || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this timetable entry?')) return;
        try {
            await api.delete(`/hod/timetables/${id}`);
            fetchTimetables();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const submitData = {
                classId: formData.classId,
                subject: formData.subject,
                teacherId: formData.teacherId || undefined,
                day: formData.day,
                timeSlotId: formData.timeSlotId,
                timeSlotIds: [],
                roomId: formData.roomId || undefined,
                type: formData.type,
                batchId: formData.batchId || null,
                lectureId: formData.lectureId === '__blank__' ? undefined : (formData.lectureId || undefined)
            };

            if (editingEntry) {
                await api.put(`/hod/timetables/${editingEntry._id}`, submitData);
            } else {
                await api.post('/hod/timetables', submitData);
            }
            setShowModal(false);
            fetchTimetables();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to save');
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setUploadResult(null);

        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        try {
            const response = await api.post('/hod/timetables/bulk-upload', uploadFormData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setUploadResult(response.data);
            fetchTimetables();
        } catch (error) {
            setUploadResult({ error: error.response?.data?.message || 'Upload failed' });
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const downloadTemplate = () => {
        const template = 'className,subject,teacherUsername,day,timeSlotName,roomName,type\nCS-A,Mathematics,prof.smith,Monday,9:00-10:00,Room 101,lecture\n';
        const blob = new Blob([template], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'timetable_upload_template.csv';
        a.click();
    };

    const toggleOtherDepts = () => {
        if (!showOtherDepts) {
            fetchOtherDeptTimetables();
        }
        setShowOtherDepts(!showOtherDepts);
    };

    // Get all entries for a specific day and slot (including batch entries)
    const getEntriesForSlot = (day, slotId) => {
        return timetables.filter(t => {
            const matchesDay = t.day === day;
            const matchesSlot = t.timeSlotId?._id === slotId ||
                t.timeSlotIds?.some(s => s._id === slotId);
            return matchesDay && matchesSlot;
        });
    };

    // Check if a slot is part of a merged practical
    const isSlotMerged = (day, slotId, slotIndex) => {
        const entries = timetables.filter(t => {
            if (t.day !== day || t.type !== 'practical') return false;
            if (!t.timeSlotIds || t.timeSlotIds.length <= 1) return false;
            return t.timeSlotIds.some(s => s._id === slotId);
        });

        if (entries.length === 0) return { merged: false };

        const entry = entries[0];
        const slotIds = entry.timeSlotIds.map(s => s._id);

        return {
            merged: true,
            isFirst: slotIds[0] === slotId,
            rowSpan: slotIds.length,
            entry
        };
    };

    // Get the batch name
    const getBatchName = (batchId) => {
        const batch = batches.find(b => b._id === batchId);
        return batch ? batch.name : 'Entire Class';
    };

    // Check if more batches can be added to a slot
    const canAddMoreBatches = (entries) => {
        if (entries.length === 0) return false;
        // If any entry is for the entire class (no batchId), no more can be added
        if (entries.some(e => !e.batchId)) return false;
        // Check if there are batches not yet assigned in this slot
        const assignedBatchIds = entries.map(e => e.batchId?.toString?.() || e.batchId);
        const availableBatches = batches.filter(b => !assignedBatchIds.includes(b._id?.toString?.() || b._id));
        return availableBatches.length > 0;
    };

    // Filter non-break time slots
    const lectureSlots = timeSlots.filter(s => s.type !== 'break').sort((a, b) => a.order - b.order);

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
                                    {cls.name} (Year {cls.year})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="header-actions">
                        <button className="btn btn-secondary" onClick={toggleOtherDepts}>
                            {showOtherDepts ? '📖 Hide Other Depts' : '👁️ View Other Depts'}
                        </button>
                        <button className="btn btn-secondary" onClick={() => setShowUploadModal(true)}>
                            📤 Bulk Upload
                        </button>
                        <button className="btn btn-primary" onClick={() => openAddModal()}>
                            ➕ Add Entry
                        </button>
                    </div>
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
                                {lectureSlots.map((slot, slotIndex) => (
                                    <tr key={slot._id}>
                                        <td style={{ fontWeight: '500', fontSize: '13px' }}>
                                            {slot.startTime}<br />
                                            <span style={{ color: 'var(--gray-500)' }}>{slot.endTime}</span>
                                        </td>
                                        {days.map(day => {
                                            const entries = getEntriesForSlot(day, slot._id);
                                            const mergeInfo = isSlotMerged(day, slot._id, slotIndex);

                                            // Skip cells that are part of a merged practical (not the first)
                                            if (mergeInfo.merged && !mergeInfo.isFirst) {
                                                return null;
                                            }

                                            return (
                                                <td
                                                    key={day}
                                                    style={{ padding: '8px', verticalAlign: 'top' }}
                                                    rowSpan={mergeInfo.merged ? mergeInfo.rowSpan : 1}
                                                >
                                                    {entries.length > 0 ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                            {entries.map(entry => (
                                                                <div
                                                                    key={entry._id}
                                                                    style={{
                                                                        background: entry.type === 'practical'
                                                                            ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(14, 165, 233, 0.05))'
                                                                            : 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(99, 102, 241, 0.05))',
                                                                        padding: '8px',
                                                                        borderRadius: '8px',
                                                                        fontSize: '12px',
                                                                        cursor: 'pointer',
                                                                        border: entry.type === 'practical'
                                                                            ? '1px solid rgba(14, 165, 233, 0.3)'
                                                                            : '1px solid rgba(99, 102, 241, 0.3)',
                                                                        minHeight: mergeInfo.merged ? `${mergeInfo.rowSpan * 60}px` : 'auto'
                                                                    }}
                                                                    onClick={() => handleEdit(entry)}
                                                                >
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                                        <div>
                                                                            <strong>{entry.subject}</strong>
                                                                            {entry.batchId && (
                                                                                <span style={{
                                                                                    fontSize: '10px',
                                                                                    background: 'var(--warning)',
                                                                                    color: '#fff',
                                                                                    padding: '1px 4px',
                                                                                    borderRadius: '4px',
                                                                                    marginLeft: '4px'
                                                                                }}>
                                                                                    {getBatchName(entry.batchId)}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <button
                                                                            className="btn-icon"
                                                                            style={{ padding: '2px' }}
                                                                            onClick={(e) => { e.stopPropagation(); handleDelete(entry._id); }}
                                                                        >🗑️</button>
                                                                    </div>
                                                                    <span style={{ color: 'var(--gray-600)' }}>{entry.teacherId?.fullName}</span><br />
                                                                    <span style={{ color: 'var(--gray-500)' }}>{entry.roomId?.roomNumber || entry.roomId?.name}</span>
                                                                    {entry.type === 'practical' && (
                                                                        <div style={{
                                                                            marginTop: '4px',
                                                                            fontSize: '10px',
                                                                            color: 'var(--info)',
                                                                            fontWeight: '500'
                                                                        }}>
                                                                            🔬 Practical
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                            {canAddMoreBatches(entries) && (
                                                                <button
                                                                    style={{
                                                                        width: '100%',
                                                                        padding: '6px',
                                                                        background: 'rgba(34, 197, 94, 0.1)',
                                                                        border: '1px dashed rgba(34, 197, 94, 0.5)',
                                                                        borderRadius: '6px',
                                                                        cursor: 'pointer',
                                                                        color: 'var(--success, #22c55e)',
                                                                        fontSize: '11px',
                                                                        fontWeight: '500',
                                                                        marginTop: '2px'
                                                                    }}
                                                                    onClick={() => openAddModal(day, slot._id)}
                                                                >
                                                                    + Add Batch
                                                                </button>
                                                            )}
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

                {/* Other Departments Section */}
                {showOtherDepts && (
                    <div style={{ marginTop: '24px' }}>
                        <h3 style={{ marginBottom: '16px', color: 'var(--gray-700)' }}>Other Departments (Read-Only)</h3>
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Department</th>
                                        <th>Class</th>
                                        <th>Day</th>
                                        <th>Time</th>
                                        <th>Subject</th>
                                        <th>Teacher</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {otherTimetables.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: 'center', color: 'var(--gray-500)' }}>
                                                No data from other departments
                                            </td>
                                        </tr>
                                    ) : (
                                        otherTimetables.map(entry => (
                                            <tr key={entry._id}>
                                                <td>{entry.classId?.departmentId?.name || '-'}</td>
                                                <td>{entry.classId?.name}</td>
                                                <td>{entry.day}</td>
                                                <td>{entry.timeSlotId?.name}</td>
                                                <td>{entry.subject}</td>
                                                <td>{entry.teacherId?.fullName}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingEntry ? 'Edit Timetable Entry' : 'Add Timetable Entry'}
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleSubmit}>
                            {editingEntry ? 'Update' : 'Create'}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Select Lecture *</label>
                        <select
                            value={formData.lectureId}
                            onChange={(e) => handleLectureChange(e.target.value)}
                        >
                            <option value="">Select a Lecture</option>
                            <option value="__blank__">— No Lecture (Blank Slot) —</option>
                            {getClassLectures().map(lecture => (
                                <option key={lecture._id} value={lecture._id}>
                                    {lecture.subjectId?.name} - {lecture.teacherId?.fullName} ({lecture.type})
                                </option>
                            ))}
                        </select>
                        <small style={{ color: 'var(--gray-500)', marginTop: '4px', display: 'block' }}>
                            Lectures are created in the Lectures section. Select one to schedule, or choose "No Lecture" for a blank slot.
                        </small>
                    </div>

                    {formData.lectureId && formData.lectureId !== '__blank__' && (
                        <div style={{
                            background: 'var(--gray-50)',
                            padding: '12px',
                            borderRadius: '8px',
                            marginBottom: '16px',
                            fontSize: '14px'
                        }}>
                            <strong>Selected Lecture Details:</strong><br />
                            <span>Subject: {formData.subject}</span><br />
                            <span>Type: {formData.type === 'lecture' ? '📚 Lecture' : '🔬 Practical'}</span>
                        </div>
                    )}

                    {formData.lectureId === '__blank__' && (
                        <div style={{
                            background: 'rgba(245, 158, 11, 0.1)',
                            padding: '12px',
                            borderRadius: '8px',
                            marginBottom: '16px',
                            fontSize: '14px',
                            color: '#b45309'
                        }}>
                            ⚠️ This will create a blank slot — no lecture, no teacher assigned.
                        </div>
                    )}

                    {/* Batch Selection */}
                    {batches.length > 0 && formData.lectureId && formData.lectureId !== '__blank__' && (
                        <div className="form-group">
                            <label className="form-label">Assign To</label>
                            <select
                                value={formData.batchId}
                                onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                            >
                                <option value="">Entire Class</option>
                                {batches.map(batch => (
                                    <option key={batch._id} value={batch._id}>
                                        {batch.name} ({batch.studentIds?.length || 0} students)
                                    </option>
                                ))}
                            </select>
                            <small style={{ color: 'var(--gray-500)', marginTop: '4px', display: 'block' }}>
                                {formData.batchId
                                    ? 'You can schedule different subjects for other batches at the same time.'
                                    : 'This lecture will be for the entire class.'}
                            </small>
                        </div>
                    )}

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
                                onChange={(e) => handleTimeSlotSelection(e.target.value)}
                                required
                            >
                                <option value="">Select Slot</option>
                                {lectureSlots.map(slot => (
                                    <option key={slot._id} value={slot._id}>
                                        {slot.label || slot.name} ({slot.startTime} - {slot.endTime})
                                    </option>
                                ))}
                            </select>
                        </div>
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
                                    {r.roomNumber || r.name} ({r.roomType || r.type})
                                </option>
                            ))}
                        </select>
                    </div>
                </form>
            </Modal>

            {/* Bulk Upload Modal */}
            <Modal
                isOpen={showUploadModal}
                onClose={() => { setShowUploadModal(false); setUploadResult(null); }}
                title="Bulk Timetable Upload"
            >
                <div className="upload-section">
                    <p style={{ marginBottom: '16px', color: 'var(--gray-600)' }}>
                        Upload CSV with columns: className, subject, teacherUsername, day, timeSlotName, roomName, type
                    </p>
                    <button className="btn btn-secondary" onClick={downloadTemplate} style={{ marginBottom: '16px' }}>
                        📥 Download Template
                    </button>
                    <div className="file-upload-area">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileUpload}
                            style={{ display: 'none' }}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                        >
                            {uploading ? 'Uploading...' : '📤 Select File & Upload'}
                        </button>
                    </div>
                    {uploadResult && (
                        <div className="upload-result" style={{ marginTop: '20px' }}>
                            {uploadResult.error ? (
                                <div className="error-message">{uploadResult.error}</div>
                            ) : (
                                <div className="result-summary">
                                    <div className="result-item success">
                                        <span className="result-count">{uploadResult.successCount}</span>
                                        <span>Success</span>
                                    </div>
                                    <div className="result-item danger">
                                        <span className="result-count">{uploadResult.failedCount}</span>
                                        <span>Failed</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default HodTimetable;
