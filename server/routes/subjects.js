const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');
const { auth, adminOnly } = require('../middleware/auth');

// @route   GET /api/subjects
// @desc    Get all subjects
router.get('/', auth, async (req, res) => {
    try {
        const { departmentId, type } = req.query;
        const filter = { isActive: true };

        if (departmentId) filter.departmentId = departmentId;
        if (type) filter.type = type;

        const subjects = await Subject.find(filter)
            .populate('departmentId')
            .sort({ name: 1 });

        res.json(subjects);
    } catch (error) {
        console.error('Get subjects error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/subjects/:id
// @desc    Get single subject
router.get('/:id', auth, async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id)
            .populate('departmentId');

        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        res.json(subject);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/subjects
// @desc    Create subject (admin only)
router.post('/', auth, adminOnly, async (req, res) => {
    try {
        const { name, code, type, practicalName, practicalCode, departmentId, year } = req.body;

        // Check if code already exists
        const existing = await Subject.findOne({
            code: code.toUpperCase(),
            departmentId: departmentId || null
        });

        if (existing) {
            return res.status(400).json({ message: 'Subject code already exists' });
        }

        const subject = new Subject({
            name,
            code: code.toUpperCase(),
            type: type || 'theory',
            practicalName: practicalName || '',
            practicalCode: practicalCode ? practicalCode.toUpperCase() : '',
            year: year || 1,
            departmentId: departmentId || null
        });

        await subject.save();

        const populated = await Subject.findById(subject._id)
            .populate('departmentId');

        res.status(201).json(populated);
    } catch (error) {
        console.error('Create subject error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/subjects/:id
// @desc    Update subject
router.put('/:id', auth, adminOnly, async (req, res) => {
    try {
        const { name, code, type, practicalName, practicalCode, departmentId, year, isActive } = req.body;

        // Check if code already exists (excluding current)
        const existing = await Subject.findOne({
            code: code.toUpperCase(),
            departmentId: departmentId || null,
            _id: { $ne: req.params.id }
        });

        if (existing) {
            return res.status(400).json({ message: 'Subject code already exists' });
        }

        const subject = await Subject.findByIdAndUpdate(
            req.params.id,
            {
                name,
                code: code.toUpperCase(),
                type: type || 'theory',
                practicalName: practicalName || '',
                practicalCode: practicalCode ? practicalCode.toUpperCase() : '',
                year: year || 1,
                departmentId: departmentId || null,
                isActive: isActive !== undefined ? isActive : true
            },
            { new: true }
        ).populate('departmentId');

        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        res.json(subject);
    } catch (error) {
        console.error('Update subject error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/subjects/:id
// @desc    Delete subject
router.delete('/:id', auth, adminOnly, async (req, res) => {
    try {
        const subject = await Subject.findByIdAndDelete(req.params.id);

        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        res.json({ message: 'Subject deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
