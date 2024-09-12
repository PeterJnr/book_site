// authMiddleware.js
require("dotenv").config();
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const jwtBlacklist = new Set();
const isTokenBlacklisted = (token) => jwtBlacklist.has(token);

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
    if (err) return res.sendStatus(403);

    try {
      // Fetch user from database using the decoded email
      const fetchedUser = await User.getUserByEmail(user.email);
      if (!fetchedUser) return res.sendStatus(404);

      req.user = fetchedUser; // Set user in req object
      next();
    } catch (error) {
      console.error("Error fetching user:", error);
      return res.sendStatus(500); // Internal Server Error
    }
  });
};

const verifyToken = (authHeader) => {
  if (!authHeader) {
    throw new Error("No authorization header provided");
  }

  const token = authHeader.split(" ")[1];

  if (isTokenBlacklisted(token)) {
    throw new Error("This Authentication Session is terminated; Login!");
  }

  // Access JWT_SECRET from environment variables
  const JWT_SECRET = process.env.JWT_SECRET; // Ensure this is defined correctly
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined"); // This error will occur if JWT_SECRET is not found
  }

  // Verify the token using jwt.verify
  return jwt.verify(token, JWT_SECRET);
};

const isAuthenticated = (request, response, next) => {
  try {
    const user = verifyToken(request.headers.authorization);
    request.user = user;
    next();
  } catch (error) {
    return response.status(401).json({
      success: false,
      message: "Unauthorized! " + error.message,
      error: 1,
    });
  }
};

const isAdmin = (request, response, next) => {
  console.log('user', request.user)
  try {
    const authHeader = request.headers.authorization;

    // Check if Authorization header is provided
    if (!authHeader) {
      return response.status(401).json({
        success: false,
        message: "Unauthorized! Missing authorization header.",
        error: 2,
      });
    }

    // Extract the token from the Authorization header
    const token = authHeader.split(" ")[1]; // Assuming 'Bearer <token>'

    if (!token) {
      return response.status(401).json({
        success: false,
        message: "Unauthorized! Token not provided.",
        error: 2,
      });
    }

    // Verify the token
    const secretKey = process.env.JWT_SECRET; // Ensure this environment variable is set
    const user = jwt.verify(token, secretKey);

    // Check if the user role is 2 (Admin)
    if (parseInt(user.role) !== 2) {
      return response.status(403).json({
        success: false,
        message: "Forbidden! You are not authorized. Only Admins are allowed.",
        error: 3,
      });
    }

    // Attach user object to request and proceed
    request.user = user;
    next();
  } catch (error) {
    return response.status(401).json({
      success: false,
      message: "Unauthorized! " + error.message,
      error: 2,
    });
  }
};

// const checkRole = (expectedRole) => (request, response, next) => {
//   try {
//     console.log('request', request)
//     const authHeader = request.headers.authorization;
//     if (!authHeader) {
//       return response.status(401).json({
//         success: false,
//         message: "Unauthorized! Missing authorization header.",
//         error: 2,
//       });
//     }

//     const user = verifyToken(authHeader);

//     if (parseInt(user.role) !== expectedRole) {
//       const roleMessage = (() => {
//         switch (expectedRole) {
//           case 1:
//             return "Super Admin";
//           case 2:
//             return "Admin";
//           case 3:
//             return "User";
//           default:
//             return "Unknown";
//         }
//       })();

//       return response.status(403).json({
//         success: false,
//         message: `Forbidden! You are not authorized. Expected role: ${roleMessage}.`,
//         error: 3,
//       });
//     }

//     request.user = user; // Attach user object to request
//     next(); // Proceed to the next middleware or route handler
//   } catch (error) {
//     return response.status(401).json({
//       success: false,
//       message: "Unauthorized! " + error.message,
//       error: 2,
//     });
//   }
// };

// const isSuperAdmin = checkRole(1);
// const isAdmin = checkRole(2);
// const isUser = checkRole(3);

module.exports = {
  authenticateToken,
  isAuthenticated,
  // isSuperAdmin,
  isAdmin,
  // isUser,
};
