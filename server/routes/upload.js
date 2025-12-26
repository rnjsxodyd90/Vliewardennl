const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyToken } = require('./auth');

// Lazy load cloudinary to prevent startup crash
let cloudinary = null;
let cloudinaryConfigured = false;

const getCloudinary = () => {
  if (!cloudinary) {
    cloudinary = require('cloudinary').v2;
  }
  
  if (!cloudinaryConfigured) {
    // Configure using individual variables (more reliable)
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
      });
      cloudinaryConfigured = true;
    }
  }
  
  return cloudinaryConfigured ? cloudinary : null;
};

// Configure multer for memory storage (we'll upload to Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Upload single image
router.post('/', verifyToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const cl = getCloudinary();
    
    // Check if Cloudinary is configured
    if (!cl) {
      return res.status(500).json({ 
        error: 'Image upload not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.' 
      });
    }

    // Upload to Cloudinary using a stream
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cl.uploader.upload_stream(
        {
          folder: 'vliewarden',
          resource_type: 'image',
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' }, // Max dimensions
            { quality: 'auto' }, // Auto optimize quality
            { fetch_format: 'auto' } // Auto format (webp when supported)
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      uploadStream.end(req.file.buffer);
    });

    res.json({
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    if (error.message === 'Only image files are allowed') {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Delete image (optional - for cleanup)
router.delete('/:publicId', verifyToken, async (req, res) => {
  try {
    const cl = getCloudinary();
    
    if (!cl) {
      return res.status(500).json({ error: 'Cloudinary not configured' });
    }
    
    const publicId = req.params.publicId;
    
    await cl.uploader.destroy(`vliewarden/${publicId}`);
    
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

module.exports = router;
