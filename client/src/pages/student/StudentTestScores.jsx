import { useState, useEffect } from 'react';

const StudentTestScores = () => {
    const [testScores, setTestScores] = useState([]);
    const [filters, setFilters] = useState({ subjects: [], testTypes: [] });
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedTestType, setSelectedTestType] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTestScores();
    }, [selectedSubject, selectedTestType]);

    const fetchTestScores = async () => {
        try {
            const token = localStorage.getItem('token');
            let url = 'http://localhost:5000/api/student/tests';
            const params = new URLSearchParams();
            if (selectedSubject) params.append('subject', selectedSubject);
            if (selectedTestType) params.append('testType', selectedTestType);
            if (params.toString()) url += `?${params.toString()}`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                setTestScores(data.testScores || []);
                if (data.filters) {
                    setFilters(data.filters);
                }
            } else {
                setError(data.message || 'Failed to fetch test scores');
            }
        } catch (err) {
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getScoreClass = (percentage) => {
        if (percentage === null) return '';
        if (percentage >= 60) return 'score-good';
        if (percentage >= 40) return 'score-warning';
        return 'score-low';
    };

    const clearFilters = () => {
        setSelectedSubject('');
        setSelectedTestType('');
    };

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    if (error) {
        return (
            <div className="page-container">
                <div className="alert alert-error">{error}</div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h2>Test Scores</h2>
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <div className="filter-group">
                    <label>Subject</label>
                    <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                    >
                        <option value="">All Subjects</option>
                        {filters.subjects.map((subject, index) => (
                            <option key={index} value={subject}>{subject}</option>
                        ))}
                    </select>
                </div>
                <div className="filter-group">
                    <label>Test Type</label>
                    <select
                        value={selectedTestType}
                        onChange={(e) => setSelectedTestType(e.target.value)}
                    >
                        <option value="">All Types</option>
                        {filters.testTypes.map((type, index) => (
                            <option key={index} value={type}>{type}</option>
                        ))}
                    </select>
                </div>
                {(selectedSubject || selectedTestType) && (
                    <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
                        Clear Filters
                    </button>
                )}
            </div>

            {/* Test Scores Table */}
            {testScores.length > 0 ? (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Subject</th>
                                <th>Test Type</th>
                                <th>Date</th>
                                <th>Score</th>
                                <th>Max Score</th>
                                <th>Percentage</th>
                            </tr>
                        </thead>
                        <tbody>
                            {testScores.map((test, index) => (
                                <tr key={test._id || index}>
                                    <td>{index + 1}</td>
                                    <td>{test.subject}</td>
                                    <td><span className="badge">{test.testType}</span></td>
                                    <td>{formatDate(test.date)}</td>
                                    <td>
                                        {test.score !== null ? (
                                            <span className={`score-value ${getScoreClass(test.percentage)}`}>
                                                {test.score}
                                            </span>
                                        ) : (
                                            <span className="no-score">-</span>
                                        )}
                                    </td>
                                    <td>{test.maxScore}</td>
                                    <td>
                                        {test.percentage !== null ? (
                                            <div className="percentage-cell">
                                                <div className="mini-progress">
                                                    <div
                                                        className={`mini-progress-fill ${getScoreClass(test.percentage)}`}
                                                        style={{ width: `${test.percentage}%` }}
                                                    ></div>
                                                </div>
                                                <span className={getScoreClass(test.percentage)}>{test.percentage}%</span>
                                            </div>
                                        ) : (
                                            <span className="no-score">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="empty-state">
                    {selectedSubject || selectedTestType
                        ? 'No test scores found for the selected filters'
                        : 'No test scores recorded yet'}
                </div>
            )}
        </div>
    );
};

export default StudentTestScores;
