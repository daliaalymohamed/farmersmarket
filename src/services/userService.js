// Business logic for user-related operations
import User from '@/models/user'; 
import Role from "@/models/role";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// Fetch a user by ID
export const getUserById = async (id) => {
    try {
        const user = await User.findById(id) // Fetch user by ID from the database
                        .select("-password") // Hide password from the response
                        .populate({
                            path: "roleId",
                            populate: {
                                path: "actions", // <== Make sure this matches your schema
                                model: "Action", // <== Replace with your actual model name
                            }
                        });
        
        return user;
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        throw error; // Rethrow the error to be handled by the calling function
    }
};

// Register a new user
export const registerUser = async (userData) => {
    try {
        const { firstName, lastName, email, phoneNumber, password } = userData;
        console.log('userData:', userData);
        // Check if the user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new Error('User already exists');
        }

        // Find the role with type "user"
        const role = await Role.findOne({ name: "user" });
        if (!role) {
            throw new Error("Role with type 'user' not found");
        }

        // Create a new user
        const newUser = new User({
            firstName,
            lastName,
            email,
            phoneNumber,
            password, // Save raw password; it will be hashed automatically
            roleId: role._id,
            tokenVersion: 0 // Default tokenVersion
        });

        // Save the user to the database
        await newUser.save();

        return newUser;
    } catch (error) {
        console.error('Error registering user:', error);
        throw error;
    }
};

// Login a user
export const loginUser = async ({ email, password }) => {
    if (!email || !password) {
        throw new Error("Email and password are required");
    }

    // Find user by email and populate the roleId field
    const user = await User.findOne({ email }).populate({
        path: "roleId", // Populate the roleId field
        populate: {
            path: "actions", // If the role has an `actions` field that references another model
            model: "Action", // Replace with your actual model name for actions
        },
    });
    
    // If user does not exist, return an error
    if (!user) {
        throw new Error("User does not exist");
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error("Invalid email or password");
    }

    // Increment tokenVersion to invalidate old tokens
    user.tokenVersion += 1;
    await user.save();

    // Generate JWT token with tokenVersion
    const token = jwt.sign(
        { userId: user._id, role: user.roleId.name, tokenVersion: user.tokenVersion },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    // Return user data with token (excluding password)
    return {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        roleId: user.roleId,
        active: user.active,
        token: token,
        message: `User ${user.firstName} ${user.lastName} logged in successfully`,
    };
};
