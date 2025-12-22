export const defaultActions = [
    // User Management Actions
    "add_user", "delete_user", 
    // Role Management Actions
    "add_role", "edit_role", "view_roles", 
    "assign_action_to_role","remove_action_from_role", "view_actions",
    "edit_user", "view_users", "view_user", "toggle_user_status", "view_dashboard",
    // Product & Category Management Actions
    "add_category", "edit_category", "delete_category",
    "add_product", "edit_product", "toggle_product_status", "bulk_toggle_product_status",
    // Vendor Management Actions
    "view_vendors", "add_vendor", "edit_vendor", "view_vendor", "toggle_vendor_status", "bulk_toggle_vendor_status","add_to_cart","remove_from_cart","view_cart", "view_checkout",
    // Order Management Actions
    "view_my_orders", "place_order",
    // Shipping Zones Actions
    "view_shipping_zones", "add_shipping_zone", "edit_shipping_zone", "view_shipping_zone","toggle_shipping_zone_status", "bulk_toggle_shipping_zone_status",
    // Warehouses Actions
    "view_warehouses", "add_warehouse", "edit_warehouse", "view_warehouse", "toggle_warehouse_status", "bulk_toggle_warehouse_status"
];
