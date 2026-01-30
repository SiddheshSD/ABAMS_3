import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const TeacherTestSheet = () => {
    const { classId, subject } = useParams();
    const navigate = useNavigate();
    const decodedSubject = decodeURIComponent(subject);

    const [classInfo, setClassInfo] = useState(null);
    const [students, setStudents] = useState([]);
    const [tests, setTests] = useState([]);
    const [testTypes, setTestTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // New test form state
    const [showNewForm, setShowNewForm] = useState(false);
    const [newTest, setNewTest] = useState({
        testType: '',
        date: new Date().toISOString().split('T')[0],
        maxScore: 20,
        marks: []
    });

    // Edit mode state
    const [editingTest, setEditingTest] = useState(null);
    const [editMarks, setEditMarks] = useState([]);

    useEffect(() => {
        fetchData();
    }, [classId, subject]);

    const fetchData = async () => {
        try {
            const [sheetResponse, testTypesResponse] = await Promise.all([
                api.get(`/teacher/tests/${classId}/${encodeURIComponent(decodedSubject)}`),
                api.get('/teacher/test-types')
            ]);

            setClassInfo(sheetResponse.data.classInfo);
            setStudents(sheetResponse.data.students);
            setTests(sheetResponse.data.tests);
            setTestTypes(testTypesResponse.data);

            // Initialize new test marks with null scores
            const initialMarks = sheetResponse.data.students.map(s => ({
                studentId: s._id,
                score: null
            }));
            setNewTest(prev => ({ ...prev, marks: initialMarks }));

            // Set default test type
            if (testTypesResponse.data.length > 0) {
                setNewTest(prev => ({ ...prev, testType: testTypesResponse.data[0].name }));
            }
        } catch (error) {
            console.error('Failed to fetch test sheet:', error);
            setMessage({ type: 'error', text: 'Failed to load test data' });
        } finally {
            setLoading(false);
        }
    };

    const handleMarkChange = (studentId, score, isNew = true) => {
        const numScore = score === '' ? null : parseFloat(score);

        if (isNew) {
            setNewTest(prev => ({
                ...prev,
                marks: prev.marks.map(m =>
                    m.studentId === studentId ? { ...m, score: numScore } : m
                )
            }));
        } else {
            setEditMarks(prev =>
                prev.map(m =>
                    (m.studentId === studentId || m.studentId?._id === studentId)
                        ? { ...m, score: numScore }
                        : m
                )
            );
        }
    };

    const handleSaveNew = async () => {
        if (!newTest.testType) {
            setMessage({ type: 'error', text: 'Please select a test type' });
            return;
        }

        if (!newTest.maxScore || newTest.maxScore <= 0) {
            setMessage({ type: 'error', text: 'Please enter a valid max score' });
            return;
        }

        // Validate marks
        for (const mark of newTest.marks) {
            if (mark.score !== null && mark.score > newTest.maxScore) {
                setMessage({ type: 'error', text: `Score cannot exceed max score of ${newTest.maxScore}` });
                return;
            }
        }

        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            await api.post('/teacher/tests', {
                classId,
                subject: decodedSubject,
                testType: newTest.testType,
                date: newTest.date,
                maxScore: newTest.maxScore,
                marks: newTest.marks
            });

            setMessage({ type: 'success', text: 'Test saved successfully!' });
            setShowNewForm(false);
            fetchData();
        } catch (error) {
            console.error('Failed to save test:', error);
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save test' });
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (test) => {
        setEditingTest(test);
        // Ensure all students have marks (fill missing with null)
        // Use string IDs for consistent comparison
        const existingMarks = new Map(
            test.marks.map(m => [
                (m.studentId?._id || m.studentId)?.toString(),
                m.score
            ])
        );
        const allMarks = students.map(s => ({
            studentId: s._id,
            score: existingMarks.has(s._id?.toString()) ? existingMarks.get(s._id?.toString()) : null
        }));
        setEditMarks(allMarks);
    };

    const handleSaveEdit = async () => {
        // Validate marks
        for (const mark of editMarks) {
            if (mark.score !== null && mark.score > editingTest.maxScore) {
                setMessage({ type: 'error', text: `Score cannot exceed max score of ${editingTest.maxScore}` });
                return;
            }
        }

        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            await api.put(`/teacher/tests/${editingTest._id}`, {
                marks: editMarks.map(m => ({
                    studentId: m.studentId?._id || m.studentId,
                    score: m.score
                }))
            });

            setMessage({ type: 'success', text: 'Test updated successfully!' });
            setEditingTest(null);
            fetchData();
        } catch (error) {
            console.error('Failed to update test:', error);
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update test' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this test record?')) return;

        try {
            await api.delete(`/teacher/tests/${id}`);
            setMessage({ type: 'success', text: 'Test deleted successfully!' });
            fetchData();
        } catch (error) {
            console.error('Failed to delete test:', error);
            setMessage({ type: 'error', text: 'Failed to delete test' });
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getStudentScore = (marks, studentId) => {
        const mark = marks.find(m => (m.studentId?._id || m.studentId) === studentId);
        return mark?.score ?? '';
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
                            onClick={() => navigate('/teacher/tests')}
                            style={{ marginBottom: '8px' }}
                        >
                            ← Back to Tests
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
                        + Create New Test
                    </button>
                </div>
            </div>

            {/* Messages */}
            {message.text && (
                <div className={`alert alert-${message.type}`} style={{ marginBottom: '24px' }}>
                    {message.text}
                </div>
            )}

            {/* New Test Form */}
            {showNewForm && (
                <div className="card" style={{ marginBottom: '24px' }}>
                    <div className="card-header">
                        <h3 className="card-title">📝 Create New Test</h3>
                    </div>
                    <div style={{ padding: '0 24px 24px' }}>
                        <div className="form-row" style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                            <div className="form-group" style={{ flex: '1', minWidth: '150px' }}>
                                <label className="form-label">Test Type</label>
                                <select
                                    className="form-input"
                                    value={newTest.testType}
                                    onChange={(e) => setNewTest(prev => ({ ...prev, testType: e.target.value }))}
                                >
                                    <option value="">Select Test Type</option>
                                    {testTypes.map(type => (
                                        <option key={type._id} value={type.name}>
                                            {type.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group" style={{ flex: '1', minWidth: '150px' }}>
                                <label className="form-label">Date</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={newTest.date}
                                    onChange={(e) => setNewTest(prev => ({ ...prev, date: e.target.value }))}
                                />
                            </div>
                            <div className="form-group" style={{ flex: '1', minWidth: '120px' }}>
                                <label className="form-label">Max Score</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={newTest.maxScore}
                                    onChange={(e) => setNewTest(prev => ({ ...prev, maxScore: parseInt(e.target.value) || 0 }))}
                                    min="1"
                                />
                            </div>
                        </div>

                        <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            <table className="table">
                                <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                                    <tr>
                                        <th style={{ width: '60px' }}>#</th>
                                        <th>Roll No</th>
                                        <th>Student Name</th>
                                        <th style={{ width: '120px' }}>Marks (/{newTest.maxScore})</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student, index) => {
                                        const mark = newTest.marks.find(m => m.studentId === student._id);
                                        return (
                                            <tr key={student._id}>
                                                <td>{index + 1}</td>
                                                <td>{student.username}</td>
                                                <td>{student.fullName}</td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        className="form-input"
                                                        style={{ width: '80px', textAlign: 'center' }}
                                                        value={mark?.score ?? ''}
                                                        onChange={(e) => handleMarkChange(student._id, e.target.value, true)}
                                                        min="0"
                                                        max={newTest.maxScore}
                                                        placeholder="-"
                                                    />
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
                                {saving ? 'Saving...' : 'Save Test'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Existing Tests */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">📊 Test Records</h3>
                </div>

                {tests.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Test Type</th>
                                    <th>Date</th>
                                    <th>Max Score</th>
                                    <th>Entries</th>
                                    <th>Average</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tests.map(test => {
                                    const validMarks = test.marks.filter(m => m.score !== null && m.score !== undefined);
                                    const avgScore = validMarks.length > 0
                                        ? (validMarks.reduce((sum, m) => sum + m.score, 0) / validMarks.length).toFixed(1)
                                        : 'N/A';

                                    return (
                                        <tr key={test._id}>
                                            <td>
                                                <span style={{ fontWeight: '500' }}>{test.testType}</span>
                                            </td>
                                            <td>{formatDate(test.date)}</td>
                                            <td>{test.maxScore}</td>
                                            <td>
                                                <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                                                    {validMarks.length}/{students.length}
                                                </span>
                                            </td>
                                            <td>
                                                {avgScore !== 'N/A' ? (
                                                    <span style={{
                                                        color: (parseFloat(avgScore) / test.maxScore) >= 0.6 ? 'var(--success)' : 'var(--warning)'
                                                    }}>
                                                        {avgScore}/{test.maxScore}
                                                    </span>
                                                ) : avgScore}
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        className="btn btn-ghost"
                                                        onClick={() => handleEdit(test)}
                                                        title="Edit"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        className="btn btn-ghost"
                                                        onClick={() => handleDelete(test._id)}
                                                        title="Delete"
                                                        style={{ color: 'var(--danger)' }}
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-500)' }}>
                        <p>No tests created yet. Click "Create New Test" to get started.</p>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingTest && (
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
                            <h3 style={{ margin: 0 }}>Edit Test: {editingTest.testType}</h3>
                            <p style={{ margin: '4px 0 0', color: 'var(--gray-500)', fontSize: '0.9rem' }}>
                                Max Score: {editingTest.maxScore}
                            </p>
                        </div>
                        <div style={{ flex: 1, overflow: 'auto', padding: '0' }}>
                            <table className="table">
                                <thead style={{ position: 'sticky', top: 0, background: 'white' }}>
                                    <tr>
                                        <th>#</th>
                                        <th>Student Name</th>
                                        <th style={{ textAlign: 'center' }}>Marks (/{editingTest.maxScore})</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student, index) => {
                                        const score = getStudentScore(editMarks, student._id);
                                        return (
                                            <tr key={student._id}>
                                                <td>{index + 1}</td>
                                                <td>{student.fullName}</td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <input
                                                        type="number"
                                                        className="form-input"
                                                        style={{ width: '80px', textAlign: 'center' }}
                                                        value={score}
                                                        onChange={(e) => handleMarkChange(student._id, e.target.value, false)}
                                                        min="0"
                                                        max={editingTest.maxScore}
                                                        placeholder="-"
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ padding: '20px', borderTop: '1px solid var(--gray-200)', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button className="btn btn-ghost" onClick={() => setEditingTest(null)}>Cancel</button>
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

export default TeacherTestSheet;
