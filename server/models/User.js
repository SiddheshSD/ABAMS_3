const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    fatherName: {
        type: String,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    fullName: {
        type: String,
        trim: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'hod', 'classcoordinator', 'teacher', 'student', 'parent'],
        required: true
    },
    dob: {
        type: Date
    },
    email: {
        type: String,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
    },
    mustChangePassword: {
        type: Boolean,
        default: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
// Generate fullName before saving
userSchema.pre('save', async function (next) {
    // Generate fullName from parts
    this.fullName = [this.firstName, this.fatherName, this.lastName].filter(Boolean).join(' ');

    // Hash password if modified
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});
// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};
module.exports = mongoose.model('User', userSchema);
