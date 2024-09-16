require("dotenv").config();
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

// Check if token is blacklisted
const jwtBlacklist = new Set();
const isTokenBlacklisted = (token) => jwtBlacklist.has(token);

// Verify token function
const verifyToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        reject(new Error("Invalid token"));
      } else {
        resolve(decoded);
      }
    });
  });
};

// Middleware to authenticate token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401); // No token provided

  // Check if the token is blacklisted
  if (isTokenBlacklisted(token)) return res.sendStatus(403);

  try {
    // Verify token and fetch user
    const decoded = await verifyToken(token);
    const fetchedUser = await User.getUserByEmail(decoded.email);
    if (!fetchedUser) return res.sendStatus(404);

    req.user = fetchedUser; // Set user in req object
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error("Error during authentication:", error.message);
    res.sendStatus(403); // Forbidden
  }
};

// Middleware to check if authenticated
const isAuthenticated = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Extract token from Bearer header

  if (!token) return res.sendStatus(401); // No token provided

  verifyToken(token)
    .then((user) => {
      req.user = user; // Attach user info to the request
      next(); // Proceed to the next middleware or route handler
    })
    .catch((error) => {
      console.error("Error verifying token:", error.message);
      res.status(401).json({ message: "Invalid token" }); // Handle invalid token
    });
};

// Middleware to check user role
const checkRole = (expectedRoles) => async (request, response, next) => {
  try {
    // Extract the token from the Authorization header
    const authHeader = request.headers.authorization;

    // Check if the Authorization header exists and starts with 'Bearer '
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("Authorization header is missing or improperly formatted");
      return response.status(401).json({
        success: false,
        message: "Unauthorized! Missing or invalid token.",
        error: 2,
      });
    }

    // Get the token part after "Bearer "
    const token = authHeader.split(" ")[1];

    // If the token is still undefined or empty
    if (!token) {
      return response.status(401).json({
        success: false,
        message: "Unauthorized! Token not provided.",
        error: 2,
      });
    }

    // Verify the token
    const user = await verifyToken(token);

    // Check if the user's role is in the expected roles
    if (!expectedRoles.includes(parseInt(user.role))) {
      const roleMessages = expectedRoles.map((role) => {
        switch (role) {
          case 1:
            return "Super Admin";
          case 2:
            return "Admin";
          case 3:
            return "User";
          default:
            return "Unknown Role";
        }
      });
      return response.status(403).json({
        success: false,
        message: `Forbidden! You are not authorized. Expected roles: ${roleMessages.join(
          ", "
        )}.`,
        error: 3,
      });
    }

    // Attach the user to the request object for future middleware
    request.user = user;
    next();
  } catch (error) {
    console.error("Error verifying token:", error.message);
    return response.status(401).json({
      success: false,
      message: "Unauthorized! " + error.message,
      error: 2,
    });
  }
};

const isSuperAdmin = checkRole([1]);
const isAdmin = checkRole([2]);
const isUser = checkRole([3]);
const isSuperAdminOrAdmin = checkRole([1, 2]);

module.exports = {
  authenticateToken,
  isAuthenticated,
  isAdmin,
  isUser,
  isSuperAdmin,
  isSuperAdminOrAdmin,
};
