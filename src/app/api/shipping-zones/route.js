import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/utils/dbConnection";
import ShippingZone from "@/models/shippingZone";
import checkPermission from '@/middlewares/backend_checkPermissionMiddleware';
import { authMiddleware } from '@/middlewares/backend_authMiddleware';
import { ensureActionExistsAndAssignToAdmin } from '@/middlewares/backend_helpers';

// Handle GET (Fetch all zones)
// routing: /api/shipping-zones
export const GET = authMiddleware(async (req) => {
    console.log("🚀 GET /api/shipping-zones?page=1&limit=3&search={}&status=all route hit!"); // ✅ Log that the route was hit
    
    try {
          const requiredAction = "view_shipping_zones"; // Define the required action for this route
        // Connect to the database
        await connectToDatabase();

        // Ensure the required action exists and is assigned to the admin role
        await ensureActionExistsAndAssignToAdmin(requiredAction);
        // ✅ Check if the user has the required permission
        // ✅ Check permission before executing
        const permissionCheck = await checkPermission(requiredAction)(req);
        if (permissionCheck) return permissionCheck; // ❌ If unauthorized, return response
  
          const { searchParams } = new URL(req.url);
          
          // Pagination
          const page = Math.max(parseInt(searchParams.get("page")) || 1, 1);
          const limit = Math.min(parseInt(searchParams.get("limit")) || 3, 50); // max 50 per page
          // Build query dynamically
          const query = {};
          const sort = { createdAt: -1,  _id: -1 }; // Newest first
  
          // 1. Search by name filter
          const search = searchParams.get("search");
          if (search) {
              query.$or = [
                { "name.en": { $regex: search, $options: 'i' } },
                { "name.ar": { $regex: search, $options: 'i' } }
            ];
          }

          // 2. Status filter
          const status = searchParams.get("status");
          if (status === "active") query.active = true;
          else if (status === "inactive") query.active = false;
  

          // Fetch total count
          const total = await ShippingZone.countDocuments(query);
          const totalPages = Math.ceil(total / limit);
          // Fetch zones
          const zones = await ShippingZone.find(query)
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit)
         
          // Return response
          return NextResponse.json({
              zones,
              pagination: {
                  total,
                  page,
                  limit,
                  totalPages,
                  hasNextPage: page < totalPages,
                  hasPrevPage: page > 1
              },
              success: true
          }, { status: 200, headers: {
                  'Cache-Control': 'no-store, must-revalidate',
                  'Pragma': 'no-cache',
                  'Expires': '0'
              } });
  
      } catch (error) {
          console.error('❌ Error fetching zones:', error);
          return NextResponse.json({ message: "Internal Server Error", success: false }, { status: 500,
              headers: {
                  'Cache-Control': 'no-store, must-revalidate',
                  'Pragma': 'no-cache',
                  'Expires': '0'
              }
            });
      }
})

