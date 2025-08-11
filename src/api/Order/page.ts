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

export interface OrderItem {
  _id: string;
  orderId: string;
  items: Array<{
    menuItem: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: string;
  grandTotal?: number;
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string;
  orderDate: string;
}

export interface OrderResponse {
  success: boolean;
  statusCode: number;
  message: string;
  result: {
    page: number;
    totalPages: number;
    data: Array<{
      deliveryDetails?: {
        firstName: string;
        lastName: string;
        hostel: string;
        roomNumber: string;
        floor: string;
        phone: string;
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
      grandTotal?: number;
      orderType: "delivery" | "dinein";
      isPaid: boolean;
      status: string;
      createdAt: string;
      updatedAt: string;
    }>;
    statusCounts: {
      totalOrder: number;
      pending: number;
      ready: number;
      delivered: number;
    };
  };
}

export const getAllOrders = async (
  page: number = 1, 
  limit: number = 10,
  filters?: {
    search?: string,
    isPaid?: boolean,
    orderType?: 'delivery' | 'dinein'
  }
): Promise<OrderResponse> => {
  try {
    const authHeader = getAuthorizationHeader();
    const response = await axios.get(`${API_BASE_URL}/order/getAllOrders`, {
      params: { 
        page, 
        limit,
        isPaid: true, // Always filter for paid orders only
        ...(filters?.search && { search: filters.search }),
        ...(filters?.orderType && { orderType: filters.orderType })
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
          "An error occurred while fetching orders"
      );
    } else if (error instanceof Error) {
      throw error; // Rethrow authentication errors
    } else {
      throw new Error("An unknown error occurred while fetching orders");
    }
  }
};

export const getOrderById = async (id: string): Promise<OrderResponse> => {
  try {
    const authHeader = getAuthorizationHeader();
    const response = await axios.get(`${API_BASE_URL}/order/getOrderById/${id}`, {
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
          "An error occurred while fetching order details"
      );
    } else {
      throw new Error("An unknown error occurred while fetching order details");
    }
  }
};

export const updateOrder = async (id: string, orderData: Partial<OrderItem>): Promise<OrderResponse> => {
  try {
    const authHeader = getAuthorizationHeader();
    const response = await axios.put(`${API_BASE_URL}/order/orderUpdated/${id}`, orderData, {
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
          "An error occurred while updating order"
      );
    } else {
      throw new Error("An unknown error occurred while updating order");
    }
  }
};

export const deleteOrder = async (id: string): Promise<OrderResponse> => {
  try {
    const authHeader = getAuthorizationHeader();
    const response = await axios.delete(`${API_BASE_URL}/order/deleteOrder/${id}`, {
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
          "An error occurred while deleting order"
      );
    } else {
      throw new Error("An unknown error occurred while deleting order");
    }
  }
};
