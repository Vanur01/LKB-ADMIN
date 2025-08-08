"use client";

import React, {  useState, useMemo, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  PencilSquareIcon,
  PhotoIcon,
  TrashIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { Pagination, Stack } from '@mui/material';
import AddMenuItemModal from '@/components/AddMenuItemModal';
import { fetchMenuItems, toggleMenuItemAvailability, deleteMenuItem, getMenuItemById, type MenuItem } from '@/api/Menu/page';

// Define the Category type
interface Category {
  _id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface CategoryOption {
  id: string;
  name: string;
}
import ConfirmationModal from '@/components/ConfirmationModal';

const MenuManagement = () => {
  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryOption>({ id: 'all', name: 'All Categories' });
  const [selectedStatus, setSelectedStatus] = useState('All Items');
  const [selectedDietary, setSelectedDietary] = useState('All Dietary');
  const [page, setPage] = useState(1);
  const [limit] = useState(30);
  const [loading, setLoading] = useState(false);
  
  // State for add/edit item modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [editItemData, setEditItemData] = useState<MenuItem | null>(null);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    itemId?: string;
    currentStatus?: boolean;
    type: 'delete' | 'availability';
    itemName?: string;
  }>({
    isOpen: false,
    itemId: undefined,
    currentStatus: undefined,
    type: 'availability',
    itemName: undefined
  });

  // State for menu items and pagination
  const [menuItems, setMenuItems] = useState<(MenuItem & { category: string | Category })[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState({
    vegetarian: 0,
    nonVegetarian: 0,
    unavailable: 0
  });

  // Fetch menu items
  useEffect(() => {
    const loadMenuItems = async () => {
      try {
        setLoading(true);
        // Prepare filters based on selected values
        const filters = {
          ...(selectedCategory.id !== 'all' && { 
            category: selectedCategory.id  // Send category ID instead of name
          }),
          ...(selectedStatus !== 'All Items' && { 
            isAvailable: selectedStatus === 'Available' 
          }),
          ...(selectedDietary !== 'All Dietary' && { 
            isVeg: selectedDietary === 'Vegetarian' 
          }),
          ...(searchTerm && { search: searchTerm })
        };

        const response = await fetchMenuItems(page, limit, filters);
        if (response.success) {
          setMenuItems(response.result.menus);
          setTotalItems(response.result.total);
          setStats({
            vegetarian: response.result.counts.vegetarian,
            nonVegetarian: response.result.counts.nonVegetarian,
            unavailable: response.result.counts.unavailable
          });
        }
      } catch (error) {
        console.error('Error fetching menu items:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMenuItems();
  }, [page, limit, selectedCategory, selectedStatus, selectedDietary, searchTerm]);

  // All filtering is now handled by the API, so we just use menuItems directly
  const filteredItems = menuItems;

  // Get unique categories with their IDs
  const categories: CategoryOption[] = [
    { id: 'all', name: 'All Categories' },
    ...Array.from(
      new Map(
        menuItems.map(item => {
          const category = item.category;
          if (typeof category === 'object' && category !== null) {
            return [category.name, { id: category._id, name: category.name }];
          }
          return [category, { id: category, name: category }];
        })
      ).values()
    ).filter(cat => cat.name !== 'All Categories')
  ];

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory({ id: 'all', name: 'All Categories' });
    setSelectedStatus('All Items');
    setSelectedDietary('All Dietary');
  };

  // Handle opening the confirmation modal for availability toggle
  const handleToggleClick = (id: string, currentStatus: boolean) => {
    setConfirmationModal({
      isOpen: true,
      itemId: id,
      currentStatus,
      type: 'availability'
    });
  };

  // Handle opening the confirmation modal for delete
  const handleDeleteClick = (id: string, itemName: string) => {
    setConfirmationModal({
      isOpen: true,
      itemId: id,
      type: 'delete',
      itemName
    });
  };

  // Toggle item status
  const toggleItemStatus = async (id: string) => {
    try {
      // Call API to toggle status
      const response = await toggleMenuItemAvailability(id);
      if (response.success) {
        // Update the UI only after successful API call
        setMenuItems(prev => prev.map(item => 
          item._id === id 
            ? { ...item, isAvailable: !item.isAvailable }
            : item
        ));
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Error toggling item status:', error);
      alert('Failed to update item availability: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Delete item
  const deleteItem = async (id: string) => {
    try {
      // Call the API to delete the item
      const response = await deleteMenuItem(id);
      if (response.success) {
        // Update the UI only after successful API call
        setMenuItems(prev => prev.filter(item => item._id !== id));
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Add new item
  const addNewItem = () => {
    setEditItemId(null);
    setEditItemData(null);
    setShowAddModal(true);
  };

  // Edit item
  const handleEditClick = async (id: string) => {
    try {
      setLoading(true);
      setEditItemId(id);
      const response = await getMenuItemById(id);
      if (response.success) {
        setEditItemData(response.result);
        setShowAddModal(true);
      } else {
        alert('Failed to fetch menu item for editing: ' + response.message);
      }
    } catch (error) {
      alert('Error fetching menu item: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Menu Management</h1>
          <p className="text-gray-600">Manage your restaurant's menu items and categories</p>
        </div>
        <button
          onClick={addNewItem}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium cursor-pointer"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Add New Item</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              // Reset to first page when searching
              setPage(1);
            }}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Search menu items by name or description..."
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select 
            value={selectedCategory.id}
            onChange={(e) => {
              const selected = categories.find(c => c.id === e.target.value) || categories[0];
              setSelectedCategory(selected);
            }}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
          <select 
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option>All Items</option>
            <option>Available</option>
            <option>Out of Stock</option>
          </select>
          <select 
            value={selectedDietary}
            onChange={(e) => setSelectedDietary(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option>All Dietary</option>
            <option>Vegetarian</option>
            <option>Non-Vegetarian</option>
          </select>
          <button 
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors"
          >
            <FunnelIcon className="h-5 w-5 text-gray-500" />
            <span>Clear Filters</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">Total Items</h3>
          <p className="text-2xl font-bold text-gray-800">{stats.vegetarian + stats.nonVegetarian}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">Vegetarian</h3>
          <p className="text-2xl font-bold text-emerald-600">{stats.vegetarian}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">Non-Vegetarian</h3>
          <p className="text-2xl font-bold text-amber-600">{stats.nonVegetarian}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">Out of Stock</h3>
          <p className="text-2xl font-bold text-red-600">{stats.unavailable}</p>
        </div>
      </div>

      {/* Menu Items List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading menu items...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No menu items found matching your filters.</p>
          </div>
        ) : (
          <>
          {filteredItems.map((item) => (
            <div key={item._id} className="bg-white p-4 rounded-lg border-2 border-gray-200">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`bg-gray-100 w-full h-full flex items-center justify-center ${item.image ? 'hidden' : ''}`}>
                        <PhotoIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-800 text-lg">{item.name}</h3>
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                          {typeof item.category === 'object' && item.category !== null
                            ? (item.category as Category).name
                            : item.category}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.isVeg
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {item.isVeg ? '🌱 Veg' : '🍖 Non-Veg'}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mt-2">{item.description}</p>
                      <div className="mt-3 flex items-center gap-4 flex-wrap">
                        <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                          item.isAvailable
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {item.isAvailable ? 'Available' : 'Out of Stock'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col lg:items-end gap-3">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleToggleClick(item._id, item.isAvailable)}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                        item.isAvailable
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {item.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(item._id, item.name)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                      title="Delete item"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                    <button
                      className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 px-3 py-1 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                      onClick={() => handleEditClick(item._id)}
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                      <span>Edit</span>
                    </button>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">Rs. {item.price}</p>
                </div>
              </div>
            </div>
          ))}
          </>    
        )}
      </div>

      {/* Pagination */}
        <Stack spacing={2} className="flex flex-col items-center mt-4">
          {/* Default view for smaller screens */}
          <div className="block sm:hidden">
            <Pagination
              page={page}
              count={Math.ceil(totalItems / limit)}
              onChange={(_, newPage) => setPage(newPage)}
              siblingCount={0}
              boundaryCount={1}
              color="primary"
              size="small"
            />
          </div>
          {/* Enhanced view for larger screens */}
          <div className="hidden sm:block">
            <Pagination
              page={page}
              count={Math.ceil(totalItems / limit)}
              onChange={(_, newPage) => setPage(newPage)}
              siblingCount={1}
              boundaryCount={2}
              color="primary"
              size="medium"
              showFirstButton
              showLastButton
            />
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Page {page} of {Math.ceil(totalItems / limit)}
          </div>
        </Stack>

      {/* Add New Item Modal */}
      <AddMenuItemModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditItemId(null);
          setEditItemData(null);
          fetchMenuItems(page, limit);
        }}
        existingCategories={categories.map(c => c.name)}
        nextId={(menuItems.length + 1).toString()}
        editItem={editItemData}
        isEdit={!!editItemId}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal({ 
          isOpen: false, 
          type: confirmationModal.type 
        })}
        onConfirm={() => {
          if (confirmationModal.itemId) {
            if (confirmationModal.type === 'availability') {
              toggleItemStatus(confirmationModal.itemId);
            } else {
              deleteItem(confirmationModal.itemId);
            }
          }
          setConfirmationModal({ 
            isOpen: false, 
            type: confirmationModal.type 
          });
        }}
        title={confirmationModal.type === 'availability' ? 'Update Item Availability' : 'Delete Menu Item'}
        message={
          confirmationModal.type === 'availability' 
            ? `Are you sure you want to mark this item as ${confirmationModal.currentStatus ? 'unavailable' : 'available'}?`
            : `Are you sure you want to delete "${confirmationModal.itemName}"? This action cannot be undone.`
        }
        confirmText={
          confirmationModal.type === 'availability'
            ? (confirmationModal.currentStatus ? 'Mark Unavailable' : 'Mark Available')
            : 'Delete Item'
        }
        type={confirmationModal.type === 'availability' ? (confirmationModal.currentStatus ? 'danger' : 'info') : 'danger'}
      />
    </div>

  );
};

export default MenuManagement;
