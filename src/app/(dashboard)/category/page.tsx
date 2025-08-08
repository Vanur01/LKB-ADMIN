'use client';

import { useState, useEffect } from 'react';
import { 
  createCategory, 
  getAllCategories, 
  updateCategory, 
  deleteCategory,
  type Category 
} from '@/api/Category/page';
import { Pagination, Stack } from "@mui/material";

import { 
  PencilSquareIcon, 
  TrashIcon, 
  PlusIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import CategoryModal from '@/components/CategoryModal';
import ConfirmationModal from '@/components/ConfirmationModal';



const CategoryPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const limit = 10;

  // Fetch categories
  const fetchCategories = async (page: number) => {
    try {
      setLoading(true);
      const response = await getAllCategories(page, limit);
      setCategories(response.result.categories);
      setTotalPages(response.result.pages);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories(currentPage);
  }, [currentPage]);

  // Handle category creation
  const handleCreateCategory = async (data: { name: string; description: string }) => {
    try {
      const response = await createCategory(data);
      await fetchCategories(currentPage);
      setModalOpen(false);
    } catch (error) {
      throw error;
    }
  };

  // Handle category update
  const handleUpdateCategory = async (data: { name: string; description: string }) => {
    if (!editingCategory) return;
    try {
      await updateCategory(editingCategory._id, data);
      await fetchCategories(currentPage);
      setEditingCategory(null);
    } catch (error) {
      throw error;
    }
  };

  // Handle category deletion
  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      setIsDeleting(true);
      setError(''); // Clear any previous errors
      
      const response = await deleteCategory(categoryToDelete._id);
      
      if (response.success) {
        // If this is the last item on the current page and not the first page,
        // go to the previous page
        if (categories.length === 1 && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
        } else {
          // Otherwise, just refresh the current page
          await fetchCategories(currentPage);
        }
        
        // Close modal and clear selection
        setDeleteModal(false);
        setCategoryToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete category');
      setDeleteModal(false); // Close the modal on error
      setCategoryToDelete(null); // Clear the selection
    } finally {
      setIsDeleting(false);
    }
  };

  const onEditClick = (category: Category) => {
    setEditingCategory(category);
    setModalOpen(true);
  };

  const onDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteModal(true);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Categories</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your menu categories here. You can add, edit, or remove categories.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            onClick={() => {
              setEditingCategory(null);
              setModalOpen(true);
            }}
            className="flex items-center justify-center rounded-md bg-orange-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-500"
          >
            <PlusIcon className="h-5 w-5 mr-1" />
            Add Category
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-md bg-red-50 p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <p className="ml-3 text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2  overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden border-zinc-200 border-2 rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Name
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Description
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Created At
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4">
                        <div className="flex justify-center">
                          <svg className="animate-spin h-5 w-5 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      </td>
                    </tr>
                  ) : categories.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-gray-500">
                        No categories found
                      </td>
                    </tr>
                  ) : (
                    categories.map((category) => (
                      <tr key={category._id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {category.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {category.description}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {new Date(category.createdAt).toLocaleDateString()}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            onClick={() => onEditClick(category)}
                          className="text-gray-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <PencilSquareIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => onDeleteClick(category)}
                          className="text-gray-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {!loading && categories.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-white rounded-lg shadow mt-4">
          <Stack spacing={2} className="flex flex-col items-center">
            {/* Default view for smaller screens */}
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
            {/* Enhanced view for larger screens */}
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
            <div className="text-sm text-gray-500">
              Page <span className="font-medium">{currentPage}</span> of{' '}
              <span className="font-medium">{totalPages}</span>
            </div>
          </Stack>
        </div>
      )}

      {/* Category Modal */}
      <CategoryModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingCategory(null);
        }}
        onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}
        initialData={editingCategory}
        mode={editingCategory ? 'edit' : 'create'}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal}
        onClose={() => {
          setDeleteModal(false);
          setCategoryToDelete(null);
        }}
        onConfirm={handleDeleteCategory}
        title="Delete Category"
        message={`Are you sure you want to delete the category "${categoryToDelete?.name || ''}"? This action cannot be undone.`}
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        type="danger"
      />
    </div>
  );
};

export default CategoryPage;