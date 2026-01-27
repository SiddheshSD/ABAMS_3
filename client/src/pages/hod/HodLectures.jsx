import { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';

const HodLectures = () => {
    const [lectures, setLectures] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingLecture, setEditingLecture] = useState(null);
    const [formData, setFormData] = useState({
        subjectId: '',
        teacherId: '',
        classId: '',
        type: 'lecture',
        year: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [lecturesRes, subjectsRes, teachersRes, classesRes] = await Promise.all([
                api.get('/hod/lectures'),
                api.get('/subjects'),
                api.get('/hod/teachers'),
                api.get('/hod/classes')
            ]);
            setLectures(lecturesRes.data);
            setSubjects(subjectsRes.data);
            setTeachers(teachersRes.data);
            setClasses(classesRes.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter subjects and classes by selected year
    const filteredSubjects = subjects.filter(s => !formData.year || s.year === parseInt(formData.year));
    const filteredClasses = classes.filter(c => !formData.year || c.year === parseInt(formData.year));

    const openAddModal = () => {
        setEditingLecture(null);
        setFormData({
            subjectId: '',
            teacherId: '',
            classId: '',
            type: 'lecture',
            year: ''
        });
        setShowModal(true);
    };

    const openEditModal = (lecture) => {
        setEditingLecture(lecture);
        setFormData({
            subjectId: lecture.subjectId?._id || '',
            teacherId: lecture.teacherId?._id || '',
            classId: lecture.classId?._id || '',
            type: lecture.type,
            year: lecture.classId?.year || ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData };
            delete payload.year; // Don't send year to backend
            if (editingLecture) {
                await api.put(`/hod/lectures/${editingLecture._id}`, payload);
            } else {
                await api.post('/hod/lectures', payload);
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this lecture?')) return;
        try {
            await api.delete(`/hod/lectures/${id}`);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Delete failed');
        }
    };

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    return (
        <div>
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Lecture Management</h2>
                    <button className="btn btn-primary" onClick={openAddModal}>
                        ➕ Add Lecture
                    </button>
                </div>

                {lectures.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📖</div>
                        <h3>No lectures created yet</h3>
                        <p>Create lecture assignments by selecting subject, teacher, class, and type</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Subject</th>
                                    <th>Teacher</th>
                                    <th>Class</th>
                                    <th>Type</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lectures.map((lecture) => (
                                    <tr key={lecture._id}>
                                        <td>
                                            <div>
                                                <strong>{lecture.subjectId?.name}</strong>
                                                <br />
                                                <small style={{ color: 'var(--gray-500)' }}>
                                                    {lecture.subjectId?.code}
                                                </small>
                                            </div>
                                        </td>
                                        <td>{lecture.teacherId?.fullName}</td>
                                        <td>
                                            {lecture.classId?.name}
                                            <br />
                                            <small style={{ color: 'var(--gray-500)' }}>
                                                Year {lecture.classId?.year}
                                            </small>
                                        </td>
                                        <td>
                                            <span className={`badge ${lecture.type === 'lecture' ? 'badge-primary' : 'badge-info'}`}>
                                                {lecture.type === 'lecture' ? '📚 Lecture' : '🔬 Practical'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="btn-icon"
                                                    onClick={() => openEditModal(lecture)}
                                                    title="Edit"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    className="btn-icon danger"
                                                    onClick={() => handleDelete(lecture._id)}
                                                    title="Delete"
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
                )}
            </div>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingLecture ? 'Edit Lecture' : 'Add Lecture'}
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                            Cancel
                        </button>
                        <button className="btn btn-primary" onClick={handleSubmit}>
                            {editingLecture ? 'Update' : 'Create'}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Year *</label>
                        <select
                            value={formData.year}
                            onChange={(e) => setFormData({ ...formData, year: e.target.value, subjectId: '', classId: '' })}
                            required
                        >
                            <option value="">Select Year</option>
                            <option value="1">1st Year</option>
                            <option value="2">2nd Year</option>
                            <option value="3">3rd Year</option>
                            <option value="4">4th Year</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Subject *</label>
                        <select
                            value={formData.subjectId}
                            onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                            required
                            disabled={!formData.year}
                        >
                            <option value="">Select Subject</option>
                            {filteredSubjects.map((subject) => (
                                <option key={subject._id} value={subject._id}>
                                    {subject.name} ({subject.code})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Teacher *</label>
                        <select
                            value={formData.teacherId}
                            onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                            required
                        >
                            <option value="">Select Teacher</option>
                            {teachers.map((teacher) => (
                                <option key={teacher._id} value={teacher._id}>
                                    {teacher.fullName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Class *</label>
                        <select
                            value={formData.classId}
                            onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                            required
                            disabled={!formData.year}
                        >
                            <option value="">Select Class</option>
                            {filteredClasses.map((cls) => (
                                <option key={cls._id} value={cls._id}>
                                    {cls.name} (Year {cls.year})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Type *</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            required
                        >
                            <option value="lecture">📚 Lecture</option>
                            <option value="practical">🔬 Practical</option>
                        </select>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default HodLectures;
