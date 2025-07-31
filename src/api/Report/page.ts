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

export interface DashboardOrderItem {
  deliveryDetails?: {
    firstName: string;
    lastName: string;
    hostel: string;
    roomNumber: string;
    floor: string;
    phone: string;
  };
  dineInDetails?: {
    firstName: string;
    lastName: string;
    phone: string;
    tableNumber: string;
  };
  _id: string;
  items: Array<{
    menuId: string;
    name: string;
    quantity: number;
    price: number;
    _id: string;
  }>;
  totalAmount: number;
  orderType: "delivery" | "dinein";
  isPaid: boolean;
    grandTotal?: number;

  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderDashboardResponse {
  success: boolean;
  statusCode: number;
  message: string;
  result: {
    totalOrders: number;
    totalRevenue: number;
    avgOrderValue: string;
      grandTotal?: number;

    pendingDeliveryOrdersCount: number;
    pendingDineInOrdersCount: number;
    recentOrders: DashboardOrderItem[];
    pendingDeliveryOrders: DashboardOrderItem[];
    pendingDineInOrders: DashboardOrderItem[];
  };
}

export const getOrderDashboard = async (range: "daily" | "weekly" | "monthly" = "weekly"): Promise<OrderDashboardResponse> => {
  try {
    const authHeader = getAuthorizationHeader();
    const response = await axios.get(`${API_BASE_URL}/dashboard/getOrderDashBoard`, {
      params: { range },
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
          "An error occurred while fetching dashboard report"
      );
    } else if (error instanceof Error) {
      throw error; // Rethrow authentication errors
    } else {
      throw new Error("An unknown error occurred while fetching dashboard report");
    }
  }
};
