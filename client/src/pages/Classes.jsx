import { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';

const Classes = () => {
    const [classes, setClasses] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [coordinators, setCoordinators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingClass, setEditingClass] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        year: 1,
        departmentId: '',
        coordinatorId: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [classesRes, deptsRes, usersRes] = await Promise.all([
                api.get('/classes'),
                api.get('/departments'),
                api.get('/users?role=teacher') // Fetch teachers to assign as coordinators
            ]);
            setClasses(classesRes.data);
            setDepartments(deptsRes.data);
            setCoordinators(usersRes.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingClass) {
                await api.put(`/classes/${editingClass._id}`, formData);
            } else {
                await api.post('/classes', formData);
            }
            fetchData();
            closeModal();
        } catch (error) {
            alert(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleEdit = (cls) => {
        setEditingClass(cls);
        setFormData({
            name: cls.name,
            year: cls.year,
            departmentId: cls.departmentId?._id || '',
            coordinatorId: cls.coordinatorId?._id || ''
        });
        setModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this class?')) return;
        try {
            await api.delete(`/classes/${id}`);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Delete failed');
        }
    };

    const openAddModal = () => {
        setEditingClass(null);
        setFormData({ name: '', year: 1, departmentId: '', coordinatorId: '' });
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingClass(null);
    };

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    return (
        <div>
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Classes</h2>
                    <button className="btn btn-primary" onClick={openAddModal}>
                        ➕ Add Class
                    </button>
                </div>

                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Class Name</th>
                                <th>Year</th>
                                <th>Department</th>
                                <th>Coordinator</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {classes.map((cls) => (
                                <tr key={cls._id}>
                                    <td><strong>{cls.name}</strong></td>
                                    <td><span className="badge badge-primary">Year {cls.year}</span></td>
                                    <td>{cls.departmentId?.name || '-'}</td>
                                    <td>{cls.coordinatorId?.fullName || '-'}</td>
                                    <td>
                                        <div className="actions-cell">
                                            <button className="btn-icon" onClick={() => handleEdit(cls)} title="Edit">✏️</button>
                                            <button className="btn-icon" onClick={() => handleDelete(cls._id)} title="Delete">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {classes.length === 0 && (
                        <div className="empty-state">
                            <div className="empty-icon">📚</div>
                            <h3>No classes yet</h3>
                            <p>Create your first class to get started</p>
                        </div>
                    )}
                </div>
            </div>

            <Modal
                isOpen={modalOpen}
                onClose={closeModal}
                title={editingClass ? 'Edit Class' : 'Add Class'}
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleSubmit}>
                            {editingClass ? 'Update' : 'Create'}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Class Name *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., FY-CSE-A"
                            required
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Year *</label>
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
                            <label className="form-label">Department *</label>
                            <select
                                value={formData.departmentId}
                                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                                required
                            >
                                <option value="">Select Department</option>
                                {departments.map((dept) => (
                                    <option key={dept._id} value={dept._id}>{dept.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Class Coordinator</label>
                        <select
                            value={formData.coordinatorId}
                            onChange={(e) => setFormData({ ...formData, coordinatorId: e.target.value })}
                        >
                            <option value="">Select Coordinator</option>
                            {coordinators.map((coordinator) => (
                                <option key={coordinator._id} value={coordinator._id}>
                                    {coordinator.fullName || `${coordinator.firstName} ${coordinator.lastName}`}
                                </option>
                            ))}
                        </select>
                        {coordinators.length === 0 && (
                            <p style={{ fontSize: '12px', color: 'var(--warning)', marginTop: '4px' }}>
                                ⚠️ No teachers found. Add users with "Teacher" role first.
                            </p>
                        )}
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Classes;