// Handle POST (Create a new zone)
// routing: /api/shipping-zones
export const POST = authMiddleware(async (req) => {
  console.log("🚀 POST /api/shipping-zones route hit!"); // ✅ Log that the route was hit
  
  const requiredAction = "add_shipping_zone"; // Define the required action for this route
  
  try {
      // Connect to the database
      await connectToDatabase();

      // Ensure the required action exists and is assigned to the admin role
      await ensureActionExistsAndAssignToAdmin(requiredAction);
      // ✅ Check if the user has the required permission
      // ✅ Check permission before executing
      const permissionCheck = await checkPermission(requiredAction)(req);
      if (permissionCheck) return permissionCheck; // ❌ If unauthorized, return response
      
      const currentUser = req.user; // Get the current user from the request
        if (!currentUser) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); // ❌ Unauthorized
      }

      // ✅ ALWAYS set createdBy for any create operation
      // Check different possible properties for the user ID
      // Extract user ID safely
      let userId = null;
      if (currentUser.userId && currentUser.userId !== "null") {
        userId = currentUser.userId;
      } else if (currentUser._id && currentUser._id !== "null") {
        userId = currentUser._id;
      } else if (currentUser.id && currentUser.id !== "null") {
        userId = currentUser.id;
      }

      if (!userId) {
        console.warn("⚠️ Could not determine user ID for createdBy");
        return NextResponse.json({ error: "User ID not found" }, { status: 400 });
      }

      // Parse JSON body
      let body;
      try {
        body = await req.json();
      } catch (err) {
        return NextResponse.json(
          { error: "Invalid or missing JSON body" },
          { status: 400 }
        );
      }

      // === VALIDATION ===

      // Validate name (required in both languages)
      if (!body.name?.en || !body.name?.ar) {
        return NextResponse.json(
          { error: "Zone name in both English and Arabic is required" },
          { status: 400 }
        );
      }

      // Validate country (optional, default to Egypt)
      const country = body.country || 'Egypt';

      // Validate shippingFee
      if (typeof body.shippingFee !== 'number' || body.shippingFee < 0) {
        return NextResponse.json(
          { error: "Valid shipping fee (>= 0) is required" },
          { status: 400 }
        );
      }

      // Validate taxRate
      let taxRate = body.taxRate ?? 0.14; // Default 14%
      if (typeof taxRate !== 'number' || taxRate < 0 || taxRate > 1) {
        return NextResponse.json(
          { error: "Tax rate must be a number between 0 and 1" },
          { status: 400 }
        );
      }

      // Parse zipCodes (array of strings)
      let zipCodes = [];
      if (body.zipCodes) {
        if (Array.isArray(body.zipCodes)) {
          zipCodes = body.zipCodes.filter(code => typeof code === 'string' && code.trim());
        } else if (typeof body.zipCodes === 'string') {
          zipCodes = body.zipCodes.split(',').map(c => c.trim()).filter(Boolean);
        } else {
          return NextResponse.json(
            { error: "zipCodes must be an array or comma-separated string" },
            { status: 400 }
          );
        }
      }

      // Parse cityNames (array of { en, ar })
      let cityNames = [];
      if (body.cityNames) {
        if (Array.isArray(body.cityNames)) {
          cityNames = body.cityNames
            .filter(city => city.en || city.ar)
            .map(city => ({
              en: String(city.en || '').trim(),
              ar: String(city.ar || '').trim()
            }));
        } else {
          return NextResponse.json(
            { error: "cityNames must be an array of objects with 'en' and 'ar'" },
            { status: 400 }
          );
        }
      }

      // At least one location rule must exist
      if (zipCodes.length === 0 && cityNames.length === 0) {
        return NextResponse.json(
          { error: "At least one ZIP code or city name is required" },
          { status: 400 }
        );
      }

      // Build zone object
      const createdData = {
        name: {
          en: body.name.en.trim(),
          ar: body.name.ar.trim()
        },
        zipCodes,
        cityNames,
        country,
        shippingFee: Number(body.shippingFee),
        taxRate,
        createdBy: userId,
        updatedBy: userId
      };

    const newZone = new ShippingZone(createdData);
    await newZone.save();

    // Populate references (optional)
    const populatedZone = await ShippingZone.populate(newZone, [
      { path: 'createdBy', select: 'firstName lastName email' },
      { path: 'updatedBy', select: 'firstName lastName email' }
    ]);

    return NextResponse.json(
      {
        message: 'Shipping zone has been created successfully',
        zone: populatedZone
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("❌ Error creating shipping zone:", error);

    // Handle duplicate key (e.g., unique constraint on name)
    if (error.code === 11000) {
      return NextResponse.json(
        { 
          error: "A zone with this name already exists", 
          details: error.message 
        },
        { status: 409 }
      );
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: error.message 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: "Failed to create shipping zone", 
        details: error.message 
      },
      { status: 500 }
    );
  }
});

// Handle PATCH (toggle shipping zone or shipping zones to together)
// routing: /api/shipping-zones
export const PATCH = authMiddleware(async (req) => {
  console.log("🚀 PATCH /api/shipping-zones route hit!"); // ✅ Log that the route was hit

  try {
    const requiredAction = "bulk_toggle_shipping_zone_status"; // Define the required action for this route
    
    // Connect to the database
    await connectToDatabase();

    // Ensure the required action exists and is assigned to the admin role
    await ensureActionExistsAndAssignToAdmin(requiredAction);

    // ✅ Check if the user has the required permission
    const permissionCheck = await checkPermission(requiredAction)(req);
    if (permissionCheck) return permissionCheck; // ❌ If unauthorized, return response

    const currentUser = req.user; // Get the current user from the request
    if (!currentUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); // ❌ Unauthorized
    }

    // Check different possible properties for the user ID
    // Extract user ID safely
    let userId = null;
    if (currentUser.userId && currentUser.userId !== "null") {
      userId = currentUser.userId;
    } else if (currentUser._id && currentUser._id !== "null") {
      userId = currentUser._id;
    } else if (currentUser.id && currentUser.id !== "null") {
      userId = currentUser.id;
    }

    if (!userId) {
      console.warn("⚠️ Could not determine user ID for createdBy");
      return NextResponse.json({ error: "User ID not found" }, { status: 400 });
    }
    
    const { zoneIds, active } = await req.json();

    if (!Array.isArray(zoneIds) || zoneIds.length === 0) {
      return NextResponse.json(
        { error: 'Valid zones Ids array is required' },
        { status: 400 }
      );
    }

    if (typeof active !== 'boolean') {
      return NextResponse.json(
        { error: 'Active status must be boolean' },
        { status: 400 }
      );
    }

    // Update all shipping zones with the given IDs
    const updatedZones = await ShippingZone.updateMany(
      { _id: { $in: zoneIds } },
      { 
        active,
        updatedBy: userId
      }
    );

    if (updatedZones.matchedCount === 0) {
      return NextResponse.json(
        { error: 'No shipping zones  were found to update' },
        { status: 404 }
      );
    }

    // Fetch updated shipping zones with populated createdBy/updatedBy
    const zones = await ShippingZone.find({ _id: { $in: zoneIds } })
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    return NextResponse.json({
      message: `Updated ${zones.length} shipping zones successfully`,
      zones,
    }, { status: 200 });

  } catch (error) {
    console.error('Bulk toggle error:', error);
    return NextResponse.json(
      { error: 'Failed to update shipping zones' },
      { status: 500 }
    );
  }
});