import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/utils/dbConnection";
import { registerUser } from '@/services/userService';

// Handle POST (Register)
// routing: /register
export const POST = async (req) => {
    console.log("🚀 POST /register route hit!");

    try {
        await connectToDatabase();

        // Parse the request body
        const rawBody = await req.text();
        if (!rawBody) {
            return NextResponse.json({ error: "Request body is empty" }, { status: 400 });
        }

        const userData = JSON.parse(rawBody);

        // Call register function (returns new user data or error)
        const newUser = await registerUser(userData);

        return NextResponse.json({
            message: 'Registration successful. Please login to continue',
            user: newUser
        }, { status: 201 }); // ✅ Created
    } catch (error) {
        console.error('Registration Error:', error);

        // Handle specific errors
        if (error.message === 'User already exists' || error.message === "Role with type 'user' not found") {
            return NextResponse.json({
                error: error.message
            }, { status: 400 }); // ❌ Bad request
        }

        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message
        }, { status: 500 }); // ❌ Server error
    }
}