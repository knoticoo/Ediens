// [EDIT] - 2024-01-15 - Created validation middleware - Ediens Team
const Joi = require('joi');

// Registration validation schema
const registrationSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, and one number',
      'any.required': 'Password is required'
    }),
  firstName: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 50 characters',
      'any.required': 'First name is required'
    }),
  lastName: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 50 characters',
      'any.required': 'Last name is required'
    }),
  phone: Joi.string()
    .pattern(/^[\+]?[1-9][\d]{0,15}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),
  city: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'City must be at least 2 characters long',
      'string.max': 'City cannot exceed 100 characters',
      'any.required': 'City is required'
    }),
  address: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Address cannot exceed 500 characters'
    }),
  isBusiness: Joi.boolean()
    .default(false),
  businessName: Joi.when('isBusiness', {
    is: true,
    then: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': 'Business name must be at least 2 characters long',
        'string.max': 'Business name cannot exceed 100 characters',
        'any.required': 'Business name is required for business accounts'
      }),
    otherwise: Joi.optional()
  }),
  businessType: Joi.when('isBusiness', {
    is: true,
    then: Joi.string()
      .valid('restaurant', 'bakery', 'grocery', 'cafe', 'other')
      .required()
      .messages({
        'any.only': 'Please select a valid business type',
        'any.required': 'Business type is required for business accounts'
      }),
    otherwise: Joi.optional()
  })
});

// Login validation schema
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

// Food post validation schema
const foodPostSchema = Joi.object({
  title: Joi.string()
    .min(3)
    .max(100)
    .required()
    .messages({
      'string.min': 'Title must be at least 3 characters long',
      'string.max': 'Title cannot exceed 100 characters',
      'any.required': 'Title is required'
    }),
  description: Joi.string()
    .min(10)
    .max(1000)
    .required()
    .messages({
      'string.min': 'Description must be at least 10 characters long',
      'string.max': 'Description cannot exceed 1000 characters',
      'any.required': 'Description is required'
    }),
  category: Joi.string()
    .valid('fresh', 'cooked', 'bakery', 'packaged', 'frozen', 'dairy', 'other')
    .required()
    .messages({
      'any.only': 'Please select a valid category',
      'any.required': 'Category is required'
    }),
  subcategory: Joi.string()
    .max(100)
    .optional(),
  quantity: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.base': 'Quantity must be a number',
      'number.integer': 'Quantity must be a whole number',
      'number.min': 'Quantity must be at least 1',
      'any.required': 'Quantity is required'
    }),
  unit: Joi.string()
    .valid('piece', 'kg', 'g', 'liter', 'ml', 'portion', 'box', 'bag')
    .default('piece')
    .messages({
      'any.only': 'Please select a valid unit'
    }),
  price: Joi.number()
    .min(0)
    .precision(2)
    .required()
    .messages({
      'number.base': 'Price must be a number',
      'number.min': 'Price cannot be negative',
      'any.required': 'Price is required'
    }),
  originalPrice: Joi.number()
    .min(0)
    .precision(2)
    .optional(),
  images: Joi.array()
    .items(Joi.string().uri())
    .max(5)
    .optional()
    .messages({
      'array.max': 'Maximum 5 images allowed'
    }),
  latitude: Joi.number()
    .min(-90)
    .max(90)
    .required()
    .messages({
      'number.base': 'Latitude must be a number',
      'number.min': 'Latitude must be between -90 and 90',
      'number.max': 'Latitude must be between -90 and 90',
      'any.required': 'Latitude is required'
    }),
  longitude: Joi.number()
    .min(-180)
    .max(180)
    .required()
    .messages({
      'number.base': 'Longitude must be a number',
      'number.min': 'Longitude must be between -180 and 180',
      'number.max': 'Longitude must be between -180 and 180',
      'any.required': 'Longitude is required'
    }),
  address: Joi.string()
    .max(500)
    .optional(),
  city: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'City must be at least 2 characters long',
      'string.max': 'City cannot exceed 100 characters',
      'any.required': 'City is required'
    }),
  pickupInstructions: Joi.string()
    .max(500)
    .optional(),
  expiryDate: Joi.date()
    .greater('now')
    .required()
    .messages({
      'date.base': 'Please provide a valid expiry date',
      'date.greater': 'Expiry date must be in the future',
      'any.required': 'Expiry date is required'
    }),
  allergens: Joi.array()
    .items(Joi.string())
    .optional(),
  dietaryInfo: Joi.array()
    .items(Joi.string().valid('vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'halal', 'kosher'))
    .optional(),
  storageInstructions: Joi.string()
    .max(500)
    .optional(),
  maxReservations: Joi.number()
    .integer()
    .min(1)
    .optional(),
  tags: Joi.array()
    .items(Joi.string())
    .max(10)
    .optional()
    .messages({
      'array.max': 'Maximum 10 tags allowed'
    })
});

// Claim validation schema
const claimSchema = Joi.object({
  foodPostId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Please provide a valid food post ID',
      'any.required': 'Food post ID is required'
    }),
  quantity: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.base': 'Quantity must be a number',
      'number.integer': 'Quantity must be a whole number',
      'number.min': 'Quantity must be at least 1',
      'any.required': 'Quantity is required'
    }),
  pickupDate: Joi.date()
    .greater('now')
    .required()
    .messages({
      'date.base': 'Please provide a valid pickup date',
      'date.greater': 'Pickup date must be in the future',
      'any.required': 'Pickup date is required'
    }),
  message: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Message cannot exceed 500 characters'
    }),
  isUrgent: Joi.boolean()
    .default(false)
});

// Message validation schema
const messageSchema = Joi.object({
  receiverId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Please provide a valid receiver ID',
      'any.required': 'Receiver ID is required'
    }),
  content: Joi.string()
    .min(1)
    .max(1000)
    .required()
    .messages({
      'string.min': 'Message cannot be empty',
      'string.max': 'Message cannot exceed 1000 characters',
      'any.required': 'Message content is required'
    }),
  messageType: Joi.string()
    .valid('text', 'image', 'location', 'system')
    .default('text'),
  mediaUrl: Joi.string()
    .uri()
    .optional()
    .messages({
      'string.uri': 'Please provide a valid media URL'
    }),
  replyToId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.guid': 'Please provide a valid reply message ID'
    })
});

// Validation middleware functions
const validateRegistration = (req, res, next) => {
  const { error } = registrationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(detail => detail.message)
    });
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(detail => detail.message)
    });
  }
  next();
};

const validateFoodPost = (req, res, next) => {
  const { error } = foodPostSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(detail => detail.message)
    });
  }
  next();
};

const validateClaim = (req, res, next) => {
  const { error } = claimSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(detail => detail.message)
    });
  }
  next();
};

const validateMessage = (req, res, next) => {
  const { error } = messageSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(detail => detail.message)
    });
  }
  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateFoodPost,
  validateClaim,
  validateMessage,
  registrationSchema,
  loginSchema,
  foodPostSchema,
  claimSchema,
  messageSchema
};