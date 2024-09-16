require("dotenv").config();
const express = require('express');
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const app = express();
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// Rate limiter setup
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // limit each IP to 5000 requests per windowMs
});

// Apply the rate limiter to all requests
app.use(limiter);

const APP_VERSION = "V1";

const authRoute = require("./routes/auth.routes");
const webRoute = require("./routes/web.routes");

app.use(`/${APP_VERSION}/auth`, authRoute);
app.use(`/${APP_VERSION}/web`, webRoute);

// Set up CORS
app.use(cors({
  origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
      } else {
          callback(new Error('Not allowed by CORS'));
      }
  },
  allowedHeaders: ['Content-Type', 'Authorization', 'activitypassword'],
}));

// Define the port
const port = process.env.PORT || 3000;

// Basic route to test the server
app.get('/', (req, res) => {
  res.send('Hello Advanztek!');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Server is running.' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
