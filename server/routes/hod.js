const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const User = require('../models/User');
const Class = require('../models/Class');
const Timetable = require('../models/Timetable');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const Complaint = require('../models/Complaint');
const { auth, roles } = require('../middleware/auth');
const { reorganizeClass, getClassStudents, updateBatchNames } = require('../utils/classUtils');

const upload = multer({ storage: multer.memoryStorage() });

// Middleware to ensure HOD access and attach department
const hodOnly = async (req, res, next) => {
    if (req.user.role !== 'hod') {
        return res.status(403).json({ message: 'Access denied. HOD only.' });
    }
    if (!req.user.departmentId) {
        return res.status(403).json({ message: 'HOD not assigned to any department.' });
    }
    req.departmentId = req.user.departmentId;
    next();
};

// Apply HOD middleware to all routes
router.use(auth, hodOnly);

// ============================================
// DASHBOARD STATS
// ============================================

// @route   GET /api/hod/stats
// @desc    Get department dashboard stats
router.get('/stats', async (req, res) => {
    try {
        const departmentId = req.departmentId;

        // Get classes grouped by year
        const classes = await Class.find({ departmentId });

        // Get student count per year
        const yearStats = {};
        for (let year = 1; year <= 4; year++) {
            const yearClasses = classes.filter(c => c.year === year);
            const classIds = yearClasses.map(c => c._id);

            const studentCount = await User.countDocuments({
                role: 'student',
                classId: { $in: classIds }
            });

            // Calculate average attendance for the year (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const attendanceData = await Attendance.find({
                classId: { $in: classIds },
                date: { $gte: thirtyDaysAgo }
            });

            let totalPresent = 0;
            let totalStudents = 0;
            attendanceData.forEach(a => {
                totalPresent += a.presentCount;
                totalStudents += a.totalCount;
            });

            const avgAttendance = totalStudents > 0
                ? Math.round((totalPresent / totalStudents) * 100)
                : 0;

            yearStats[year] = {
                classCount: yearClasses.length,
                studentCount,
                avgAttendance
            };
        }

        // Get total counts
        const totalTeachers = await User.countDocuments({
            role: { $in: ['teacher', 'classcoordinator'] },
            departmentId
        });

        const totalStudents = await User.countDocuments({
            role: 'student',
            departmentId
        });

        const pendingLeaves = await LeaveRequest.countDocuments({
            status: 'pending',
            userId: {
                $in: await User.find({ departmentId }).distinct('_id')
            }
        });

        const openComplaints = await Complaint.countDocuments({
            status: 'open',
            userId: {
                $in: await User.find({ departmentId }).distinct('_id')
            }
        });

        res.json({
            yearStats,
            totalTeachers,
            totalStudents,
            totalClasses: classes.length,
            pendingLeaves,
            openComplaints
        });
    } catch (error) {
        console.error('HOD stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================
// ATTENDANCE (Read-only)
// ============================================

// @route   GET /api/hod/attendance
// @desc    Get attendance data for department classes
router.get('/attendance', async (req, res) => {
    try {
        const { year, classId } = req.query;
        const departmentId = req.departmentId;

        // Get department classes
        const classFilter = { departmentId };
        if (year) classFilter.year = parseInt(year);

        const classes = await Class.find(classFilter);
        const classIds = classId ? [classId] : classes.map(c => c._id);

        // Get attendance summary for each class
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const attendanceStats = [];

        for (const cls of classes) {
            if (classId && cls._id.toString() !== classId) continue;

            const studentCount = await User.countDocuments({
                role: 'student',
                classId: cls._id
            });

            const attendanceData = await Attendance.find({
                classId: cls._id,
                date: { $gte: thirtyDaysAgo }
            });

            let totalPresent = 0;
            let totalRecords = 0;
            attendanceData.forEach(a => {
                totalPresent += a.presentCount;
                totalRecords += a.totalCount;
            });

            const avgAttendance = totalRecords > 0
                ? Math.round((totalPresent / totalRecords) * 100)
                : 0;

            let status = 'good';
            if (avgAttendance < 60) status = 'critical';
            else if (avgAttendance < 75) status = 'warning';

            attendanceStats.push({
                classId: cls._id,
                className: cls.name,
                year: cls.year,
                totalStudents: studentCount,
                avgAttendance,
                status
            });
        }

        res.json(attendanceStats);
    } catch (error) {
        console.error('HOD attendance error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================
// STUDENTS
// ============================================

// @route   GET /api/hod/students
// @desc    Get students in HOD's department
router.get('/students', async (req, res) => {
    try {
        const { classId, year, search } = req.query;
        const departmentId = req.departmentId;

        // Get classes in department
        const classFilter = { departmentId };
        if (year) classFilter.year = parseInt(year);

        const deptClasses = await Class.find(classFilter);
        let classIds = deptClasses.map(c => c._id);

        if (classId) {
            // Verify class belongs to department
            const validClass = deptClasses.find(c => c._id.toString() === classId);
            if (!validClass) {
                return res.status(403).json({ message: 'Class not in your department' });
            }
            classIds = [classId];
        }

        // Build filter to get students:
        // 1. Students assigned to department classes (classId in classIds)
        // 2. Students with departmentId set but no class yet
        const filter = {
            role: 'student',
            $or: [
                { classId: { $in: classIds } },
                { departmentId: departmentId, classId: { $exists: false } },
                { departmentId: departmentId, classId: null }
            ]
        };

        // If filtering by specific classId, don't include unassigned students
        if (classId) {
            filter.$or = [{ classId: classId }];
        }

        if (search) {
            filter.$and = filter.$and || [];
            filter.$and.push({
                $or: [
                    { fullName: { $regex: search, $options: 'i' } },
                    { username: { $regex: search, $options: 'i' } }
                ]
            });
        }

        const students = await User.find(filter)
            .select('-password')
            .populate('classId')
            .populate('departmentId')
            .sort({ fullName: 1 });

        res.json(students);
    } catch (error) {
        console.error('HOD students error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/hod/students/:id
// @desc    Update student class assignment
router.put('/students/:id', async (req, res) => {
    try {
        const { classId } = req.body;
        const departmentId = req.departmentId;

        // Verify class belongs to department
        const targetClass = await Class.findById(classId);
        if (!targetClass || targetClass.departmentId.toString() !== departmentId.toString()) {
            return res.status(403).json({ message: 'Can only assign to classes in your department' });
        }

        // Verify student exists and is in department
        const student = await User.findById(req.params.id);
        if (!student || student.role !== 'student') {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Store old class ID for potential reorganization
        const oldClassId = student.classId;

        // Update student's class
        student.classId = classId;
        student.departmentId = departmentId;
        await student.save();

        // Reorganize the new class (sort by last name, assign roll numbers, update batches)
        try {
            await reorganizeClass(classId);
            // Also reorganize old class if student was moved from another class
            if (oldClassId && oldClassId.toString() !== classId.toString()) {
                await reorganizeClass(oldClassId);
            }
        } catch (reorgError) {
            console.error('Class reorganization warning:', reorgError);
            // Don't fail the request if reorganization has issues
        }

        const updated = await User.findById(student._id)
            .select('-password')
            .populate('classId')
            .populate('departmentId');

        res.json(updated);
    } catch (error) {
        console.error('HOD student update error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


// @route   POST /api/hod/students/bulk-assign
// @desc    Bulk assign students to classes via Excel
router.post('/students/bulk-assign', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const departmentId = req.departmentId;
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        // Get all department classes
        const deptClasses = await Class.find({ departmentId });
        const classMap = {};
        deptClasses.forEach(c => {
            classMap[c.name.toLowerCase()] = c._id;
        });

        const results = { success: [], failed: [] };
        const affectedClassIds = new Set(); // Track which classes need reorganization

        for (const row of data) {
            try {
                // Support both new format (Current Class) and old format (className)
                const studentId = row.studentId || row['Student ID'];
                const username = row.username || row.Username;
                const className = row.className || row['Current Class'] || row['Class Name'];

                if (!className) {
                    results.failed.push({ row, error: 'Missing class name (use "Current Class" or "className" column)' });
                    continue;
                }

                // Find student
                let student;
                if (studentId) {
                    student = await User.findById(studentId);
                } else if (username) {
                    student = await User.findOne({ username: username.toString().toLowerCase() });
                } else {
                    results.failed.push({ row, error: 'Missing studentId or username' });
                    continue;
                }

                if (!student || student.role !== 'student') {
                    results.failed.push({ row, error: 'Student not found' });
                    continue;
                }

                // Find class
                const classId = classMap[className.toString().toLowerCase()];
                if (!classId) {
                    results.failed.push({ row, error: 'Class not found in department' });
                    continue;
                }

                // Track old class for reorganization
                if (student.classId) {
                    affectedClassIds.add(student.classId.toString());
                }

                // Update student
                student.classId = classId;
                student.departmentId = departmentId;
                await student.save();

                // Track new class for reorganization
                affectedClassIds.add(classId.toString());

                results.success.push({
                    studentName: student.fullName,
                    username: student.username,
                    className
                });
            } catch (err) {
                results.failed.push({ row, error: err.message });
            }
        }

        // Reorganize all affected classes after bulk assignment
        for (const classId of affectedClassIds) {
            try {
                await reorganizeClass(classId);
            } catch (reorgError) {
                console.error(`Class reorganization warning for ${classId}:`, reorgError);
            }
        }

        res.json({
            message: 'Bulk assignment completed',
            successCount: results.success.length,
            failedCount: results.failed.length,
            success: results.success,
            errors: results.failed
        });
    } catch (error) {
        console.error('HOD bulk assign error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


// ============================================
// TEACHERS
// ============================================

// @route   GET /api/hod/teachers
// @desc    Get teachers in HOD's department
router.get('/teachers', async (req, res) => {
    try {
        const departmentId = req.departmentId;
        const { search } = req.query;

        const filter = {
            role: { $in: ['teacher', 'classcoordinator'] },
            departmentId
        };

        if (search) {
            filter.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } }
            ];
        }

        const teachers = await User.find(filter)
            .select('-password')
            .populate('departmentId')
            .sort({ fullName: 1 });

        // Get class assignments for each teacher
        const teachersWithClasses = await Promise.all(teachers.map(async (teacher) => {
            const assignments = await Timetable.find({ teacherId: teacher._id })
                .populate('classId')
                .distinct('classId');

            const assignedClasses = await Class.find({ _id: { $in: assignments } });

            return {
                ...teacher.toObject(),
                assignedClasses: assignedClasses.map(c => ({
                    _id: c._id,
                    name: c.name,
                    year: c.year
                }))
            };
        }));

        res.json(teachersWithClasses);
    } catch (error) {
        console.error('HOD teachers error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================
// CLASSES
// ============================================

// @route   GET /api/hod/classes
// @desc    Get classes in HOD's department
router.get('/classes', async (req, res) => {
    try {
        const departmentId = req.departmentId;
        const { year } = req.query;

        const filter = { departmentId };
        if (year) filter.year = parseInt(year);

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
        console.error('HOD classes error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/hod/classes/:id/students
// @desc    Get all students in a class with batches
router.get('/classes/:id/students', async (req, res) => {
    try {
        const departmentId = req.departmentId;

        // Verify class belongs to department
        const classDoc = await Class.findById(req.params.id);
        if (!classDoc || classDoc.departmentId.toString() !== departmentId.toString()) {
            return res.status(403).json({ message: 'Class not in your department' });
        }

        const result = await getClassStudents(req.params.id);
        res.json(result);
    } catch (error) {
        console.error('HOD get class students error:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});

// @route   POST /api/hod/classes/:id/reorganize
// @desc    Reorganize class - sort students, assign roll numbers, create batches
router.post('/classes/:id/reorganize', async (req, res) => {
    try {
        const departmentId = req.departmentId;

        // Verify class belongs to department
        const classDoc = await Class.findById(req.params.id);
        if (!classDoc || classDoc.departmentId.toString() !== departmentId.toString()) {
            return res.status(403).json({ message: 'Class not in your department' });
        }

        await reorganizeClass(req.params.id);
        const result = await getClassStudents(req.params.id);
        res.json({
            message: 'Class reorganized successfully',
            ...result
        });
    } catch (error) {
        console.error('HOD reorganize class error:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});

// @route   PUT /api/hod/classes/:id/batches
// @desc    Update batch names
router.put('/classes/:id/batches', async (req, res) => {
    try {
        const departmentId = req.departmentId;
        const { batchUpdates } = req.body;

        // Verify class belongs to department
        const classDoc = await Class.findById(req.params.id);
        if (!classDoc || classDoc.departmentId.toString() !== departmentId.toString()) {
            return res.status(403).json({ message: 'Class not in your department' });
        }

        const updatedClass = await updateBatchNames(req.params.id, batchUpdates);
        res.json({
            message: 'Batch names updated successfully',
            batches: updatedClass.batches
        });
    } catch (error) {
        console.error('HOD update batch names error:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});

// @route   POST /api/hod/classes
// @desc    Create class in HOD's department
router.post('/classes', async (req, res) => {
    try {
        const { name, year, coordinatorId, maxCapacity } = req.body;
        const departmentId = req.departmentId;

        // If coordinator specified, verify they're in the department
        if (coordinatorId) {
            const coordinator = await User.findById(coordinatorId);
            if (!coordinator || coordinator.departmentId?.toString() !== departmentId.toString()) {
                return res.status(400).json({ message: 'Coordinator must be from your department' });
            }
        }

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
        console.error('HOD class create error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/hod/classes/:id
// @desc    Update class in HOD's department
router.put('/classes/:id', async (req, res) => {
    try {
        const { name, year, coordinatorId, maxCapacity } = req.body;
        const departmentId = req.departmentId;

        // Verify class belongs to department
        const existingClass = await Class.findById(req.params.id);
        if (!existingClass || existingClass.departmentId.toString() !== departmentId.toString()) {
            return res.status(403).json({ message: 'Can only update classes in your department' });
        }

        // If coordinator specified, verify they're in the department
        if (coordinatorId) {
            const coordinator = await User.findById(coordinatorId);
            if (!coordinator || coordinator.departmentId?.toString() !== departmentId.toString()) {
                return res.status(400).json({ message: 'Coordinator must be from your department' });
            }
        }

        const updateData = {
            name,
            year,
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
        console.error('HOD class update error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================
// TIMETABLE
// ============================================

// @route   GET /api/hod/timetables
// @desc    Get timetables for HOD's department classes
router.get('/timetables', async (req, res) => {
    try {
        const { classId, day } = req.query;
        const departmentId = req.departmentId;

        // Get department classes
        const deptClasses = await Class.find({ departmentId });
        const classIds = deptClasses.map(c => c._id);

        const filter = { classId: { $in: classIds } };
        if (classId) {
            // Verify class is in department
            if (!classIds.some(id => id.toString() === classId)) {
                return res.status(403).json({ message: 'Class not in your department' });
            }
            filter.classId = classId;
        }
        if (day) filter.day = day;

        const timetables = await Timetable.find(filter)
            .populate('classId')
            .populate('teacherId', 'fullName username')
            .populate('timeSlotId')
            .populate('roomId')
            .sort({ day: 1 });

        res.json(timetables);
    } catch (error) {
        console.error('HOD timetable error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/hod/timetables/other-departments
// @desc    Get timetables from other departments (read-only)
router.get('/timetables/other-departments', async (req, res) => {
    try {
        const departmentId = req.departmentId;

        // Get classes NOT in department
        const otherClasses = await Class.find({ departmentId: { $ne: departmentId } });
        const classIds = otherClasses.map(c => c._id);

        const timetables = await Timetable.find({ classId: { $in: classIds } })
            .populate({
                path: 'classId',
                populate: { path: 'departmentId' }
            })
            .populate('teacherId', 'fullName username')
            .populate('timeSlotId')
            .populate('roomId')
            .sort({ day: 1 });

        res.json(timetables);
    } catch (error) {
        console.error('HOD other timetables error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/hod/timetables
// @desc    Create timetable entry for HOD's department
router.post('/timetables', async (req, res) => {
    try {
        const { classId, subject, teacherId, day, timeSlotId, roomId, type, lectureId } = req.body;
        const departmentId = req.departmentId;

        // Verify class is in department
        const cls = await Class.findById(classId);
        if (!cls || cls.departmentId.toString() !== departmentId.toString()) {
            return res.status(403).json({ message: 'Can only create timetable for your department classes' });
        }

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
        console.error('HOD timetable create error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/hod/timetables/:id
// @desc    Update timetable entry
router.put('/timetables/:id', async (req, res) => {
    try {
        const { classId, subject, teacherId, day, timeSlotId, roomId, type, lectureId } = req.body;
        const departmentId = req.departmentId;
        const timetableId = req.params.id;

        // Verify existing timetable is for department class
        const existing = await Timetable.findById(timetableId).populate('classId');
        if (!existing || existing.classId.departmentId.toString() !== departmentId.toString()) {
            return res.status(403).json({ message: 'Can only update timetable for your department' });
        }

        // Verify new class is in department
        const cls = await Class.findById(classId);
        if (!cls || cls.departmentId.toString() !== departmentId.toString()) {
            return res.status(403).json({ message: 'Can only assign to your department classes' });
        }

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

        res.json(timetable);
    } catch (error) {
        console.error('HOD timetable update error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/hod/timetables/:id
// @desc    Delete timetable entry
router.delete('/timetables/:id', async (req, res) => {
    try {
        const departmentId = req.departmentId;

        // Verify timetable is for department class
        const existing = await Timetable.findById(req.params.id).populate('classId');
        if (!existing || existing.classId.departmentId.toString() !== departmentId.toString()) {
            return res.status(403).json({ message: 'Can only delete timetable for your department' });
        }

        await Timetable.findByIdAndDelete(req.params.id);
        res.json({ message: 'Timetable entry deleted' });
    } catch (error) {
        console.error('HOD timetable delete error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/hod/timetables/bulk-upload
// @desc    Bulk upload timetable via Excel
router.post('/timetables/bulk-upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const departmentId = req.departmentId;
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        // Get department classes and teachers
        const deptClasses = await Class.find({ departmentId });
        const TimeSlot = require('../models/TimeSlot');
        const Room = require('../models/Room');
        const timeSlots = await TimeSlot.find({});
        const rooms = await Room.find({});
        const teachers = await User.find({ role: { $in: ['teacher', 'classcoordinator'] } });

        const results = { success: [], failed: [] };

        for (const row of data) {
            try {
                const { className, subject, teacherUsername, day, timeSlotName, roomName, type } = row;

                // Find class
                const cls = deptClasses.find(c => c.name.toLowerCase() === className?.toLowerCase());
                if (!cls) {
                    results.failed.push({ row, error: 'Class not found in department' });
                    continue;
                }

                // Find teacher
                const teacher = teachers.find(t => t.username === teacherUsername?.toLowerCase());
                if (!teacher) {
                    results.failed.push({ row, error: 'Teacher not found' });
                    continue;
                }

                // Find time slot
                const timeSlot = timeSlots.find(ts => ts.name === timeSlotName);
                if (!timeSlot) {
                    results.failed.push({ row, error: 'Time slot not found' });
                    continue;
                }

                // Find room
                const room = rooms.find(r => r.name === roomName || r.code === roomName);
                if (!room) {
                    results.failed.push({ row, error: 'Room not found' });
                    continue;
                }

                // Check for conflicts
                const roomConflict = await Timetable.findOne({ day, timeSlotId: timeSlot._id, roomId: room._id });
                if (roomConflict) {
                    results.failed.push({ row, error: 'Room conflict' });
                    continue;
                }

                const teacherConflict = await Timetable.findOne({ day, timeSlotId: timeSlot._id, teacherId: teacher._id });
                if (teacherConflict) {
                    results.failed.push({ row, error: 'Teacher conflict' });
                    continue;
                }

                // Create timetable entry
                const timetable = new Timetable({
                    classId: cls._id,
                    subject,
                    teacherId: teacher._id,
                    day,
                    timeSlotId: timeSlot._id,
                    roomId: room._id,
                    type: type || 'lecture'
                });

                await timetable.save();
                results.success.push({ className, subject, teacher: teacher.fullName, day, timeSlot: timeSlotName });
            } catch (err) {
                results.failed.push({ row, error: err.message });
            }
        }

        res.json({
            message: 'Bulk upload completed',
            successCount: results.success.length,
            failedCount: results.failed.length,
            success: results.success,
            errors: results.failed
        });
    } catch (error) {
        console.error('HOD timetable bulk upload error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================
// LECTURES (Subject-Teacher-Class Assignments)
// ============================================

const Lecture = require('../models/Lecture');
const Subject = require('../models/Subject');

// @route   GET /api/hod/lectures
// @desc    Get all lectures for HOD's department
router.get('/lectures', async (req, res) => {
    try {
        const departmentId = req.departmentId;

        const lectures = await Lecture.find({ departmentId, isActive: true })
            .populate('subjectId', 'name code')
            .populate('teacherId', 'fullName username')
            .populate('classId', 'name year')
            .populate('departmentId', 'name')
            .sort({ createdAt: -1 });

        res.json(lectures);
    } catch (error) {
        console.error('HOD lectures fetch error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/hod/lectures
// @desc    Create a new lecture assignment
router.post('/lectures', async (req, res) => {
    try {
        const { subjectId, teacherId, classId, type } = req.body;
        const departmentId = req.departmentId;

        // Verify subject exists
        const subject = await Subject.findById(subjectId);
        if (!subject) {
            return res.status(400).json({ message: 'Subject not found' });
        }

        // Verify teacher is in department
        const teacher = await User.findById(teacherId);
        if (!teacher || teacher.departmentId?.toString() !== departmentId.toString()) {
            return res.status(400).json({ message: 'Teacher must be from your department' });
        }

        // Verify class is in department
        const cls = await Class.findById(classId);
        if (!cls || cls.departmentId.toString() !== departmentId.toString()) {
            return res.status(400).json({ message: 'Class must be from your department' });
        }

        // Check for duplicate
        const existing = await Lecture.findOne({ subjectId, teacherId, classId, type, departmentId });
        if (existing) {
            return res.status(400).json({ message: 'This lecture assignment already exists' });
        }

        const lecture = new Lecture({
            subjectId,
            teacherId,
            classId,
            type,
            departmentId
        });

        await lecture.save();

        const populated = await Lecture.findById(lecture._id)
            .populate('subjectId', 'name code')
            .populate('teacherId', 'fullName username')
            .populate('classId', 'name year')
            .populate('departmentId', 'name');

        res.status(201).json(populated);
    } catch (error) {
        console.error('HOD lecture create error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/hod/lectures/:id
// @desc    Update a lecture assignment
router.put('/lectures/:id', async (req, res) => {
    try {
        const { subjectId, teacherId, classId, type } = req.body;
        const departmentId = req.departmentId;

        // Verify lecture exists and belongs to department
        const existingLecture = await Lecture.findById(req.params.id);
        if (!existingLecture || existingLecture.departmentId.toString() !== departmentId.toString()) {
            return res.status(403).json({ message: 'Can only update lectures in your department' });
        }

        // Verify class is in department
        const cls = await Class.findById(classId);
        if (!cls || cls.departmentId.toString() !== departmentId.toString()) {
            return res.status(400).json({ message: 'Class must be from your department' });
        }

        // Verify teacher is in department
        const teacher = await User.findById(teacherId);
        if (!teacher || teacher.departmentId?.toString() !== departmentId.toString()) {
            return res.status(400).json({ message: 'Teacher must be from your department' });
        }

        // Check for duplicate (excluding current)
        const duplicate = await Lecture.findOne({
            subjectId, teacherId, classId, type, departmentId,
            _id: { $ne: req.params.id }
        });
        if (duplicate) {
            return res.status(400).json({ message: 'This lecture assignment already exists' });
        }

        const lecture = await Lecture.findByIdAndUpdate(
            req.params.id,
            { subjectId, teacherId, classId, type },
            { new: true }
        )
            .populate('subjectId', 'name code')
            .populate('teacherId', 'fullName username')
            .populate('classId', 'name year')
            .populate('departmentId', 'name');

        res.json(lecture);
    } catch (error) {
        console.error('HOD lecture update error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/hod/lectures/:id
// @desc    Delete a lecture assignment
router.delete('/lectures/:id', async (req, res) => {
    try {
        const departmentId = req.departmentId;

        const lecture = await Lecture.findById(req.params.id);
        if (!lecture || lecture.departmentId.toString() !== departmentId.toString()) {
            return res.status(403).json({ message: 'Can only delete lectures in your department' });
        }

        await Lecture.findByIdAndDelete(req.params.id);
        res.json({ message: 'Lecture deleted successfully' });
    } catch (error) {
        console.error('HOD lecture delete error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================
// LEAVE REQUESTS
// ============================================

// @route   GET /api/hod/leave-requests
// @desc    Get leave requests from department members
router.get('/leave-requests', async (req, res) => {
    try {
        const { status } = req.query;
        const departmentId = req.departmentId;

        // Get all users in department
        const deptUsers = await User.find({ departmentId }).distinct('_id');

        const filter = { userId: { $in: deptUsers } };
        if (status) filter.status = status;

        const leaveRequests = await LeaveRequest.find(filter)
            .populate({
                path: 'userId',
                select: 'fullName username role classId',
                populate: { path: 'classId', select: 'name' }
            })
            .populate('reviewedBy', 'fullName')
            .sort({ createdAt: -1 });

        res.json(leaveRequests);
    } catch (error) {
        console.error('HOD leave requests error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/hod/leave-requests/:id
// @desc    Approve or reject leave request
router.put('/leave-requests/:id', async (req, res) => {
    try {
        const { status, reviewRemark } = req.body;
        const departmentId = req.departmentId;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        // Verify leave request is from department member
        const leaveRequest = await LeaveRequest.findById(req.params.id).populate('userId');
        if (!leaveRequest) {
            return res.status(404).json({ message: 'Leave request not found' });
        }

        if (leaveRequest.userId.departmentId?.toString() !== departmentId.toString()) {
            return res.status(403).json({ message: 'Can only review department leave requests' });
        }

        leaveRequest.status = status;
        leaveRequest.reviewedBy = req.user._id;
        leaveRequest.reviewedAt = new Date();
        if (reviewRemark) leaveRequest.reviewRemark = reviewRemark;

        await leaveRequest.save();

        const populated = await LeaveRequest.findById(leaveRequest._id)
            .populate({
                path: 'userId',
                select: 'fullName username role classId',
                populate: { path: 'classId', select: 'name' }
            })
            .populate('reviewedBy', 'fullName');

        res.json(populated);
    } catch (error) {
        console.error('HOD leave request update error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================
// COMPLAINTS
// ============================================

// @route   GET /api/hod/complaints
// @desc    Get complaints from department members
router.get('/complaints', async (req, res) => {
    try {
        const { status } = req.query;
        const departmentId = req.departmentId;

        // Get all users in department
        const deptUsers = await User.find({ departmentId }).distinct('_id');

        const filter = { userId: { $in: deptUsers } };
        if (status) filter.status = status;

        const complaints = await Complaint.find(filter)
            .populate({
                path: 'userId',
                select: 'fullName username role classId',
                populate: { path: 'classId', select: 'name' }
            })
            .populate('resolvedBy', 'fullName')
            .sort({ createdAt: -1 });

        res.json(complaints);
    } catch (error) {
        console.error('HOD complaints error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/hod/complaints/:id
// @desc    Resolve complaint
router.put('/complaints/:id', async (req, res) => {
    try {
        const { status, remark } = req.body;
        const departmentId = req.departmentId;

        if (!['in-progress', 'resolved'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        // Verify complaint is from department member
        const complaint = await Complaint.findById(req.params.id).populate('userId');
        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        if (complaint.userId.departmentId?.toString() !== departmentId.toString()) {
            return res.status(403).json({ message: 'Can only update department complaints' });
        }

        complaint.status = status;
        if (remark) complaint.remark = remark;

        if (status === 'resolved') {
            complaint.resolvedBy = req.user._id;
            complaint.resolvedAt = new Date();
        }

        await complaint.save();

        const populated = await Complaint.findById(complaint._id)
            .populate({
                path: 'userId',
                select: 'fullName username role classId',
                populate: { path: 'classId', select: 'name' }
            })
            .populate('resolvedBy', 'fullName');

        res.json(populated);
    } catch (error) {
        console.error('HOD complaint update error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
