const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./src/config/db');
const { notFound, errorHandler } = require('./src/middlewares/errorMiddleware');

// Load env vars
dotenv.config();

// Connect to database
connectDB().then(async () => {
    // Seed the database since we are using an in-memory DB or a fresh start
    const seedData = require('./seedData');
    await seedData();
});

const app = express();

// Middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}
app.use(express.json());

// CORS Configuration
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:5000',
            'https://hospitileims-euhxnlq7c-himanshu87701-2106s-projects.vercel.app',
            'https://hospitileims-git-main-himanshu87701-2106s-projects.vercel.app',
            process.env.FRONTEND_URL
        ].filter(Boolean);
        
        // Allow all origins during development/testing
        callback(null, true);
    },
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Routes
app.use('/auth', require('./src/routes/authRoutes'));
app.use('/attendance', require('./src/routes/attendanceRoutes'));
app.use('/patients', require('./src/routes/patientRoutes'));
app.use('/inventory', require('./src/routes/inventoryRoutes'));
app.use('/messages', require('./src/routes/messageRoutes'));
app.use('/notes', require('./src/routes/noteRoutes'));

// Root route
const path = require('path');

if (process.env.NODE_ENV === 'production') {
    // Set static folder
    app.use(express.static(path.join(__dirname, '../frontend_IMS/dist')));

    app.get('*', (req, res) =>
        res.sendFile(path.resolve(__dirname, '../', 'frontend_IMS', 'dist', 'index.html'))
    );
} else {
    app.get('/', (req, res) => {
        res.send('API is running...');
    });
}

// Error Handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
