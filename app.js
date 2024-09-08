const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const User = require('./models/user'); // Assuming user schema is defined in ./models/user

const app = express();
const port = 3000;

// Middleware to parse incoming requests with JSON payloads
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/AudioNotification', {
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Error connecting to MongoDB', err);
});

// Register a new user
app.post('/register', async (req, res) => {
    console.log('Registering Attempted!')
    console.log('Received data:', req.body);
    const { name, faculty, department, year, fcmToken, appId, appInstallationId } = req.body;

    if (!name || !faculty || !department || !year || !appInstallationId) {
        return res.status(400).send('Missing required fields');
    }

    try {
        const user = new User(req.body);
        await user.save();
        res.status(201).send('User created successfully');
    } catch (error) {
        console.error('Error saving user:', error);
        res.status(500).send('Error saving user information');
    }
});


// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
