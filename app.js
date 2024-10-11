const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const User = require('./models/user');
const multer = require('multer');
const admin = require('firebase-admin');
const serviceAccount = require('./voice-based-notification-firebase-adminsdk-mon7r-d6f28a020d.json');
const Notification = require('./models/notificationModel');
const Schedules = require('./models/schedules');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});


// Middleware to parse incoming requests with JSON payloads
app.use(bodyParser.json());

// Connect to MongoDB
// mongoose.connect('mongodb://127.0.0.1:27017/AudioNotification', {
mongoose.connect('mongodb+srv://yakubuharuna11:AOxUuIrzHiIR9JWF@cluster0.hzvxz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Error connecting to MongoDB', err);
});


app.post('/register', async (req, res) => {
    console.log('Registration Attempted!');

    // Destructure the data from the request body
    const { name, faculty, department, year, fcmToken, appId, appInstallationId, userUniqueId } = req.body;

    // Check if all required fields except userUniqueId are present
    if (!name || !faculty || !department || !year || !appInstallationId) {
        return res.status(400).send('Missing required fields');
    }

    try {
        // Prepare user data with an optional userUniqueId
        const newUser = new User({
            name,
            faculty,
            department,
            year,
            fcmToken,
            appId,
            appInstallationId,
            userUniqueId: userUniqueId || undefined  // Set undefined if userUniqueId is not provided
        });

        // Save the new user to the database
        await newUser.save();

        // Prepare notification data
        const notificationData = {
            notification: {
                title: 'Welcome!',
                body: `Hello ${name}, you have successfully registered in the ${department} department.`,
            },
            token: fcmToken,  // Send to the device associated with this FCM token
        };

        // Send the notification using Firebase Admin SDK
        admin.messaging().send(notificationData)
            .then((response) => {
                console.log('Successfully sent notification:', response);
            })
            .catch((error) => {
                console.error('Error sending FCM notification:', error);
            });

        // Respond with success after saving user and attempting to send the notification
        res.status(201).send({
            message: 'User created successfully and notification sent.',
            userId: userUniqueId || newUser._id,  // Return userUniqueId if provided, otherwise return the generated MongoDB _id
        });
    } catch (error) {
        console.error('Error saving user:', error);
        res.status(500).send('Error saving user information');
    }
});


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });


app.post('/upload/audio', upload.single('audio'), async (req, res) => {
    console.log("Upload attempted");

    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const { department, year, title, message } = req.body;

    if (!department || !year || !title) {
        return res.status(400).send('Required fields are missing.');
    }

    try {
        // Create and save the notification
        const newNotification = new Notification({
            title,
            message: message || '',
            department,
            year,
            filename: req.file.filename
        });
        await newNotification.save();

        // Find all users in the same department
        const users = await User.find({ department });

        // Prepare the notification payload
        const notificationPayload = {
            notification: {
                title: title,
                body: message || 'New notification for your department',
            },
            data: {
                notificationId: newNotification._id.toString(),
                department: department,
                year: year,
            },
        };

        // Send notifications to all users in the department
        const sendNotificationPromises = users.map(user => {
            if (user.fcmToken) {
                return admin.messaging().send({
                    ...notificationPayload,
                    token: user.fcmToken,
                }).catch(error => {
                    console.error(`Failed to send notification to user ${user._id}:`, error);
                });
            }
            return Promise.resolve(); // If user has no FCM token, resolve immediately
        });

        await Promise.all(sendNotificationPromises);

        console.log(`Notification saved and sent to users. Department: ${department}, Year: ${year}, Title: ${title}`);
        res.status(200).send('Audio uploaded, notification saved, and sent to users successfully.');
    } catch (error) {
        console.error('Error in upload and notification process:', error);
        res.status(500).send('Error in upload and notification process.');
    }
});

// Add this new route for downloading audio files

app.get('/audio/:filename', async (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);

    try {
        // Check if file exists
        if (fs.existsSync(filePath)) {
            // Set the appropriate headers
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

            // Create a read stream and pipe it to the response
            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);

            // Handle potential errors during streaming
            fileStream.on('error', (error) => {
                console.error('Error streaming file:', error);
                res.status(500).send('Error streaming audio file');
            });
        } else {
            console.error('File not found:', filePath);
            res.status(404).send('Audio file not found');
        }
    } catch (error) {
        console.error('Error serving audio file:', error);
        res.status(500).send('Internal server error');
    }
});
app.get('/notifications', async (req, res) => {
    const { department, year } = req.query;

    if (!department || !year) {
        return res.status(400).json({ message: 'Department and year are required' });
    }

    try {
        const notifications = await Notification.find({ department, year });
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notifications', error });
    }
});

app.get('/schedules', async (req, res) => {
    const { department, year, semester } = req.query;
    if (!department || !year) {
        return res.status(400).json({ message: 'Department and year are required' });
    }
    const query = { department, year };
    if (semester) {
        query.semester = semester;
    }
    try {
        const schedules = await Schedules.find(query);
        res.status(200).json(schedules);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching schedules', error });
    }
});

app.post('/schedules', async (req, res) => {
    const {
        type,
        title,
        faculty,
        department,
        year,
        date,
        startTime,
        endTime,
        venue,
        instructor
    } = req.body;

    // Check for required fields
    if (!type || !title || !department || !faculty || !year || !startTime || !endTime || !venue || !instructor) {
        return res.status(400).json({ message: 'All fields are required except dateAdded' });
    }

    try {
        const newSchedule = new Schedules({
            type,
            title,
            department,
            year,
            date,
            startTime,
            endTime,
            venue,
            instructor
        });

        const savedSchedule = await newSchedule.save();
        res.status(201).json(savedSchedule);
    } catch (error) {
        res.status(500).json({ message: 'Error saving schedule', error: error.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
