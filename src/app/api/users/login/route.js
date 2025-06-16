import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/utils/dbConnection";
import { loginUser } from '@/services/userService';

// Handle POST (Login)
// routing: /login
export const POST = async (req) => {
    console.log("🚀 POST /login route hit!"); // ✅ Log that the route was hit

    try {
        await connectToDatabase(); // ✅ Connect to the database

        // ✅ Read the raw request body
        const rawBody = await req.text();
        if (!rawBody) {
            // ❌ Return a 400 error if the request body is empty
            return NextResponse.json({ error: "Request body is empty" }, { status: 400 });
        }

        // ✅ Parse JSON from request body
        const userData = JSON.parse(rawBody);

        // ✅ Call login function (returns user data or error)
        const loggedInUser = await loginUser(userData);

        // ✅ Create the response
        const response = NextResponse.json({
            message: 'You are logged in successfully',
            user: loggedInUser
        }, { status: 200 }); // ✅ HTTP 200 OK

        // ✅ Set the token in an HTTP-only cookie
        response.cookies.set({
            name: 'token',
            value: loggedInUser.token,
            httpOnly: true,
            secure: process.env.SECURECOOKIE,
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });

        return response;

    } catch (error) {
        console.error('Login Error:', error); // ❌ Log the error for debugging

        // ✅ Handle "User does not exist" error properly
        if (error.message === "User does not exist") {
            return NextResponse.json({
                error: "User not found",
                details: error.message
            }, { status: 404 }); // ❌ HTTP 404 Not Found
        }

        // ✅ Handle "Invalid email or password" error properly
        if (error.message === "Invalid email or password") {
            return NextResponse.json({
                error: "Invalid credentials",
                details: error.message
            }, { status: 401 }); // ❌ HTTP 401 Unauthorized
        }

        // ❌ Default response for any other errors (server issue)
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message
        }, { status: 500 }); // ❌ HTTP 500 Internal Server Error
    }
};
