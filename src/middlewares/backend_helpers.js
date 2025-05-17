import Action from '@/models/action';
import Role from '@/models/role';

/// Function to ensure an action exists and assign it to the admin role
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
