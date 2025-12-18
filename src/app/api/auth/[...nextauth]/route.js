import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import mongoose from "mongoose";
import User from "@/models/user";
import Role from "@/models/role";
import jwt from "jsonwebtoken";

const MONGODB_URI = process.env.MONGODB_URI;

// Simple connection without initialization to avoid timeout
async function connectDB() {
  if (mongoose.connections[0].readyState === 1) {
    return; // Already connected
  }
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
  } catch (error) {
    console.error("DB connection failed:", error);
    throw error;
  }
}

export const authOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    pages: {
        signIn: "/login",
    },
    cookies: {
      token: {
        name: process.env.NODE_ENV === "production" ? "__Secure-token" : "token",
        options: {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60, // 7 days
        },
      },
    },
    callbacks: {
        // ✅ SignIn callback to handle user creation and token generation
        async signIn({ user, account, profile }) {
            try {
              await connectDB();
            
              // Check if user exists
              let dbUser = await User.findOne({ email: user.email }).populate({
                path: "roleId",
                populate: { path: "actions", model: "Action" },
              });

              // If user doesn't exist, create one
              if (!dbUser) {
                const role = await Role.findOne({ name: "user" });
                if (!role) {
                  console.error("Role 'user' not found");
                  return false;
                }

                dbUser = new User({
                  firstName: profile.given_name || user.name?.split(" ")[0] || "User",
                  lastName: profile.family_name || user.name?.split(" ")[1] || "",
                  email: user.email,
                  password: "GOOGLE_OAUTH",
                  phoneNumber: "",
                  roleId: role._id,
                  tokenVersion: 0,
                  googleId: profile.sub,
                });
                await dbUser.save();
                dbUser = await dbUser.populate({
                  path: "roleId",
                  populate: { path: "actions", model: "Action" },
                });
              }

              // Generate JWT token
              const jwtToken = jwt.sign(
                {
                  userId: dbUser._id.toString(),
                  role: dbUser.roleId.name,
                  tokenVersion: dbUser.tokenVersion,
                },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
              );

              // Store in user object
              user.customToken = jwtToken;
              user.userId = dbUser._id.toString();
              user.roleId = dbUser.roleId;
              user.firstName = dbUser.firstName;
              user.lastName = dbUser.lastName;

              return true;
            } catch (error) {
              console.error("SignIn callback error:", error.message);
              return false;
            }
        },

        // ✅ JWT callback
        async jwt({ token, user }) {
          if (user) {
            token.customToken = user.customToken;
            token.userId = user.userId;
            token.roleId = user.roleId;
            token.firstName = user.firstName;
            token.lastName = user.lastName;
          }
          return token;
        },

        // ✅ Session callback
        async session({ session, token }) {
          if (token) {
            session.user.customToken = token.customToken;
            session.user.userId = token.userId;
            session.user.roleId = token.roleId;
            session.user.firstName = token.firstName;
            session.user.lastName = token.lastName;
          }
          return session;
        },

        // ✅ SignOut callback - clear server-side state
        async signOut({ token }) {
          try {
            await connectDB();
            
            if (token?.userId) {
              // Optional: Increment tokenVersion to invalidate all sessions
              const dbUser = await User.findById(token.userId);
              if (dbUser) {
                dbUser.tokenVersion += 1;
                await dbUser.save();
                console.log("User tokenVersion incremented for logout");
              }
            }
          } catch (error) {
            console.error("SignOut callback error:", error);
          }
          return true;
        },
    },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };