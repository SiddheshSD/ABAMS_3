const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { authenticate } = require('../middleware/auth');
const User = require('../models/User');

// Get current user's profile
router.get('/', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password')
            .populate('departmentId', 'name')
            .populate('classId', 'name year');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update current user's profile
router.put('/', authenticate, async (req, res) => {
    try {
        const { email, phone, about, address, emergencyContact } = req.body;

        const updateData = {};

        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (about !== undefined) updateData.about = about;
        if (address !== undefined) updateData.address = address;
        if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updateData },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Change password
router.put('/change-password', authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Get user with password
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        user.password = hashedPassword;
        user.mustChangePassword = false;
        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

