"use client";

import React, { useState } from 'react';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { addMenuItem, updateMenuItem, MenuItem as ApiMenuItem } from '@/api/Menu/page';

type MenuItem = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  ordersToday: number;
  status: 'Available' | 'Out of Stock';
  dietary: 'Vegetarian' | 'Non-Vegetarian';
  image?: string;
};

interface AddMenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingCategories: string[];
  nextId: string;
  editItem?: ApiMenuItem | null;
  isEdit?: boolean;
}


const AddMenuItemModal: React.FC<AddMenuItemModalProps> = ({
  isOpen,
  onClose,
  existingCategories,
  nextId,
  editItem,
  isEdit
}) => {
  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    dietary: 'Vegetarian' as 'Vegetarian' | 'Non-Vegetarian',
    image: '',
    isAvailable: true
  });
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  // Local categories state to allow immediate update
  const [localCategories, setLocalCategories] = useState<string[]>(existingCategories);

  // Reset form when modal closes
  const resetForm = () => {
    setNewItem({
      name: '',
      category: '',
      price: '',
      description: '',
      dietary: 'Vegetarian',
      image: '',
      isAvailable: true
    });
    setImageFile(null);
    setImagePreview('');
    setShowAddCategory(false);
    setNewCategory('');
    setLocalCategories(existingCategories); // Reset local categories to prop
  };

  // Prefill form when editing
  React.useEffect(() => {
    if (isOpen && isEdit && editItem) {
      setNewItem({
        name: editItem.name || '',
        category: editItem.category || '',
        price: editItem.price ? String(editItem.price) : '',
        description: editItem.description || '',
        dietary: editItem.isVeg ? 'Vegetarian' : 'Non-Vegetarian',
        image: editItem.image || '',
        isAvailable: editItem.isAvailable
      });
      setImagePreview(editItem.image || '');
      setImageFile(null);
      setLocalCategories(existingCategories);
    } else if (isOpen && !isEdit) {
      resetForm();
    }
  }, [isOpen, isEdit, editItem, existingCategories]);

  // Handle modal close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Handle image file upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  // Handle adding new category
  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (trimmed) {
      // Add to local categories if not already present
      if (!localCategories.includes(trimmed)) {
        setLocalCategories(prev => [...prev, trimmed]);
      }
      setNewItem(prev => ({ ...prev, category: trimmed }));
      setShowAddCategory(false);
      setNewCategory('');
    }
  };

  // Handle form submission (add or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validation
    if (!newItem.name || !newItem.category || !newItem.price || !newItem.description) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (isEdit && editItem) {
        // Update mode
        let response;
        if (imageFile) {
          // If image is updated, use FormData
          const formData = new FormData();
          formData.append('name', newItem.name);
          formData.append('category', newItem.category);
          formData.append('description', newItem.description);
          formData.append('price', newItem.price.toString());
          formData.append('isVeg', (newItem.dietary === 'Vegetarian').toString());
          formData.append('isAvailable', String(newItem.isAvailable));
          formData.append('menuImage', imageFile);
          // Use axios.put with FormData
          response = await updateMenuItem(editItem._id, formData);
        } else {
          // No image update, send JSON
          const updateData: Partial<ApiMenuItem> = {
            name: newItem.name,
            category: newItem.category,
            description: newItem.description,
            price: Number(newItem.price),
            isVeg: newItem.dietary === 'Vegetarian',
            isAvailable: newItem.isAvailable,
          };
          response = await updateMenuItem(editItem._id, updateData);
        }
        if (response.success) {
          handleClose();
          window.location.reload();
        } else {
          alert('Failed to update menu item: ' + response.message);
        }
      } else {
        // Add mode
        const formData = new FormData();
        formData.append('name', newItem.name);
        formData.append('category', newItem.category);
        formData.append('description', newItem.description);
        formData.append('price', newItem.price.toString());
        formData.append('isVeg', (newItem.dietary === 'Vegetarian').toString());
        formData.append('isAvailable', 'true');
        if (imageFile) {
          formData.append('menuImage', imageFile);
        }
        const response = await addMenuItem(formData);
        if (response.success) {
          handleClose();
          window.location.reload();
        } else {
          alert('Failed to add menu item: ' + response.message);
        }
      }
    } catch (error) {
      alert('Error submitting menu item: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Modal Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              {isEdit ? 'Update Menu Item' : 'Add New Menu Item'}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Item Name */}
            <div>
              <label htmlFor="itemName" className="block text-sm font-medium text-gray-700 mb-1">
                Item Name
              </label>
              <input
                type="text"
                id="itemName"
                value={newItem.name}
                onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter item name"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              {!showAddCategory ? (
                <div className="flex gap-2">
                  <select
                    id="category"
                    value={newItem.category}
                    onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">Select category</option>
                    {localCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                    {/* <option value="Pizza">Pizza</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Starter">Starter</option>
                    <option value="Main Course">Main Course</option> */}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowAddCategory(true)}
                    className="px-3 py-2 border border-indigo-300 text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors text-sm"
                  >
                    + Add New
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter new category name"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddCategory(false);
                      setNewCategory('');
                    }}
                    className="px-3 py-2 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Price */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Price (₹)
              </label>
              <input
                type="number"
                id="price"
                value={newItem.price}
                onChange={(e) => setNewItem(prev => ({ ...prev, price: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter price"
                min="0"
                step="0.01"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={newItem.description}
                onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter item description"
                rows={3}
                required
              />
            </div>

            {/* Dietary Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dietary Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="dietary"
                    value="Vegetarian"
                    checked={newItem.dietary === 'Vegetarian'}
                    onChange={(e) => setNewItem(prev => ({ ...prev, dietary: e.target.value as 'Vegetarian' | 'Non-Vegetarian' }))}
                    className="mr-2 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">🌱 Vegetarian</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="dietary"
                    value="Non-Vegetarian"
                    checked={newItem.dietary === 'Non-Vegetarian'}
                    onChange={(e) => setNewItem(prev => ({ ...prev, dietary: e.target.value as 'Vegetarian' | 'Non-Vegetarian' }))}
                    className="mr-2 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">🍖 Non-Vegetarian</span>
                </label>
              </div>
            </div>

            {/* Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image
              </label>
              <div className="space-y-3">
                {/* File Upload */}
                <div>
                  <label className="block">
                    <span className="sr-only">Choose image file</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-medium
                        file:bg-indigo-50 file:text-indigo-700
                        hover:file:bg-indigo-100
                        file:cursor-pointer cursor-pointer"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Upload an image file (JPG, PNG, etc.)</p>
                </div>
                
                {/* Image Preview */}
                {imagePreview && (
                  <div className="flex justify-start">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-md border border-gray-300"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium cursor-pointer"
              >
                {isEdit ? 'Update Item' : 'Add Item'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddMenuItemModal;
