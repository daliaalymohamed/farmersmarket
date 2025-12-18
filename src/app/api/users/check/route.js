// app/api/users/check/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/utils/dbConnection";
import { getUserById } from "@/services/userService";
import jwt from "jsonwebtoken";

export const GET = async (req) => {
  try {
    await connectToDatabase();
    
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ message: "No token provided" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error("JWT verification failed:", err.message);
      return NextResponse.json({ message: "Invalid or expired token", details: err.message }, { status: 401 });
    }

    if (!decoded || !decoded.userId) {
      return NextResponse.json({ message: "Invalid token payload" }, { status: 401 });
    }

    const user = await getUserById(decoded.userId);

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 401 });
    }

    // Check token version match
    if (user.tokenVersion !== decoded.tokenVersion) {
        return NextResponse.json(
            { message: "Token version mismatch (stale token)" },
            { status: 403 }
        );
    }
    
    return NextResponse.json({ user: { ...user.toObject(), token } }, { status: 200 });
  } catch (err) {
    console.error("Check auth error:", err.message);
    return NextResponse.json({ message: "Internal server error", details: err.message }, { status: 500 });
  }
}
