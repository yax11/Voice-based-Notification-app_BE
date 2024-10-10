const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    faculty: {
        type: String,
        // required: true
    },
    department: {
        type: String,
        required: true
    },
    year: {
        type: String,
        required: true
    },
    semester: {
        type: String,
        // required: true
    },
    date: {
        type: Date,
        // required: true
    },
    dateAdded: {
        type: Date,
        default: Date.now
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    },
    venue: {
        type: String,
        required: true
    },
    instructor: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Schedule', scheduleSchema);