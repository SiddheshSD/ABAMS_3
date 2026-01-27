import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [showInstructions, setShowInstructions] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const roles = [
        { value: 'student', label: '👨‍🎓 Student' },
        { value: 'parent', label: '👨‍👩‍👦 Parent' },
        { value: 'teacher', label: '👨‍🏫 Teacher' },
        { value: 'classcoordinator', label: '📋 Class Coordinator' },
        { value: 'hod', label: '🏢 Head of Department' },
        { value: 'admin', label: '⚙️ Admin' }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!selectedRole) {
            setError('Please select a role');
            return;
        }

        setLoading(true);

        try {
            const result = await login(username, password, selectedRole);

            if (result.mustChangePassword) {
                navigate('/change-password');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <div className="login-logo">🎓</div>
                    <h1>ABAMS</h1>
                    <p>AI-Based Academic Monitoring System</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">I am a</label>
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            required
                            style={{ width: '100%' }}
                        >
                            <option value="">Select your role</option>
                            {roles.map((role) => (
                                <option key={role.value} value={role.value}>
                                    {role.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                {/* Login Instructions Toggle */}
                <button
                    className="help-toggle"
                    onClick={() => setShowInstructions(!showInstructions)}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        cursor: 'pointer',
                        marginTop: '16px',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        margin: '16px auto 0'
                    }}
                >
                    ❓ {showInstructions ? 'Hide' : 'Show'} Login Instructions
                </button>

                {showInstructions && (
                    <div className="login-instructions" style={{
                        marginTop: '16px',
                        padding: '16px',
                        background: 'var(--gray-50)',
                        borderRadius: '12px',
                        fontSize: '13px',
                        textAlign: 'left'
                    }}>
                        <h4 style={{ marginBottom: '12px', color: 'var(--gray-800)' }}>📋 First Time Login Guide</h4>

                        <div style={{ marginBottom: '12px' }}>
                            <strong>👨‍🎓 Students:</strong>
                            <ul style={{ marginLeft: '16px', marginTop: '4px', color: 'var(--gray-600)' }}>
                                <li>Username: <code>firstname + lastname + birthyear</code></li>
                                <li>Password: <code>firstname + DOB (ddmmyy)</code></li>
                            </ul>
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                            <strong>👨‍👩‍👦 Parents:</strong>
                            <ul style={{ marginLeft: '16px', marginTop: '4px', color: 'var(--gray-600)' }}>
                                <li>Username: <code>fathername + lastname + mothername + student's birthyear</code></li>
                                <li>Password: <code>Same as student's password</code></li>
                            </ul>
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                            <strong>👨‍🏫 Teachers / HOD / Class Coordinator:</strong>
                            <ul style={{ marginLeft: '16px', marginTop: '4px', color: 'var(--gray-600)' }}>
                                <li>Username: <code>firstname + lastname + birthyear</code></li>
                                <li>Password: <code>firstname + DOB (ddmmyy)</code></li>
                            </ul>
                        </div>

                        <p style={{
                            marginTop: '12px',
                            padding: '8px',
                            background: 'rgba(99, 102, 241, 0.1)',
                            borderRadius: '6px',
                            color: 'var(--primary)'
                        }}>
                            ⚠️ You will be asked to change your password on first login.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;
