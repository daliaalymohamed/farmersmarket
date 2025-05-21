// app/api/users/check/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/utils/dbConnection";
import { getUserById } from "@/services/userService"; // Adjust the import path as necessary
import jwt from "jsonwebtoken";

export const GET = async (req) => {
  await connectToDatabase(); // ✅ Connect to the database
  const token = req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ message: "No token provided" }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await getUserById(decoded.userId); // Adjust the import path as necessary
    
    // console.log("Decoded Token:", decoded); // Debugging
    // console.log("User from DB:", user); // Debugging

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 401 });
    }

    //  ✅ Check token version match
    if (user.tokenVersion !== decoded.tokenVersion) {
        return NextResponse.json(
            { message: "Token version mismatch (stale token)" },
            { status: 403 }
        );
    }
    return NextResponse.json({ user: { ...user.toObject(), token } }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ message: "Invalid or expired token" }, { status: 401 });
  }
}
