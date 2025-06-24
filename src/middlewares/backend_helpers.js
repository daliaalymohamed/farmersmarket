import Action from '@/models/action';
import Role from '@/models/role';
import jwt from 'jsonwebtoken';

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
      throw new Error('Invalid token');
    }

    return decoded;
  } catch (error) {
    console.error('Server token verification failed:', error);
    throw error;
  }
}