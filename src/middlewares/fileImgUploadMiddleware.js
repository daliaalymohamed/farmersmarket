// for upload management
import multer from "multer";
import path from "path";
import fs from "fs";
/**
 * how to use the middleware ex:
 * uploadMiddleware([
    {
      folder: "uploads/users/images",
      category: "images",
      fieldName: "profilePic", // Field for a single image
      isArray: false, // Default behavior for single files
    },
  ]),
 */

// Ensure the directory exists
const ensureDirectoryExists = (dir) => {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Directory created: ${dir}`);
    } else {
      console.log(`Directory already exists: ${dir}`);
    }
  } catch (error) {
    console.error(`Error creating directory: ${error.message}`);
    throw error;
  }
};

// Allowed MIME types and size limits (in bytes)
const allowedTypes = {
  images: {
    types: ["image/jpeg", "image/png", "image/jpg", "image/gif", "image/webp"],
    maxSize: 500 * 1024, // 500 KB
  },
  files: {
    types: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    maxSize: 500 * 1024, // 500 KB
  },
  videos: {
    types: ["video/mp4"],
    maxSize: 50 * 1024 * 1024, // 50 MB
  },
};

// Multer middleware factory for multiple configurations
const uploadMiddleware = (configs) => {
  const storages = configs.map(({ folder, fieldName }) => {
    ensureDirectoryExists(folder);

    return multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, folder);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        const fileName = `${fieldName}-${uniqueSuffix}${ext}`;
        req.uploadedFiles = req.uploadedFiles || {}; // Ensure req.uploadedFiles is initialized

        // Append to array if multiple files, otherwise set as single value
        if (req.isArray) {
          req.uploadedFiles[fieldName] = req.uploadedFiles[fieldName] || [];
          req.uploadedFiles[fieldName].push(fileName);
        } else {
          req.uploadedFiles[fieldName] = fileName;
        }

        cb(null, fileName);
      },
    });
  });

  return (req, res, next) => {
    const handlers = configs.map((config, index) => {
      const { category, fieldName, isArray = false } = config;
      const categoryConfig = allowedTypes[category];

      if (!categoryConfig) {
        throw new Error(`Invalid category specified: ${category}`);
      }

      const upload = multer({
        storage: storages[index],
        fileFilter: (req, file, cb) => {
          const { types } = categoryConfig;
          if (types.includes(file.mimetype)) {
            cb(null, true);
          } else {
            cb(
              new Error(
                `Invalid file type for ${fieldName}. Allowed types: ${types.join(", ")}`
              ),
              false
            );
          }
        },
        limits: { fileSize: categoryConfig.maxSize },
      });

      return isArray ? upload.array(fieldName, 10) : upload.single(fieldName);
    });

    const processUploads = (index) => {
      if (index >= handlers.length) {
        return next();
      }

      handlers[index](req, res, (err) => {
        if (err) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).send({
              message: `File size exceeds the limit of ${
                allowedTypes[configs[index].category].maxSize / (1024 * 1024)
              } MB for ${configs[index].fieldName}.`,
            });
          }
          return res.status(400).send({ message: err.message });
        }

        processUploads(index + 1);
      });
    };

    processUploads(0);
  };
};

export default uploadMiddleware;