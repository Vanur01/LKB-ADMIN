import axios from "axios";

const API_BASE_URL = "https://api.orderfood.coffee/api/v1";

// Helper function to get token and check auth
const getAuthorizationHeader = (): string => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication required. Please log in again.');
  }
  return `Bearer ${token}`;
};

// Interfaces for API responses and requests
export interface Category {
  _id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface CategoryCreateRequest {
  name: string;
  description: string;
}

interface CategoryUpdateRequest {
  name?: string;
  description?: string;
}

interface PaginatedCategoryResponse {
  success: boolean;
  statusCode: number;
  message: string;
  result: {
    total: number;
    page: number;
    pages: number;
    limit: number;
    categories: Category[];
  };
}

interface SingleCategoryResponse {
  success: boolean;
  statusCode: number;
  message: string;
  result: Category;
}

interface ApiResponse {
  success: boolean;
  statusCode: number;
  message: string;
}

// Create a new category
export const createCategory = async (data: CategoryCreateRequest): Promise<SingleCategoryResponse> => {
  try {
    const authHeader = getAuthorizationHeader();
    const response = await axios.post(
      `${API_BASE_URL}/category/createCategory`,
      data,
      {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.status === 401) {
      localStorage.clear();
      window.location.href = '/sign-in';
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to create category');
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        localStorage.clear();
        window.location.href = '/sign-in';
        throw new Error('Session expired. Please log in again.');
      }
      throw new Error(error.response?.data?.message || 'Failed to create category');
    }
    throw error;
  }
};

// Get all categories with pagination
export const getAllCategories = async (page: number = 1, limit: number = 10): Promise<PaginatedCategoryResponse> => {
  try {
    const authHeader = getAuthorizationHeader();
    const response = await axios.get(
      `${API_BASE_URL}/category/getAllCategory`,
      {
        params: { page, limit },
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.status === 401) {
      localStorage.clear();
      window.location.href = '/sign-in';
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch categories');
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        localStorage.clear();
        window.location.href = '/sign-in';
        throw new Error('Session expired. Please log in again.');
      }
      throw new Error(error.response?.data?.message || 'Failed to fetch categories');
    }
    throw error;
  }
};

// Get category by ID
export const getCategoryById = async (id: string): Promise<SingleCategoryResponse> => {
  try {
    const authHeader = getAuthorizationHeader();
    const response = await axios.get(
      `${API_BASE_URL}/category/getCategoryById/${id}`,
      {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.status === 401) {
      localStorage.clear();
      window.location.href = '/sign-in';
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch category');
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        localStorage.clear();
        window.location.href = '/sign-in';
        throw new Error('Session expired. Please log in again.');
      }
      throw new Error(error.response?.data?.message || 'Failed to fetch category');
    }
    throw error;
  }
};

// Update category
export const updateCategory = async (
  id: string,
  data: CategoryUpdateRequest
): Promise<SingleCategoryResponse> => {
  try {
    const authHeader = getAuthorizationHeader();
    const response = await axios.put(
      `${API_BASE_URL}/category/updateCategory/${id}`,
      data,
      {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.status === 401) {
      localStorage.clear();
      window.location.href = '/sign-in';
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update category');
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        localStorage.clear();
        window.location.href = '/sign-in';
        throw new Error('Session expired. Please log in again.');
      }
      throw new Error(error.response?.data?.message || 'Failed to update category');
    }
    throw error;
  }
};

// Delete category
export const deleteCategory = async (id: string): Promise<ApiResponse> => {
  try {
    const authHeader = getAuthorizationHeader();
    
    // Log request details for debugging
    console.log(`Deleting category with ID: ${id}`);
    
    const response = await axios({
      method: 'DELETE',
      url: `${API_BASE_URL}/category/deleteCategory/${id}`,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      validateStatus: (status) => status < 500 // Handle HTTP errors in catch block
    });

    // Log response for debugging
    console.log('Delete response:', response.data);

    if (response.status === 401 || response.status === 403) {
      localStorage.clear();
      window.location.href = '/sign-in';
      throw new Error('Session expired. Please log in again.');
    }

    if (response.status !== 200 && response.status !== 204) {
      throw new Error(response.data?.message || 'Failed to delete category');
    }

    return {
      success: true,
      statusCode: response.status,
      message: response.data?.message || 'Category deleted successfully'
    };
  } catch (error) {
    console.error('Delete category error:', error);
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.clear();
        window.location.href = '/sign-in';
        throw new Error('Session expired. Please log in again.');
      }
      throw new Error(error.response?.data?.message || 'Failed to delete category');
    }
    throw error;
  }
};

// Error handler helper function
export const handleApiError = (error: any): never => {
  if (error instanceof Error) {
    throw new Error(`API Error: ${error.message}`);
  }
  throw new Error('An unknown error occurred');
};
