import Action from '@/models/action';
import Role from '@/models/role';
import jwt from 'jsonwebtoken';
// Only import fs when on server-side
let fs;
if (typeof window === 'undefined') {
  fs = require('fs/promises');
}
const JWT_SECRET = process.env.JWT_SECRET;

// Function to ensure an action exists and assign it to the admin role
export const ensureActionExistsAndAssignToAdmin = async(actionName) => {
    try {
        // Check if the action already exists
        let action = await Action.findOne({ name: actionName });

        // If the action doesn't exist, create it
        if (!action) {
            action = new Action({ name: actionName });
            await action.save();
        }

        // Find the admin role
        const adminRole = await Role.findOne({ name: 'admin' });

        if (!adminRole) {
            throw new Error('Admin role not found');
        }

        // Assign the action to the admin role using updateOne
        await Role.updateOne(
            { name: 'admin' },
            { $addToSet: { actions: action._id } }
        );

        console.log(`Action "${actionName}" has been assigned to the admin role.`);
    } catch (error) {
        console.error('Error ensuring action exists:', error);
        throw error; // Propagate the error
    }
}

// Function to verify JWT token
export const verifyJWT = async (token) => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    throw new Error('Invalid token');
  }
};
// Function to verify JWT token on the server side
export async function verifyTokenServer(token) {
  try {
    // Verify token directly on server side
    const decoded = await verifyJWT(token);
    
    if (!decoded?.userId) {
      // Don't throw an error, return null instead
      return null;
    }

    return decoded;
  } catch (error) {
    // Log quietly in development
    if (process.env.NODE_ENV === 'development') {
      console.info('Server token verification failed:', error.message);
    }
    
    // Return null instead of throwing
    return null;
  }
}


// delete file from the file system
export const deleteFile = async (filePath) => {
  if (typeof window !== 'undefined') {
    throw new Error('File operations can only be performed server-side');
  }
  console.log('Deleting file:', filePath);
  try {
    // Check if the file exists and delete it
    await fs.access(filePath); // Check if file exists
    await fs.unlink(filePath); // Delete it
    console.log(`File ${filePath} deleted successfully`);
  } catch (err) {
    if (err.code === 'ENOENT') {
      // File not found, log a warning
      console.warn(`File ${filePath} does not exist. Skipping deletion.`);
    } else {
      // Other errors, log and reject
      console.error(`Error deleting file ${filePath}:`, err);
      throw err;
    }
  }
};