const express = require('express');
const router = express.Router();
const Class = require('../models/Class');
const { auth, adminOnly } = require('../middleware/auth');

// @route   GET /api/classes
router.get('/', auth, async (req, res) => {
    try {
        const { departmentId } = req.query;
        const filter = {};
        if (departmentId) filter.departmentId = departmentId;

        const classes = await Class.find(filter)
            .populate('departmentId')
            .populate('coordinatorId', 'fullName username')
            .sort({ year: 1, name: 1 });
        res.json(classes);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/classes/:id
router.get('/:id', auth, async (req, res) => {
    try {
        const classItem = await Class.findById(req.params.id)
            .populate('departmentId')
            .populate('coordinatorId', 'fullName username');
        if (!classItem) {
            return res.status(404).json({ message: 'Class not found' });
        }
        res.json(classItem);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/classes
router.post('/', auth, adminOnly, async (req, res) => {
    try {
        const { name, year, departmentId, coordinatorId } = req.body;

        const classItem = new Class({
            name,
            year,
            departmentId,
            coordinatorId: coordinatorId || null
        });

        await classItem.save();

        const populated = await Class.findById(classItem._id)
            .populate('departmentId')
            .populate('coordinatorId', 'fullName username');

        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/classes/:id
router.put('/:id', auth, adminOnly, async (req, res) => {
    try {
        const { name, year, departmentId, coordinatorId } = req.body;

        const classItem = await Class.findByIdAndUpdate(
            req.params.id,
            { name, year, departmentId, coordinatorId: coordinatorId || null },
            { new: true }
        )
            .populate('departmentId')
            .populate('coordinatorId', 'fullName username');

        if (!classItem) {
            return res.status(404).json({ message: 'Class not found' });
        }

        res.json(classItem);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/classes/:id
router.delete('/:id', auth, adminOnly, async (req, res) => {
    try {
        const classItem = await Class.findByIdAndDelete(req.params.id);
        if (!classItem) {
            return res.status(404).json({ message: 'Class not found' });
        }
        res.json({ message: 'Class deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
