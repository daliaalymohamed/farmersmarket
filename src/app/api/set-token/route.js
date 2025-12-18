import { NextResponse } from 'next/server';

/**
 * This endpoint is called by the client after Google OAuth
 * It receives the JWT token and sets it as a secure HTTP-only cookie
 */
export async function POST(req) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const response = NextResponse.json(
      { success: true, message: 'Token set successfully' },
      { status: 200 }
    );

    // Set JWT token as HTTP-only cookie
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error setting token:', error);
    return NextResponse.json(
      { error: 'Failed to set token' },
      { status: 500 }
    );
  }
}
