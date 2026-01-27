import { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';

const Subjects = () => {
    const [subjects, setSubjects] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        type: 'theory',
        practicalName: '',
        practicalCode: '',
        year: 1,
        departmentId: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [subjectsRes, departmentsRes] = await Promise.all([
                api.get('/subjects'),
                api.get('/departments')
            ]);
            setSubjects(subjectsRes.data);
            setDepartments(departmentsRes.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setEditingSubject(null);
        setFormData({
            name: '',
            code: '',
            type: 'theory',
            practicalName: '',
            practicalCode: '',
            year: 1,
            departmentId: ''
        });
        setModalOpen(true);
    };

    const openEditModal = (subject) => {
        setEditingSubject(subject);
        setFormData({
            name: subject.name,
            code: subject.code,
            type: subject.type,
            practicalName: subject.practicalName || '',
            practicalCode: subject.practicalCode || '',
            year: subject.year || 1,
            departmentId: subject.departmentId?._id || ''
        });
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingSubject) {
                await api.put(`/subjects/${editingSubject._id}`, formData);
            } else {
                await api.post('/subjects', formData);
            }
            fetchData();
            setModalOpen(false);
        } catch (error) {
            alert(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this subject?')) return;
        try {
            await api.delete(`/subjects/${id}`);
            fetchData();
        } catch (error) {
            alert('Delete failed');
        }
    };

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    return (
        <div>
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Subjects Management</h2>
                    <button className="btn btn-primary" onClick={openAddModal}>
                        ➕ Add Subject
                    </button>
                </div>

                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Subject Name</th>
                                <th>Code</th>
                                <th>Year</th>
                                <th>Type</th>
                                <th>Practical Name</th>
                                <th>Practical Code</th>
                                <th>Department</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subjects.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="empty-state">
                                        <div className="empty-icon">📖</div>
                                        <h3>No subjects found</h3>
                                        <p>Add subjects to get started</p>
                                    </td>
                                </tr>
                            ) : (
                                subjects.map((subject) => (
                                    <tr key={subject._id}>
                                        <td><strong>{subject.name}</strong></td>
                                        <td>
                                            <span className="badge badge-primary">{subject.code}</span>
                                        </td>
                                        <td>
                                            <span className="badge badge-info">Year {subject.year}</span>
                                        </td>
                                        <td>
                                            <span className={`badge ${subject.type === 'practical' ? 'badge-warning' : 'badge-success'}`}>
                                                {subject.type}
                                            </span>
                                        </td>
                                        <td>{subject.practicalName || '-'}</td>
                                        <td>
                                            {subject.practicalCode ? (
                                                <span className="badge badge-warning">{subject.practicalCode}</span>
                                            ) : '-'}
                                        </td>
                                        <td>{subject.departmentId?.name || 'All Departments'}</td>
                                        <td className="actions-cell">
                                            <button
                                                className="btn btn-sm btn-secondary"
                                                onClick={() => openEditModal(subject)}
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() => handleDelete(subject._id)}
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingSubject ? 'Edit Subject' : 'Add New Subject'}
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Subject Name *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Data Structures"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Subject Code *</label>
                            <input
                                type="text"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                placeholder="e.g., CS301"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Year *</label>
                            <select
                                value={formData.year}
                                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                                required
                            >
                                <option value={1}>1st Year</option>
                                <option value={2}>2nd Year</option>
                                <option value={3}>3rd Year</option>
                                <option value={4}>4th Year</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Type</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="theory">Theory</option>
                                <option value="practical">Practical</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Department (Optional)</label>
                        <select
                            value={formData.departmentId}
                            onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                        >
                            <option value="">All Departments</option>
                            {departments.map((dept) => (
                                <option key={dept._id} value={dept._id}>{dept.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Practical Name (if applicable)</label>
                            <input
                                type="text"
                                value={formData.practicalName}
                                onChange={(e) => setFormData({ ...formData, practicalName: e.target.value })}
                                placeholder="e.g., DS Lab"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Practical Code</label>
                            <input
                                type="text"
                                value={formData.practicalCode}
                                onChange={(e) => setFormData({ ...formData, practicalCode: e.target.value.toUpperCase() })}
                                placeholder="e.g., CS301P"
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {editingSubject ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Subjects;
