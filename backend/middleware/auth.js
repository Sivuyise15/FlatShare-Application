
// backend/middleware/auth.js
{/* This middleware verifies Firebase ID tokens in incoming requests. 
  It checks for the token in the Authorization header, verifies it using Firebase Admin SDK,
  and attaches the decoded user information to the request object for use in subsequent handlers. */}

const { auth } = require('../firebase');

// Middleware to verify Firebase ID token
const authMiddleware = async (req, res, next) => {
  try {
    console.log("Auth middleware called");
    
    // Get the authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authorization header is required' 
      });
    }

    // Check if it starts with 'Bearer '
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authorization header must start with "Bearer "' 
      });
    }

    // Extract the token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Token is required' 
      });
    }

    console.log("Verifying token...");
    
    // Verify the token with Firebase Admin
    const decodedToken = await auth.verifyIdToken(token);
    
    console.log("Token verified for user:", decodedToken.uid);
    
    // Add user info to request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      // Add any other fields you need from the token
    };

    // Continue to next middleware/route handler
    next();
    
  } catch (error) {
    console.error("Auth middleware error:", error);
    
    // Handle specific Firebase auth errors
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ 
        success: false, 
        error: 'Token expired. Please log in again.' 
      });
    }
    
    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({ 
        success: false, 
        error: 'Token revoked. Please log in again.' 
      });
    }
    
    if (error.code === 'auth/argument-error') {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid token format' 
      });
    }

    // Generic auth error
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid or expired token' 
    });
  }
};

module.exports = authMiddleware;