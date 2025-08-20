// [EDIT] - 2024-01-15 - Created static file serving route - Ediens Team
const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Serve uploaded images
router.get('/images/:filename', (req, res) => {
  const { filename } = req.params;
  const imagePath = path.join(__dirname, '../../uploads/images', filename);
  
  // Check if file exists
  if (!fs.existsSync(imagePath)) {
    return res.status(404).json({
      success: false,
      message: 'Image not found'
    });
  }
  
  // Set appropriate headers
  res.setHeader('Content-Type', 'image/jpeg');
  res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
  res.setHeader('Expires', new Date(Date.now() + 31536000000).toUTCString());
  
  // Stream the file
  const stream = fs.createReadStream(imagePath);
  stream.pipe(res);
});

// Serve image thumbnails
router.get('/images/thumbnails/:filename', (req, res) => {
  const { filename } = req.params;
  const thumbnailPath = path.join(__dirname, '../../uploads/images', filename);
  
  // Check if file exists
  if (!fs.existsSync(thumbnailPath)) {
    return res.status(404).json({
      success: false,
      message: 'Thumbnail not found'
    });
  }
  
  // Set appropriate headers
  res.setHeader('Content-Type', 'image/jpeg');
  res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
  res.setHeader('Expires', new Date(Date.now() + 31536000000).toUTCString());
  
  // Stream the file
  const stream = fs.createReadStream(thumbnailPath);
  stream.pipe(res);
});

// Serve user avatars
router.get('/avatars/:filename', (req, res) => {
  const { filename } = req.params;
  const avatarPath = path.join(__dirname, '../../uploads/avatars', filename);
  
  // Check if file exists
  if (!fs.existsSync(avatarPath)) {
    return res.status(404).json({
      success: false,
      message: 'Avatar not found'
    });
  }
  
  // Set appropriate headers
  res.setHeader('Content-Type', 'image/jpeg');
  res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
  res.setHeader('Expires', new Date(Date.now() + 31536000000).toUTCString());
  
  // Stream the file
  const stream = fs.createReadStream(avatarPath);
  stream.pipe(res);
});

// Serve small avatars
router.get('/avatars/small/:filename', (req, res) => {
  const { filename } = req.params;
  const smallAvatarPath = path.join(__dirname, '../../uploads/avatars', filename);
  
  // Check if file exists
  if (!fs.existsSync(smallAvatarPath)) {
    return res.status(404).json({
      success: false,
      message: 'Small avatar not found'
    });
  }
  
  // Set appropriate headers
  res.setHeader('Content-Type', 'image/jpeg');
  res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
  res.setHeader('Expires', new Date(Date.now() + 31536000000).toUTCString());
  
  // Stream the file
  const stream = fs.createReadStream(smallAvatarPath);
  stream.pipe(res);
});

// Health check for uploads directory
router.get('/health', (req, res) => {
  const uploadsDir = path.join(__dirname, '../../uploads');
  const imagesDir = path.join(uploadsDir, 'images');
  const avatarsDir = path.join(uploadsDir, 'avatars');
  const tempDir = path.join(uploadsDir, 'temp');
  
  try {
    const stats = {
      uploads: {
        exists: fs.existsSync(uploadsDir),
        writable: fs.accessSync(uploadsDir, fs.constants.W_OK) === undefined
      },
      images: {
        exists: fs.existsSync(imagesDir),
        writable: fs.accessSync(imagesDir, fs.constants.W_OK) === undefined,
        fileCount: fs.existsSync(imagesDir) ? fs.readdirSync(imagesDir).length : 0
      },
      avatars: {
        exists: fs.existsSync(avatarsDir),
        writable: fs.accessSync(avatarsDir, fs.constants.W_OK) === undefined,
        fileCount: fs.existsSync(avatarsDir) ? fs.readdirSync(avatarsDir).length : 0
      },
      temp: {
        exists: fs.existsSync(tempDir),
        writable: fs.accessSync(tempDir, fs.constants.W_OK) === undefined,
        fileCount: fs.existsSync(tempDir) ? fs.readdirSync(tempDir).length : 0
      }
    };
    
    res.json({
      success: true,
      message: 'Uploads directory health check',
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

module.exports = router;