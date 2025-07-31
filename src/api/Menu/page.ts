
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

export interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isVeg: boolean;
  image: string;
  isAvailable: boolean;
}

// Adjusted to match backend response structure
export interface MenuResponse {
  success: boolean;
  statusCode: number;
  message: string;
  result: {
    menus: MenuItem[];
    total: number;
    counts: {
      vegetarian: number;
      nonVegetarian: number;
      unavailable: number;
    };
  };
}


// Fetch a single menu item by ID
export interface SingleMenuItemResponse {
  success: boolean;
  statusCode: number;
  message: string;
  result: MenuItem;
}

export const getMenuItemById = async (id: string): Promise<SingleMenuItemResponse> => {
  try {
    const authHeader = getAuthorizationHeader();
    const response = await axios.get(`${API_BASE_URL}/menu/getMenuById/${id}`, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ||
          "An error occurred while fetching menu item by ID"
      );
    } else {
      throw new Error("An unknown error occurred while fetching menu item by ID");
    }
  }
};

export const addMenuItem = async (formData: FormData): Promise<MenuResponse> => {
  try {
    const authHeader = getAuthorizationHeader();
    const response = await axios.post(`${API_BASE_URL}/menu/addMenu`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': authHeader
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ||
          "An error occurred while adding menu item"
      );
    } else {
      throw new Error("An unknown error occurred while adding menu item");
    }
  }
};

export const fetchMenuItems = async (
  page: number, 
  limit: number,
  filters?: {
    category?: string,
    isAvailable?: boolean,
    isVeg?: boolean,
    search?: string
  }
): Promise<MenuResponse> => {
  try {
    const authHeader = getAuthorizationHeader();
    const response = await axios.get(`${API_BASE_URL}/menu/fetchAllMenuItems`, {
      params: { 
        page, 
        limit,
        ...(filters?.category && { category: filters.category }),
        ...(filters?.isAvailable !== undefined && { isAvailable: filters.isAvailable }),
        ...(filters?.isVeg !== undefined && { isVeg: filters.isVeg }),
        ...(filters?.search && { search: filters.search })
      },
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        localStorage.clear(); // Clear all stored data
        window.location.href = '/sign-in'; // Redirect to login
        throw new Error('Session expired. Please log in again.');
      }
      throw new Error(
        error.response?.data?.message ||
          "An error occurred while fetching menu items"
      );
    } else if (error instanceof Error) {
      throw error; // Rethrow authentication errors
    } else {
      throw new Error("An unknown error occurred while fetching menu items");
    }
  }
};

export const updateMenuItem = async (
  id: string,
  menuData: Partial<MenuItem> | FormData
): Promise<MenuResponse> => {
  try {
    let response;
    const authHeader = getAuthorizationHeader();
    if (menuData instanceof FormData) {
      response = await axios.put(`${API_BASE_URL}/menu/updateMenuItem/${id}`, menuData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': authHeader
        },
      });
    } else {
      response = await axios.put(`${API_BASE_URL}/menu/updateMenuItem/${id}`, menuData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        }
      });
    }
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ||
          "An error occurred while updating menu item"
      );
    } else {
      throw new Error("An unknown error occurred while updating menu item");
    }
  }
};

export const toggleMenuItemAvailability = async (id: string): Promise<MenuResponse> => {
  try {
    const authHeader = getAuthorizationHeader();
    const response = await axios.patch(`${API_BASE_URL}/menu/toggleAvailabilityMenu/${id}`, {}, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ||
          "An error occurred while toggling menu item availability"
      );
    } else {
      throw new Error("An unknown error occurred while toggling menu item availability");
    }
  }
};

export const deleteMenuItem = async (id: string): Promise<MenuResponse> => {
  try {
    const authHeader = getAuthorizationHeader();
    const response = await axios.delete(`${API_BASE_URL}/menu/deleteMenuItem/${id}`, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ||
          "An error occurred while deleting menu item"
      );
    } else {
      throw new Error("An unknown error occurred while deleting menu item");
    }
  }
};
