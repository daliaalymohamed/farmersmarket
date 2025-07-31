// app/api/images/category/[imageName]/route.js
import { readFile } from 'fs/promises';
import { join } from 'path';
import { lookup } from 'mime-types';

// Handle GET (Fetch product image)
// routing: /api/images/category/imageName
export const GET = async (req, context) => {
    const params = await context.params;
    const imageName = params.imageName;

    // Path to uploaded image
    const imagePath = join(
        process.cwd(),
        'src',
        'app',
        'api',
        'uploads',
        'products',
        'images',
        decodeURIComponent(imageName)
    );

    try {
        const buffer = await readFile(imagePath);

        // Set content type based on file extension
        const ext = imageName.split('.').pop().toLowerCase();
        const contentType = lookup(ext) || 'application/octet-stream';

        // Optional: Add security check for valid image extensions
        const validExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'];
        if (!validExtensions.includes(ext)) {
            return new Response('Invalid image format', { status: 400 });
        }

        return new Response(buffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'max-age=31536000', // 1 year cache
            },
        });
    } catch (error) {
        console.error(`❌ Failed to load image: ${imageName}`, error);
        return new Response('Image not found', { status: 404 });
    }
}