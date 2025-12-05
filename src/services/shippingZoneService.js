import ShippingZone from '@/models/shippingZone'; // Import the shipping zone model
import mongoose from 'mongoose';

// Fetch a shipping zone by ID
export const getShippingZoneById = async (id) => {
    // 🛡️ OPTIONAL: Ignore source map requests in development
    if (id.endsWith('.map')) {
        return new Response(null, { status: 204 });
    }

    // 🛡️ Validate ID format before calling the service
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return new Response(JSON.stringify({ error: 'Invalid vendor ID format' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    try {
        const zone = await ShippingZone.findById(id)
        .populate([
            {
                path: "createdBy",
                model: "User"
            },
            {
                path: "updatedBy",
                model: "User"
            }
        ]);
        return zone;
    } catch (error) {
        console.error('Error fetching zone by ID:', error);
        throw error; // Rethrow the error to be handled by the calling function
    }
};