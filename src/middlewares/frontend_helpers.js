// A helper function for checking permissions
export const checkPermission = (actions, requiredPermissions) => {
  return requiredPermissions.every(permission => 
    actions?.some(action => action.name === permission)
  );
};