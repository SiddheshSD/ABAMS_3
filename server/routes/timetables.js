const express = require('express');
const router = express.Router();
const Timetable = require('../models/Timetable');
const { auth, adminOnly } = require('../middleware/auth');

// @route   GET /api/timetables
router.get('/', auth, async (req, res) => {
    try {
        const { classId, teacherId, day } = req.query;
        const filter = {};
        if (classId) filter.classId = classId;
        if (teacherId) filter.teacherId = teacherId;
        if (day) filter.day = day;

        const timetables = await Timetable.find(filter)
            .populate('classId')
            .populate('teacherId', 'fullName username')
            .populate('timeSlotId')
            .populate('roomId')
            .sort({ day: 1 });

        res.json(timetables);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/timetables/lectures
// @desc    Get all lectures for timetable scheduling (admin access)
router.get('/lectures', auth, adminOnly, async (req, res) => {
    try {
        const Lecture = require('../models/Lecture');
        const { classId } = req.query;

        const filter = { isActive: true };
        if (classId) filter.classId = classId;

        const lectures = await Lecture.find(filter)
            .populate('subjectId', 'name code')
            .populate('teacherId', 'fullName username')
            .populate('classId', 'name year')
            .populate('departmentId', 'name')
            .sort({ createdAt: -1 });

        res.json(lectures);
    } catch (error) {
        console.error('Lectures fetch error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/timetables
router.post('/', auth, adminOnly, async (req, res) => {
    try {
        const { classId, subject, teacherId, day, timeSlotId, roomId, type, lectureId } = req.body;

        // Check for room conflict
        const roomConflict = await Timetable.findOne({ day, timeSlotId, roomId });
        if (roomConflict) {
            return res.status(400).json({ message: 'Room is already booked for this time slot' });
        }

        // Check for teacher conflict
        const teacherConflict = await Timetable.findOne({ day, timeSlotId, teacherId });
        if (teacherConflict) {
            return res.status(400).json({ message: 'Teacher is already assigned for this time slot' });
        }

        const timetable = new Timetable({
            classId, subject, teacherId, day, timeSlotId, roomId, type,
            lectureId: lectureId || undefined
        });

        await timetable.save();

        const populated = await Timetable.findById(timetable._id)
            .populate('classId')
            .populate('teacherId', 'fullName username')
            .populate('timeSlotId')
            .populate('roomId');

        res.status(201).json(populated);
    } catch (error) {
        console.error('Timetable create error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/timetables/:id
router.put('/:id', auth, adminOnly, async (req, res) => {
    try {
        const { classId, subject, teacherId, day, timeSlotId, roomId, type, lectureId } = req.body;
        const timetableId = req.params.id;

        // Check for room conflict (excluding current entry)
        const roomConflict = await Timetable.findOne({
            day, timeSlotId, roomId,
            _id: { $ne: timetableId }
        });
        if (roomConflict) {
            return res.status(400).json({ message: 'Room is already booked for this time slot' });
        }

        // Check for teacher conflict (excluding current entry)
        const teacherConflict = await Timetable.findOne({
            day, timeSlotId, teacherId,
            _id: { $ne: timetableId }
        });
        if (teacherConflict) {
            return res.status(400).json({ message: 'Teacher is already assigned for this time slot' });
        }

        const timetable = await Timetable.findByIdAndUpdate(
            timetableId,
            { classId, subject, teacherId, day, timeSlotId, roomId, type, lectureId: lectureId || undefined },
            { new: true }
        )
            .populate('classId')
            .populate('teacherId', 'fullName username')
            .populate('timeSlotId')
            .populate('roomId');

        if (!timetable) {
            return res.status(404).json({ message: 'Timetable entry not found' });
        }

        res.json(timetable);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/timetables/:id
router.delete('/:id', auth, adminOnly, async (req, res) => {
    try {
        const timetable = await Timetable.findByIdAndDelete(req.params.id);
        if (!timetable) {
            return res.status(404).json({ message: 'Timetable entry not found' });
        }
        res.json({ message: 'Timetable entry deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/timetables/class/:classId
// @desc    Delete all timetable entries for a class
router.delete('/class/:classId', auth, adminOnly, async (req, res) => {
    try {
        await Timetable.deleteMany({ classId: req.params.classId });
        res.json({ message: 'All timetable entries for class deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
