// jwt implementation, authentication middleware for Next.js API routes
// This middleware will check if the request has a valid JWT token in the Authorization header
// If the token is valid, it will attach the user data to the request object
// If the token is invalid, it will return a 400 response
// If the token is missing, it will return a 401 response
// If JWT_SECRET is not defined, it will return a 500 response
// export default authMiddleware;
import jwt from 'jsonwebtoken';
import User from '@/models/user';
import { NextResponse } from 'next/server';

// Auth Middleware for Next.js API Routes
export const authMiddleware = (handler) => async (req, context) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ message: 'You have no authorization to access' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ message: 'Access denied' }, { status: 401 });
    }

    // Check JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined');
      return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

     // Fetch user from database
    const user = await User.findById(decoded.userId);
    if (!user || user.tokenVersion !== decoded.tokenVersion) {
      return NextResponse.json({ message: 'Token is invalidated' }, { status: 401 });
    }
    req.user = decoded; // Attach user data to request

    // Continue to the actual API handler
    // ✅ Pass both req and context!
    return handler(req, context);
  } catch (err) {
    console.error('Invalid token', err);
    return NextResponse.json({ message: 'Invalid token' }, { status: 400 });
  }
};
