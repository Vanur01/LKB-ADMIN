"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { 
  getAllDeliveryBoys, 
  createDeliveryBoy, 
  updateDeliveryBoy, 
  deleteDeliveryBoy,
  DeliveryBoy,
  CreateDeliveryBoyData,
  UpdateDeliveryBoyData 
} from "@/api/DeliveryBoy/page";
import { Pagination, Stack } from "@mui/material";
import {
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  NoSymbolIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  EyeIcon
} from "@heroicons/react/24/outline";
import ConfirmationModal from "@/components/ConfirmationModal";

// Form Modal Component - extracted outside to prevent re-creation
const FormModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  title, 
  submitText,
  formData,
  formLoading,
  onFormChange
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  title: string;
  submitText: string;
  formData: CreateDeliveryBoyData;
  formLoading: boolean;
  onFormChange: (field: keyof CreateDeliveryBoyData, value: string) => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => onFormChange("name", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Enter name"
              required
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => onFormChange("phone", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Enter 10-digit phone number"
              pattern="[0-9]{10}"
              required
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email || ""}
              onChange={(e) => onFormChange("email", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Enter email address"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => onFormChange("status", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={formLoading || !formData.name || !formData.phone}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {formLoading ? "Saving..." : submitText}
          </button>
        </div>
      </div>
    </div>
  );
};

const DeliveryBoyManagement: React.FC = () => {
  // State management
  const [deliveryBoys, setDeliveryBoys] = useState<DeliveryBoy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const itemsPerPage = 10;

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState<DeliveryBoy | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState<CreateDeliveryBoyData>({
    name: "",
    phone: "",
    email: "",
    status: "active"
  });
  const [formLoading, setFormLoading] = useState(false);

  // Fetch delivery boys
  const fetchDeliveryBoys = async () => {
    try {
      setIsRefreshing(true);
      const filters = searchTerm ? { search: searchTerm } : {};
      const response = await getAllDeliveryBoys(currentPage, itemsPerPage, filters);
      
      setDeliveryBoys(response.result.data);
      setTotalPages(response.result.totalPages);
      setTotal(response.result.total);
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch delivery boys");
      console.error("Failed to fetch delivery boys:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Effects
  useEffect(() => {
    fetchDeliveryBoys();
  }, [currentPage, searchTerm]);

  // Handle form changes
  const handleFormChange = useCallback((field: keyof CreateDeliveryBoyData, value: string) => {
    setFormData(prev => {
      // Prevent unnecessary updates if value hasn't changed
      if (prev[field] === value) return prev;
      
      return {
        ...prev,
        [field]: field === 'status' ? value as "active" | "inactive" | "blocked" : value
      };
    });
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      status: "active"
    });
  }, []);

  // Handle add delivery boy
  const handleAddDeliveryBoy = async () => {
    try {
      setFormLoading(true);
      await createDeliveryBoy(formData);
      setIsAddModalOpen(false);
      resetForm();
      await fetchDeliveryBoys();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create delivery boy");
    } finally {
      setFormLoading(false);
    }
  };

  // Handle edit delivery boy
  const handleEditDeliveryBoy = async () => {
    if (!selectedDeliveryBoy) return;
    
    try {
      setFormLoading(true);
      await updateDeliveryBoy(selectedDeliveryBoy._id, formData);
      setIsEditModalOpen(false);
      setSelectedDeliveryBoy(null);
      resetForm();
      await fetchDeliveryBoys();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update delivery boy");
    } finally {
      setFormLoading(false);
    }
  };

  // Handle delete delivery boy
  const handleDeleteDeliveryBoy = async () => {
    if (!selectedDeliveryBoy) return;
    
    try {
      setDeleteLoading(true);
      await deleteDeliveryBoy(selectedDeliveryBoy._id);
      setIsDeleteModalOpen(false);
      setSelectedDeliveryBoy(null);
      await fetchDeliveryBoys();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete delivery boy");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Modal handlers
  const openAddModal = useCallback(() => {
    resetForm();
    setIsAddModalOpen(true);
  }, [resetForm]);

  const openEditModal = useCallback((deliveryBoy: DeliveryBoy) => {
    setSelectedDeliveryBoy(deliveryBoy);
    setFormData({
      name: deliveryBoy.name,
      phone: deliveryBoy.phone,
      email: deliveryBoy.email || "",
      status: deliveryBoy.status
    });
    setIsEditModalOpen(true);
  }, []);

  const openDeleteModal = (deliveryBoy: DeliveryBoy) => {
    setSelectedDeliveryBoy(deliveryBoy);
    setIsDeleteModalOpen(true);
  };

  // Get status styling
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-yellow-100 text-yellow-800";
      case "blocked":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case "inactive":
        return <XCircleIcon className="h-4 w-4 text-yellow-500" />;
      case "blocked":
        return <NoSymbolIcon className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };


  if (isLoading && !isRefreshing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <p className="text-gray-600">Loading delivery boys...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Delivery Boy Management
            </h1>
            <p className="text-gray-600">
              Manage delivery personnel and their assignments
            </p>
          </div>

          <div className="flex flex-col gap-3 items-end">
            <div className="flex items-center text-xs text-gray-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchDeliveryBoys}
                disabled={isRefreshing}
                className={`flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors ${
                  isRefreshing ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <ArrowPathIcon
                  className={`h-5 w-5 text-gray-500 ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                />
                <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
              </button>

              <button
                onClick={openAddModal}
                className="flex items-center space-x-2 bg-orange-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-orange-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Add Delivery Boy</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search and Stats */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Search by name, phone, or email..."
            />
          </div>
          
          <div className="text-sm text-gray-600">
            Total: {total} delivery boys
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deliveryBoys.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center">
                        <UserIcon className="h-12 w-12 text-gray-400 mb-2" />
                        <p className="text-gray-500">No delivery boys found</p>
                        {searchTerm && (
                          <button
                            onClick={() => setSearchTerm("")}
                            className="mt-2 text-orange-600 text-sm hover:text-orange-700"
                          >
                            Clear search
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  deliveryBoys.map((deliveryBoy) => (
                    <tr key={deliveryBoy._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-orange-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {deliveryBoy.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 space-y-1">
                          <div className="flex items-center">
                            <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                            {deliveryBoy.phone}
                          </div>
                          {deliveryBoy.email && (
                            <div className="flex items-center">
                              <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                              {deliveryBoy.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(deliveryBoy.status)}
                          <span
                            className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(
                              deliveryBoy.status
                            )}`}
                          >
                            {deliveryBoy.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(deliveryBoy.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openEditModal(deliveryBoy)}
                            className="text-orange-600 hover:text-orange-900 p-1 rounded-md hover:bg-orange-50 transition-colors"
                            title="Edit"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(deliveryBoy)}
                            className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <Stack spacing={2} className="flex flex-col items-center mt-6">
          <div className="block sm:hidden">
            <Pagination
              page={currentPage}
              count={totalPages}
              onChange={(_, newPage) => setCurrentPage(newPage)}
              siblingCount={0}
              boundaryCount={1}
              color="primary"
              size="small"
            />
          </div>
          <div className="hidden sm:block">
            <Pagination
              page={currentPage}
              count={totalPages}
              onChange={(_, newPage) => setCurrentPage(newPage)}
              siblingCount={1}
              boundaryCount={2}
              color="primary"
              size="medium"
              showFirstButton
              showLastButton
            />
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Page {currentPage} of {totalPages}
          </div>
        </Stack>
      </div>

      {/* Add Modal */}
      <FormModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          resetForm();
        }}
        onSubmit={handleAddDeliveryBoy}
        title="Add New Delivery Boy"
        submitText="Add Delivery Boy"
        formData={formData}
        formLoading={formLoading}
        onFormChange={handleFormChange}
      />

      {/* Edit Modal */}
      <FormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedDeliveryBoy(null);
          resetForm();
        }}
        onSubmit={handleEditDeliveryBoy}
        title="Edit Delivery Boy"
        submitText="Update Delivery Boy"
        formData={formData}
        formLoading={formLoading}
        onFormChange={handleFormChange}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedDeliveryBoy(null);
        }}
        onConfirm={handleDeleteDeliveryBoy}
        title="Delete Delivery Boy"
        message={`Are you sure you want to delete "${selectedDeliveryBoy?.name}"? This action cannot be undone.`}
        confirmText={deleteLoading ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default DeliveryBoyManagement;