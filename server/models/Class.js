const mongoose = require('mongoose');
const classSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    year: {
        type: Number,
        required: true,
        min: 1,
        max: 4
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true
    },
    coordinatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
module.exports = mongoose.model('Class', classSchema);