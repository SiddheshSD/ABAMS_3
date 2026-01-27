import { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';

const Lectures = () => {
    const [lectures, setLectures] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deptFilter, setDeptFilter] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingLecture, setEditingLecture] = useState(null);

    const [formData, setFormData] = useState({
        subjectId: '', teacherId: '', classId: '', type: 'lecture', departmentId: '', year: ''
    });

    useEffect(() => { fetchData(); }, []);
    useEffect(() => { if (formData.departmentId) fetchDeptData(formData.departmentId); }, [formData.departmentId]);

    const fetchData = async () => {
        try {
            const [lecturesRes, deptsRes] = await Promise.all([
                api.get('/lectures'),
                api.get('/departments')
            ]);
            setLectures(lecturesRes.data);
            setDepartments(deptsRes.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDeptData = async (deptId) => {
        try {
            const [subjectsRes, teachersRes, classesRes] = await Promise.all([
                api.get(`/subjects?departmentId=${deptId}`),
                api.get('/teachers'),
                api.get(`/classes?departmentId=${deptId}`)
            ]);
            setSubjects(subjectsRes.data);
            setTeachers(teachersRes.data.filter(t => t.departmentId?._id === deptId));
            setClasses(classesRes.data);
        } catch (error) {
            console.error('Failed to fetch department data:', error);
        }
    };

    // Filter subjects and classes by selected year
    const filteredSubjects = subjects.filter(s => !formData.year || s.year === parseInt(formData.year));
    const filteredClasses = classes.filter(c => !formData.year || c.year === parseInt(formData.year));

    const filteredLectures = lectures.filter((l) => {
        return !deptFilter || l.departmentId?._id === deptFilter;
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData };
            delete payload.year; // Don't send year to backend, it's just for filtering
            if (editingLecture) {
                await api.put(`/lectures/${editingLecture._id}`, payload);
            } else {
                await api.post('/lectures', payload);
            }
            fetchData();
            closeModal();
        } catch (error) {
            alert(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleEdit = (lecture) => {
        setEditingLecture(lecture);
        setFormData({
            subjectId: lecture.subjectId?._id || '',
            teacherId: lecture.teacherId?._id || '',
            classId: lecture.classId?._id || '',
            type: lecture.type || 'lecture',
            departmentId: lecture.departmentId?._id || '',
            year: lecture.classId?.year || ''
        });
        setModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this lecture assignment?')) return;
        try {
            await api.delete(`/lectures/${id}`);
            fetchData();
        } catch (error) {
            alert('Delete failed');
        }
    };

    const openAddModal = () => {
        setEditingLecture(null);
        setFormData({ subjectId: '', teacherId: '', classId: '', type: 'lecture', departmentId: '', year: '' });
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingLecture(null);
    };

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div>
            <div className="card">
                <div className="toolbar">
                    <h3>📖 Lecture Assignments</h3>
                    <div className="filter-group">
                        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
                            <option value="">All Departments</option>
                            {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                        </select>
                        <button className="btn btn-primary" onClick={openAddModal}>➕ Add Lecture</button>
                    </div>
                </div>

                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Subject</th>
                                <th>Teacher</th>
                                <th>Class</th>
                                <th>Year</th>
                                <th>Type</th>
                                <th>Department</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLectures.map((lecture) => (
                                <tr key={lecture._id}>
                                    <td><strong>{lecture.subjectId?.name}</strong> <span style={{ color: 'var(--gray-500)', fontSize: '12px' }}>({lecture.subjectId?.code})</span></td>
                                    <td>{lecture.teacherId?.fullName || '-'}</td>
                                    <td>{lecture.classId?.name || '-'}</td>
                                    <td><span className="badge badge-info">Year {lecture.classId?.year || '-'}</span></td>
                                    <td><span className={`badge ${lecture.type === 'practical' ? 'badge-warning' : 'badge-primary'}`}>{lecture.type}</span></td>
                                    <td>{lecture.departmentId?.name || '-'}</td>
                                    <td>
                                        <div className="actions-cell">
                                            <button className="btn-icon" onClick={() => handleEdit(lecture)} title="Edit">✏️</button>
                                            <button className="btn-icon" onClick={() => handleDelete(lecture._id)} title="Delete">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredLectures.length === 0 && (
                        <div className="empty-state">
                            <div className="empty-icon">📖</div>
                            <h3>No lectures found</h3>
                            <p>Create lecture assignments to link subjects, teachers, and classes</p>
                        </div>
                    )}
                </div>
            </div>

            <Modal isOpen={modalOpen} onClose={closeModal} title={editingLecture ? 'Edit Lecture' : 'Add New Lecture'}
                footer={<><button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSubmit}>{editingLecture ? 'Update' : 'Create'}</button></>}>
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Department *</label>
                            <select value={formData.departmentId} onChange={(e) => setFormData({ ...formData, departmentId: e.target.value, year: '', subjectId: '', classId: '' })} required>
                                <option value="">Select Department</option>
                                {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Year *</label>
                            <select value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value, subjectId: '', classId: '' })} required disabled={!formData.departmentId}>
                                <option value="">Select Year</option>
                                <option value="1">1st Year</option>
                                <option value="2">2nd Year</option>
                                <option value="3">3rd Year</option>
                                <option value="4">4th Year</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Subject *</label>
                            <select value={formData.subjectId} onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })} required disabled={!formData.year}>
                                <option value="">Select Subject</option>
                                {filteredSubjects.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Class *</label>
                            <select value={formData.classId} onChange={(e) => setFormData({ ...formData, classId: e.target.value })} required disabled={!formData.year}>
                                <option value="">Select Class</option>
                                {filteredClasses.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Teacher *</label>
                            <select value={formData.teacherId} onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })} required disabled={!formData.departmentId}>
                                <option value="">Select Teacher</option>
                                {teachers.map((t) => <option key={t._id} value={t._id}>{t.fullName}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Type *</label>
                            <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} required>
                                <option value="lecture">Lecture</option>
                                <option value="practical">Practical</option>
                            </select>
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Lectures;
