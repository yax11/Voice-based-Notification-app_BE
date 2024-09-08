const mongoose = require('mongoose');

// Define a schema for notifications
const notificationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    department: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

// Create a model based on the schema
const Notification = mongoose.model('Notification', notificationSchema);

// Export the model
module.exports = Notification;
