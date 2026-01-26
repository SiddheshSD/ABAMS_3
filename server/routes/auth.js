const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// @route   POST /api/auth/login
// @desc    Login user
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user
        const user = await User.findOne({ username: username.toLowerCase() });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check if active
        if (!user.isActive) {
            return res.status(400).json({ message: 'Account is deactivated' });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                username: user.username,
                role: user.role,
                mustChangePassword: user.mustChangePassword
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/change-password
// @desc    Change password (for first login)
router.post('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user._id);

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Update password
        user.password = newPassword;
        user.mustChangePassword = false;
        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password')
            .populate('departmentId')
            .populate('classId');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Initialize admin user
const initAdmin = async () => {
    try {
        const adminExists = await User.findOne({ username: 'admin' });
        if (!adminExists) {
            const admin = new User({
                fullName: 'System Administrator',
                username: 'admin',
                password: 'admin',
                role: 'admin',
                mustChangePassword: false
            });
            await admin.save();
            console.log('Admin user created: admin/admin');
        }
    } catch (error) {
        console.error('Error creating admin:', error);
    }
};

initAdmin();

module.exports = router;
