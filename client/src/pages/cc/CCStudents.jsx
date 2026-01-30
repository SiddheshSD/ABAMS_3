import { useState, useEffect } from 'react';
import api from '../../services/api';

const CCStudents = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await api.get('/cc/students');
            setStudents(response.data);
        } catch (error) {
            console.error('Failed to fetch students:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(student =>
        student.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                    <h2 className="card-title">👨‍🎓 Class Students</h2>
                    <div className="header-actions">
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', width: '200px' }}
                        />
                    </div>
                </div>

                <div className="info-bar" style={{ padding: '12px 16px', background: 'var(--primary-light)', borderRadius: '8px', marginBottom: '16px' }}>
                    <span>📋 Total Students: <strong>{students.length}</strong></span>
                </div>

                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Roll No</th>
                                <th>Name</th>
                                <th>Department</th>
                                <th>Class</th>
                                <th>Contact</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map((student, index) => (
                                <tr key={student._id}>
                                    <td>{index + 1}</td>
                                    <td>
                                        <span style={{ fontFamily: 'monospace', fontWeight: '500' }}>
                                            {student.username}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: '500' }}>
                                            {student.fullName || `${student.firstName} ${student.lastName}`}
                                        </div>
                                    </td>
                                    <td>{student.departmentId?.name || 'N/A'}</td>
                                    <td>
                                        <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                                            {student.classId?.name || 'N/A'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '13px' }}>
                                            {student.phone && <div>📞 {student.phone}</div>}
                                            {student.email && <div>✉️ {student.email}</div>}
                                            {!student.phone && !student.email && <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredStudents.length === 0 && (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        {searchTerm ? 'No students found matching your search' : 'No students in this class'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CCStudents;
