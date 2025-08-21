// [EDIT] - 2024-01-15 - Created CreatePostPage component - Ediens Team
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@store/AuthContext';
import { useMutation, useQueryClient } from 'react-query';
import { useDropzone } from 'react-dropzone';
import { 
  Plus, 
  Camera, 
  X, 
  MapPin, 
  Clock, 
  Tag, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Upload,
  Image as ImageIcon,
  Trash2,
  Calendar,
  DollarSign,
  Package,
  Leaf
} from 'lucide-react';
import { api } from '@api/auth';
import toast from 'react-hot-toast';

const CreatePostPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: 0,
    quantity: 1,
    expiryDate: '',
    expiryTime: '',
    urgency: 'medium',
    isFree: true,
    location: {
      address: '',
      city: '',
      coordinates: null
    },
    allergens: [],
    dietaryInfo: [],
    pickupInstructions: ''
  });

  const [images, setImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [errors, setErrors] = useState({});

  // Categories for food items
  const categories = [
    { value: 'fresh', label: 'Fresh Produce', icon: '🥬' },
    { value: 'cooked', label: 'Cooked Meals', icon: '🍲' },
    { value: 'bakery', label: 'Bakery', icon: '🥖' },
    { value: 'packaged', label: 'Packaged Food', icon: '📦' },
    { value: 'dairy', label: 'Dairy & Eggs', icon: '🥛' },
    { value: 'frozen', label: 'Frozen Food', icon: '🧊' },
    { value: 'beverages', label: 'Beverages', icon: '🥤' },
    { value: 'snacks', label: 'Snacks', icon: '🍿' }
  ];

  // Urgency levels
  const urgencyLevels = [
    { value: 'low', label: 'Low', color: 'text-green-600 bg-green-100' },
    { value: 'medium', label: 'Medium', color: 'text-orange-600 bg-orange-100' },
    { value: 'high', label: 'High', color: 'text-red-600 bg-red-100' }
  ];

  // Common allergens
  const commonAllergens = [
    'Gluten', 'Dairy', 'Eggs', 'Soy', 'Nuts', 'Peanuts', 'Fish', 'Shellfish'
  ];

  // Dietary information
  const dietaryOptions = [
    'Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-Free', 'Dairy-Free'
  ];

  // Image dropzone
  const onDrop = useCallback((acceptedFiles) => {
    const newImages = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9)
    }));
    setImages(prev => [...prev, ...newImages]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: true
  });

  // Remove image
  const removeImage = (imageId) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  };

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/api/posts', data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Food post created successfully!');
      queryClient.invalidateQueries(['posts']);
      navigate(`/posts/${data.post.id}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create post');
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    }
  });

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Handle location input changes
  const handleLocationChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value
      }
    }));
  };

  // Handle price toggle
  const handlePriceToggle = () => {
    setFormData(prev => ({
      ...prev,
      isFree: !prev.isFree,
      price: prev.isFree ? 0 : prev.price
    }));
  };

  // Handle allergen toggle
  const handleAllergenToggle = (allergen) => {
    setFormData(prev => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter(a => a !== allergen)
        : [...prev.allergens, allergen]
    }));
  };

  // Handle dietary info toggle
  const handleDietaryToggle = (dietary) => {
    setFormData(prev => ({
      ...prev,
      dietaryInfo: prev.dietaryInfo.includes(dietary)
        ? prev.dietaryInfo.filter(d => d !== dietary)
        : [...prev.dietaryInfo, dietary]
    }));
  };

  // Calculate urgency based on expiry date
  const calculateUrgency = (expiryDate, expiryTime) => {
    if (!expiryDate || !expiryTime) return 'medium';
    
    const expiry = new Date(`${expiryDate}T${expiryTime}`);
    const now = new Date();
    const diffHours = (expiry - now) / (1000 * 60 * 60);
    
    if (diffHours <= 24) return 'high';
    if (diffHours <= 72) return 'medium';
    return 'low';
  };

  // Handle expiry date/time change
  const handleExpiryChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Auto-calculate urgency
    if (field === 'expiryDate' || field === 'expiryTime') {
      const newExpiryDate = field === 'expiryDate' ? value : prev.expiryDate;
      const newExpiryTime = field === 'expiryTime' ? value : prev.expiryTime;
      
      if (newExpiryDate && newExpiryTime) {
        const urgency = calculateUrgency(newExpiryDate, newExpiryTime);
        setFormData(prev => ({ ...prev, urgency }));
      }
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (!formData.expiryDate) {
      newErrors.expiryDate = 'Expiry date is required';
    }
    
    if (!formData.expiryTime) {
      newErrors.expiryTime = 'Expiry time is required';
    }
    
    if (!formData.location.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    if (!formData.location.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!formData.isFree && formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }
    
    if (formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Prepare data for submission
    const submitData = {
      ...formData,
      expiryDate: `${formData.expiryDate}T${formData.expiryTime}`,
      price: formData.isFree ? 0 : parseFloat(formData.price),
      quantity: parseInt(formData.quantity)
    };
    
    createPostMutation.mutate(submitData);
  };

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Share Food</h1>
              <p className="text-gray-600 mt-1">
                Help reduce food waste by sharing your leftover food
              </p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="btn-outline"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Basic Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`form-input ${errors.title ? 'border-red-500' : ''}`}
                  placeholder="e.g., Fresh bread from local bakery"
                  required
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.title}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className={`form-textarea ${errors.description ? 'border-red-500' : ''}`}
                  placeholder="Describe the food item, ingredients, condition, etc."
                  required
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.description}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={`form-select ${errors.category ? 'border-red-500' : ''}`}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.icon} {category.label}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.category}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  min="1"
                  className={`form-input ${errors.quantity ? 'border-red-500' : ''}`}
                  required
                />
                {errors.quantity && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.quantity}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Tag className="w-5 h-5 mr-2" />
              Pricing
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isFree"
                  checked={formData.isFree}
                  onChange={handlePriceToggle}
                  className="form-checkbox"
                />
                <label htmlFor="isFree" className="ml-3 text-sm font-medium text-gray-700">
                  This food is free
                </label>
              </div>

              {!formData.isFree && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (€) *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0.01"
                      className={`form-input pl-10 ${errors.price ? 'border-red-500' : ''}`}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.price}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Expiry & Urgency */}
          <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Expiry & Urgency
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date *
                </label>
                <input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={(e) => handleExpiryChange('expiryDate', e.target.value)}
                  min={today}
                  className={`form-input ${errors.expiryDate ? 'border-red-500' : ''}`}
                  required
                />
                {errors.expiryDate && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.expiryDate}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Time *
                </label>
                <input
                  type="time"
                  name="expiryTime"
                  value={formData.expiryTime}
                  onChange={(e) => handleExpiryChange('expiryTime', e.target.value)}
                  className={`form-input ${errors.expiryTime ? 'border-red-500' : ''}`}
                  required
                />
                {errors.expiryTime && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.expiryTime}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Urgency Level
                </label>
                <div className="space-y-2">
                  {urgencyLevels.map(level => (
                    <label key={level.value} className="flex items-center">
                      <input
                        type="radio"
                        name="urgency"
                        value={level.value}
                        checked={formData.urgency === level.value}
                        onChange={handleInputChange}
                        className="form-radio"
                      />
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${level.color}`}>
                        {level.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Pickup Location
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  value={formData.location.address}
                  onChange={(e) => handleLocationChange('address', e.target.value)}
                  className={`form-input ${errors.address ? 'border-red-500' : ''}`}
                  placeholder="Street address"
                  required
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.address}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.location.city}
                  onChange={(e) => handleLocationChange('city', e.target.value)}
                  className={`form-input ${errors.city ? 'border-red-500' : ''}`}
                  placeholder="City name"
                  required
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.city}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Camera className="w-5 h-5 mr-2" />
              Photos
            </h2>
            
            <div className="space-y-4">
              {/* Image Upload */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                {isDragActive ? (
                  <p className="text-primary-600 font-medium">Drop the images here...</p>
                ) : (
                  <div>
                    <p className="text-gray-600 font-medium">
                      Drag & drop images here, or click to select
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      PNG, JPG, WEBP up to 5MB each
                    </p>
                  </div>
                )}
              </div>

              {/* Image Preview */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((image) => (
                    <div key={image.id} className="relative group">
                      <img
                        src={image.preview}
                        alt="Preview"
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(image.id)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Additional Information
            </h2>
            
            <div className="space-y-6">
              {/* Allergens */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Allergens (if any)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {commonAllergens.map(allergen => (
                    <label key={allergen} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.allergens.includes(allergen)}
                        onChange={() => handleAllergenToggle(allergen)}
                        className="form-checkbox"
                      />
                      <span className="ml-2 text-sm text-gray-700">{allergen}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Dietary Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Dietary Information
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {dietaryOptions.map(dietary => (
                    <label key={dietary} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.dietaryInfo.includes(dietary)}
                        onChange={() => handleDietaryToggle(dietary)}
                        className="form-checkbox"
                      />
                      <span className="ml-2 text-sm text-gray-700">{dietary}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Pickup Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pickup Instructions
                </label>
                <textarea
                  name="pickupInstructions"
                  value={formData.pickupInstructions}
                  onChange={handleInputChange}
                  rows={3}
                  className="form-textarea"
                  placeholder="Any special instructions for pickup (e.g., door code, specific time, etc.)"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createPostMutation.isLoading}
              className="btn-primary"
            >
              {createPostMutation.isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Leaf className="w-4 h-4 mr-2" />
              )}
              Share Food
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostPage;