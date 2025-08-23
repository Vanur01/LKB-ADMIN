
import axios from "axios";

const API_BASE_URL = "http://localhost:9001/api/v1";

export interface MenuDetails {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isVeg: boolean;
  image: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface TopSellingItem {
  menuDetails: MenuDetails;
  totalQuantity: number;
  totalRevenue: number;
  averagePrice: number;
  thisWeek: { quantity: number; revenue: number };
  lastWeek: { quantity: number; revenue: number };
  thisMonth: { quantity: number; revenue: number };
  lastMonth: { quantity: number; revenue: number };
  weekGrowth: number;
  monthGrowth: number;
  revenuePercentage: number;
}

export interface TopCategory {
  category: string;
  total: number;
}

export interface RevenueData {
  today: number;
  weekly: number;
  monthly: number;
}

export interface RevenueDashboardResult {
  revenue: RevenueData;
  topSellingItems: TopSellingItem[];
  topCategories: TopCategory[];
  hourlyOrderTrends: number[];
}

export interface RevenueDashboardResponse {
  success: boolean;
  statusCode: number;
  message: string;
  result: RevenueDashboardResult;
}

// Helper function to get token and check auth
const getAuthorizationHeader = (): string => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication required. Please log in again.');
  }
  return `Bearer ${token}`;
};

export const getRevenueDashboard = async (
  range: "today" | "weekly" | "monthly" = "weekly"
): Promise<RevenueDashboardResponse> => {
  try {
    // Get auth token and check if it exists
    const authHeader = getAuthorizationHeader();
    console.log('Auth Header:', authHeader);

    const response = await axios.get(
      `${API_BASE_URL}/dashboard/getRevenueDashboard`,
      {
        params: { range },
  headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
      }
    );

    // Handle unauthorized access
    if (response.status === 401) {
      localStorage.clear(); // Clear all stored data
      throw new Error('Session expired. Please log in again.');
    }

    // Handle forbidden access
    if (response.status === 403) {
      throw new Error('You do not have permission to access this data.');
    }

    // Handle server errors
    if (response.status === 500) {
      throw new Error('Server error. Please try again later.');
    }

    // Handle other error status codes
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch dashboard data');
    }

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
        "An error occurred while fetching revenue dashboard data"
      );
    } else if (error instanceof Error) {
      throw error; // Rethrow authentication errors
    } else {
      throw new Error("An unknown error occurred while fetching revenue dashboard data");
    }
  }
};

