const mongoose = require('mongoose');
const timetableSchema = new mongoose.Schema({
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        required: true
    },
    timeSlotId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TimeSlot',
        required: true
    },
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    type: {
        type: String,
        enum: ['lecture', 'practical'],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
// Index for conflict checking
timetableSchema.index({ day: 1, timeSlotId: 1, roomId: 1 }, { unique: true });
timetableSchema.index({ day: 1, timeSlotId: 1, teacherId: 1 }, { unique: true });
module.exports = mongoose.model('Timetable', timetableSchema);