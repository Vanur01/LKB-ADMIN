"use client";

import React, { useState, useEffect } from "react";
import {
  getAllBanners,
  createBanner,
  deleteBanner,
  OfferBanner,
} from "../../../api/Offers/page";
import {
  PlusIcon,
  TrashIcon,
  PhotoIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import ConfirmationModal from '@/components/ConfirmationModal';

const OffersPage = () => {
  const [banners, setBanners] = useState<OfferBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<OfferBanner | null>(null);

  // Fetch all banners
  const fetchBanners = async () => {
    try {
      setLoading(true);
      const data = await getAllBanners();
      setBanners(data);
    } catch (error) {
      console.error("Error fetching banners:", error);
      // You might want to show a toast notification here
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImage) {
      alert("Please select an image");
      return;
    }

    try {
      await createBanner(selectedImage);
      setIsModalOpen(false);
      setSelectedImage(null);
      setImagePreview(null);
      await fetchBanners();
      // You might want to show a success toast here
    } catch (error: any) {
      console.error("Error creating banner:", error);
      alert(error.message || "Failed to create banner");
    }
  };

  // Handle delete banner
  const handleDelete = async () => {
    if (!bannerToDelete) return;

    try {
      setIsDeleting(bannerToDelete._id);
      await deleteBanner(bannerToDelete._id);
      await fetchBanners();
      setDeleteModal(false);
      setBannerToDelete(null);
      // You might want to show a success toast here
    } catch (error: any) {
      console.error("Error deleting banner:", error);
      alert(error.message || "Failed to delete banner");
      setDeleteModal(false);
      setBannerToDelete(null);
    } finally {
      setIsDeleting(null);
    }
  };

  const onDeleteClick = (banner: OfferBanner) => {
    setBannerToDelete(banner);
    setDeleteModal(true);
  };

  // Reset modal state
  const resetModal = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
    setImagePreview(null);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Offer Banners</h1>
          <p className="text-gray-600 mt-1">Manage your promotional banners</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-lg"
        >
          <PlusIcon className="w-5 h-5" />
          Add Banner
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      ) : (
        /* Banners Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {banners.map((banner) => (
            <div
              key={banner._id}
              className="bg-white rounded-sm shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300"
            >
              {/* Banner Image */}
              <div className="aspect-video bg-gray-100 relative group">
                <img
                  src={banner.imageUrl}
                  alt="Banner"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20 bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 flex gap-2">
                    <button
                      onClick={() => onDeleteClick(banner)}
                      disabled={isDeleting === banner._id}
                      className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors duration-300 cursor-pointer"
                    >
                      {isDeleting === banner._id ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      ) : (
                        <TrashIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>           
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && banners.length === 0 && (
        <div className="text-center py-12">
          <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No banners yet</h3>
          <p className="text-gray-600 mb-4">Start by creating your first promotional banner</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300"
          >
            Create Banner
          </button>
        </div>
      )}

      {/* Add Banner Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/10 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Banner</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banner Image *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-orange-500 transition-colors">
                    {imagePreview ? (
                      <div className="space-y-2">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-h-32 mx-auto rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedImage(null);
                            setImagePreview(null);
                          }}
                          className="text-sm text-orange-600 hover:text-orange-700"
                        >
                          Change Image
                        </button>
                      </div>
                    ) : (
                      <div>
                        <PhotoIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          id="image-upload"
                        />
                        <label
                          htmlFor="image-upload"
                          className="cursor-pointer text-orange-600 hover:text-orange-700"
                        >
                          Click to upload image
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetModal}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300"
                  >
                    Create Banner
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal}
        onClose={() => {
          setDeleteModal(false);
          setBannerToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Delete Banner"
        message={`Are you sure you want to delete this banner? This action cannot be undone.`}
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        type="danger"
      />
    </div>
  );
};

export default OffersPage;