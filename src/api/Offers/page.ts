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

export interface OfferBanner {
  _id: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface CreateBannerData {
  // Only image file is required based on backend
}

// Get all banners
export const getAllBanners = async (active?: boolean): Promise<OfferBanner[]> => {
  try {
    const url = active !== undefined 
      ? `${API_BASE_URL}/offerBanner/getAll?active=${active}`
      : `${API_BASE_URL}/offerBanner/getAll`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch banners: ${response.statusText}`);
    }

    const data = await response.json();
    return data.result || [];
  } catch (error) {
    console.error("Error fetching banners:", error);
    throw error;
  }
};

// Create new banner
export const createBanner = async (
  imageFile: File
): Promise<OfferBanner> => {
  try {
    const formData = new FormData();
    formData.append("banner", imageFile);

    const response = await axios.post(`${API_BASE_URL}/offerBanner/add`, formData, {
      headers: {
        Authorization: getAuthorizationHeader(),
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.result;
  } catch (error) {
    console.error("Error creating banner:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || "Failed to create banner");
    }
    throw error;
  }
};

// Delete banner
export const deleteBanner = async (id: string): Promise<boolean> => {
  try {
    await axios.delete(`${API_BASE_URL}/offerBanner/delete/${id}`, {
      headers: {
        Authorization: getAuthorizationHeader(),
      },
    });

    return true;
  } catch (error) {
    console.error("Error deleting banner:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || "Failed to delete banner");
    }
    throw error;
  }
};