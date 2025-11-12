// app/api/auth/logout/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/utils/dbConnection';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// 👇 Define clearAuthCookies inside the file or import it
const clearAuthCookies = (response) => {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Use HTTPS in production
    sameSite: 'strict',
    path: '/',
    maxAge: -1, // Expire immediately → deletes cookie
  };

  response.cookies.set('token', '', options);
  return response;
};

export const POST = async (req) => {
  try {
    await connectToDatabase();

    // Get token from Authorization header
    const authHeader = req.headers.get('authorization');
    let token = null;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // Optional: Also check cookies if needed
    // const cookieStore = cookies();
    // token = token || cookieStore.get('auth_token')?.value;

    // If we have a token, try to invalidate session via tokenVersion
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const User = mongoose.models.User || mongoose.model('User');

        const user = await User.findById(decoded.userId);
        if (user) {
          // 🔐 Invalidate all active sessions by incrementing version
          user.tokenVersion += 1;
          await user.save();
        }
      } catch (err) {
        console.warn("Token already expired or invalid:", err.message);
        // Continue anyway — goal is to clear cookie
      }
    }

    // ✅ Create response and clear HTTP-only cookie
    const response = NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );

    // 💥 Clear the auth cookie
    clearAuthCookies(response);

    return response;
  } catch (error) {
    console.error('Logout failed:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
};