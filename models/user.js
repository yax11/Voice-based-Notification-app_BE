const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    faculty: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    year: {
        type: String,
        required: true
    },
    fcmToken: {
        type: String,
        required: false
    },
    appId: {
        type: String,
        required: false
    },
    appInstallationId: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('User', userSchema);
