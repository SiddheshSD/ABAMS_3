import { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';

const HodClasses = () => {
    const [classes, setClasses] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingClass, setEditingClass] = useState(null);
    const [formData, setFormData] = useState({ name: '', year: 1, coordinatorId: '' });

    useEffect(() => {
        fetchClasses();
        fetchTeachers();
    }, []);

    const fetchClasses = async () => {
        try {
            setLoading(true);
            const response = await api.get('/hod/classes');
            setClasses(response.data);
        } catch (error) {
            console.error('Failed to fetch classes:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTeachers = async () => {
        try {
            const response = await api.get('/hod/teachers');
            setTeachers(response.data);
        } catch (error) {
            console.error('Failed to fetch teachers:', error);
        }
    };

    const handleCreate = () => {
        setEditingClass(null);
        setFormData({ name: '', year: 1, coordinatorId: '' });
        setShowModal(true);
    };

    const handleEdit = (cls) => {
        setEditingClass(cls);
        setFormData({
            name: cls.name,
            year: cls.year,
            coordinatorId: cls.coordinatorId?._id || ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingClass) {
                await api.put(`/hod/classes/${editingClass._id}`, formData);
            } else {
                await api.post('/hod/classes', formData);
            }
            setShowModal(false);
            fetchClasses();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to save class');
        }
    };

    return (
        <div>
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Class Management</h2>
                    <button className="btn btn-primary" onClick={handleCreate}>
                        ➕ Add Class
                    </button>
                </div>

                {loading ? (
                    <div className="loading"><div className="spinner"></div></div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Class Name</th>
                                    <th>Year</th>
                                    <th>Coordinator</th>
                                    <th>Total Students</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {classes.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="empty-state">
                                            <div className="empty-icon">📚</div>
                                            <h3>No classes found</h3>
                                        </td>
                                    </tr>
                                ) : (
                                    classes.map(cls => (
                                        <tr key={cls._id}>
                                            <td><strong>{cls.name}</strong></td>
                                            <td>{cls.year}{cls.year === 1 ? 'st' : cls.year === 2 ? 'nd' : cls.year === 3 ? 'rd' : 'th'} Year</td>
                                            <td>
                                                {cls.coordinatorId?.fullName || (
                                                    <span className="no-data">Not assigned</span>
                                                )}
                                            </td>
                                            <td>{cls.studentCount || 0}</td>
                                            <td>
                                                <button
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={() => handleEdit(cls)}
                                                >
                                                    ✏️ Edit
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingClass ? 'Edit Class' : 'Add New Class'}
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Class Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            placeholder="e.g., CS-A"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Year</label>
                        <select
                            value={formData.year}
                            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                        >
                            <option value={1}>1st Year</option>
                            <option value={2}>2nd Year</option>
                            <option value={3}>3rd Year</option>
                            <option value={4}>4th Year</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Class Coordinator</label>
                        <select
                            value={formData.coordinatorId}
                            onChange={(e) => setFormData({ ...formData, coordinatorId: e.target.value })}
                        >
                            <option value="">Select Coordinator (Optional)</option>
                            {teachers.map(teacher => (
                                <option key={teacher._id} value={teacher._id}>
                                    {teacher.fullName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {editingClass ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default HodClasses;
