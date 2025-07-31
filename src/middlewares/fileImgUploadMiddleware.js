// for upload management
import fs from 'fs/promises';
import path from "path";
import { lookup } from 'mime-types';

// Helper to ensure directory exists
const ensureDirectoryExists = async (dir) => {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
    console.log(`✅ Created folder: ${dir}`);
  }
};

// Generate Safe File Names
function generateSafeFileName(fieldName) {
  const timestamp = Date.now();
  const randomStr = Math.round(Math.random() * 1e9);
  return `${fieldName}-${timestamp}-${randomStr}`;
}

// Allowed types and size limits
const allowedTypes = {
  images: {
    types: ["image/jpeg", "image/png", "image/jpg", "image/gif", "image/webp"],
    maxSize: 1 * 1024 * 1024, // 1 MB
  },
  files: {
    types: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    maxSize: 500 * 1024,
  },
  videos: {
    types: ["video/mp4"],
    maxSize: 50 * 1024 * 1024,
  },
};

/**
 * Usage:
 * const { uploadedFiles, fields } = await uploadMiddleware(req, [
 *   { fieldName: "image", category: "images", folder: "/uploads/categories/images", isArray: false },
 * ]);
 */

export async function uploadMiddleware(req, configs) {
  const formData = await req.formData();

  const uploadedFiles = {};
  const fields = {};

  for (const config of configs) {
    const { fieldName, category, folder, isArray = false } = config;

    const values = formData.getAll(fieldName);

    if (!values || values.length === 0 || !values[0]) {
      uploadedFiles[fieldName] = isArray ? [] : null;
      continue;
    }

    // If it's a file (Blob), process upload
    // Handle file uploads
    if (values[0] instanceof Blob) {
      const validFilenames = [];

      for (const file of values) {
        const buffer = Buffer.from(await file.arrayBuffer());

        // Validate MIME type based on extension
        const ext = path.extname(file.name).toLowerCase();
        const mimeType = lookup(ext) || file.type;

        const { types, maxSize } = allowedTypes[category];
        if (!types.includes(mimeType)) {
          throw new Error(`Invalid file type for ${fieldName}. Allowed: ${types.join(', ')}`);
        }
        if (file.size > maxSize) {
          throw new Error(`File too large: ${file.name}`);
        }

        // Generate safe name
        const uniqueName = `${generateSafeFileName(fieldName)}${ext}`;
        const destPath = path.join(folder, uniqueName);

        // Ensure folder exists
        await ensureDirectoryExists(path.dirname(destPath));

        // Write file
        await fs.writeFile(destPath, buffer);
        console.log(`✅ Uploaded: ${destPath}`);

        validFilenames.push(uniqueName);
      }

      uploadedFiles[fieldName] = isArray ? validFilenames : validFilenames[0];
    } else {
      fields[fieldName] = isArray ? values : values[0];
    }
  }


  // Extract remaining form fields
  for (const [key, value] of formData.entries()) {
    if (!configs.some(c => c.fieldName === key)) {
      fields[key] = value;
    }
  }

  return { fields, uploadedFiles };
}