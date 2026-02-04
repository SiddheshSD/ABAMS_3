const express = require('express');
const router = express.Router();
const Class = require('../models/Class');
const User = require('../models/User');
const { auth, adminOnly } = require('../middleware/auth');
const { reorganizeClass, getClassStudents, updateBatchNames } = require('../utils/classUtils');

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

        // Add student count for each class
        const classesWithCounts = await Promise.all(classes.map(async (cls) => {
            const studentCount = await User.countDocuments({
                role: 'student',
                classId: cls._id
            });
            return {
                ...cls.toObject(),
                studentCount
            };
        }));

        res.json(classesWithCounts);
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

        // Add student count
        const studentCount = await User.countDocuments({
            role: 'student',
            classId: req.params.id
        });

        res.json({
            ...classItem.toObject(),
            studentCount
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/classes/:id/students
// @desc    Get all students in a class with batches
router.get('/:id/students', auth, async (req, res) => {
    try {
        const result = await getClassStudents(req.params.id);
        res.json(result);
    } catch (error) {
        console.error('Get class students error:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});

// @route   POST /api/classes/:id/reorganize
// @desc    Reorganize class - sort students, assign roll numbers, create batches
router.post('/:id/reorganize', auth, adminOnly, async (req, res) => {
    try {
        const classDoc = await reorganizeClass(req.params.id);
        const result = await getClassStudents(req.params.id);
        res.json({
            message: 'Class reorganized successfully',
            ...result
        });
    } catch (error) {
        console.error('Reorganize class error:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});

// @route   PUT /api/classes/:id/batches
// @desc    Update batch names
router.put('/:id/batches', auth, adminOnly, async (req, res) => {
    try {
        const { batchUpdates } = req.body; // Array of {batchId, name}
        const classDoc = await updateBatchNames(req.params.id, batchUpdates);
        res.json({
            message: 'Batch names updated successfully',
            batches: classDoc.batches
        });
    } catch (error) {
        console.error('Update batch names error:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});

// @route   POST /api/classes
router.post('/', auth, adminOnly, async (req, res) => {
    try {
        const { name, year, departmentId, coordinatorId, maxCapacity } = req.body;

        // Initialize default batches
        const defaultBatches = [
            { name: 'Batch 1', studentIds: [] },
            { name: 'Batch 2', studentIds: [] },
            { name: 'Batch 3', studentIds: [] }
        ];

        const classItem = new Class({
            name,
            year,
            departmentId,
            coordinatorId: coordinatorId || null,
            maxCapacity: maxCapacity || 75,
            batches: defaultBatches
        });

        await classItem.save();

        const populated = await Class.findById(classItem._id)
            .populate('departmentId')
            .populate('coordinatorId', 'fullName username');

        res.status(201).json({
            ...populated.toObject(),
            studentCount: 0
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/classes/:id
router.put('/:id', auth, adminOnly, async (req, res) => {
    try {
        const { name, year, departmentId, coordinatorId, maxCapacity } = req.body;

        const updateData = {
            name,
            year,
            departmentId,
            coordinatorId: coordinatorId || null
        };

        if (maxCapacity !== undefined) {
            updateData.maxCapacity = maxCapacity;
        }

        const classItem = await Class.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        )
            .populate('departmentId')
            .populate('coordinatorId', 'fullName username');

        if (!classItem) {
            return res.status(404).json({ message: 'Class not found' });
        }

        // Add student count
        const studentCount = await User.countDocuments({
            role: 'student',
            classId: req.params.id
        });

        res.json({
            ...classItem.toObject(),
            studentCount
        });
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

