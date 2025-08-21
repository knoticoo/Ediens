// [EDIT] - 2024-01-15 - Created local image upload middleware - Ediens Team
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = [
    'uploads/images',
    'uploads/avatars',
    'uploads/temp'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

// Configure storage for different file types
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/temp';
    
    if (file.fieldname === 'avatar') {
      uploadPath = 'uploads/avatars';
    } else if (file.fieldname === 'images') {
      uploadPath = 'uploads/images';
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and random string
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = path.extname(file.originalname);
    const filename = `${timestamp}_${randomString}${extension}`;
    
    cb(null, filename);
  }
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG and WebP images are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Maximum 10 files
  }
});

// Image processing middleware
const processImage = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next();
    }

    const processedFiles = [];
    
    for (const file of req.files) {
      const inputPath = file.path;
      const outputPath = inputPath.replace('/temp/', '/images/');
      
      // Create output directory if it doesn't exist
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Process image with Sharp
      await sharp(inputPath)
        .resize(800, 800, { 
          fit: 'inside', 
          withoutEnlargement: true 
        })
        .jpeg({ quality: 85, progressive: true })
        .toFile(outputPath);
      
      // Create thumbnail
      const thumbnailPath = outputPath.replace('.jpg', '_thumb.jpg');
      await sharp(inputPath)
        .resize(300, 300, { 
          fit: 'cover' 
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);
      
      // Clean up temp file
      fs.unlinkSync(inputPath);
      
      // Update file object with processed paths
      const processedFile = {
        ...file,
        path: outputPath,
        thumbnailPath: thumbnailPath,
        filename: path.basename(outputPath),
        thumbnailFilename: path.basename(thumbnailPath)
      };
      
      processedFiles.push(processedFile);
    }
    
    req.processedFiles = processedFiles;
    next();
  } catch (error) {
    console.error('Image processing error:', error);
    next(error);
  }
};

// Avatar processing middleware
const processAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    const inputPath = req.file.path;
    const outputPath = inputPath.replace('/temp/', '/avatars/');
    
    // Create output directory if it doesn't exist
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Process avatar with Sharp
    await sharp(inputPath)
      .resize(200, 200, { 
        fit: 'cover' 
      })
      .jpeg({ quality: 90, progressive: true })
      .toFile(outputPath);
    
    // Create small avatar
    const smallAvatarPath = outputPath.replace('.jpg', '_small.jpg');
    await sharp(inputPath)
      .resize(100, 100, { 
        fit: 'cover' 
      })
      .jpeg({ quality: 85 })
      .toFile(smallAvatarPath);
    
    // Clean up temp file
    fs.unlinkSync(inputPath);
    
    // Update file object with processed paths
    req.processedFile = {
      ...req.file,
      path: outputPath,
      smallPath: smallAvatarPath,
      filename: path.basename(outputPath),
      smallFilename: path.basename(smallAvatarPath)
    };
    
    next();
  } catch (error) {
    console.error('Avatar processing error:', error);
    next(error);
  }
};

// Clean up old files middleware
const cleanupOldFiles = async (req, res, next) => {
  try {
    // Clean up temp files older than 1 hour
    const tempDir = 'uploads/temp';
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      
      files.forEach(file => {
        const filePath = path.join(tempDir, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > oneHour) {
          fs.unlinkSync(filePath);
        }
      });
    }
    
    next();
  } catch (error) {
    console.error('Cleanup error:', error);
    next();
  }
};

// Error handling middleware
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 10 files.'
      });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
};

// Export middleware functions
module.exports = {
  upload,
  processImage,
  processAvatar,
  cleanupOldFiles,
  handleUploadError
};