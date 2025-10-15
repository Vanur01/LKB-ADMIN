import axios from 'axios';

// Define API base URL - update with your backend URL
const API_BASE_URL = "https://api.orderfood.coffee/api/v1";
// Define TypeScript interfaces based on the backend model
export interface DeliveryBoy {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  status: "active" | "inactive" | "blocked";
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryBoyResponse {
  result: {
    page: number;
    totalPages: number;
    total: number;
    data: DeliveryBoy[];
  };
}

export interface CreateDeliveryBoyData {
  name: string;
  phone: string;
  email?: string;
  status?: "active" | "inactive" | "blocked";
}

export interface UpdateDeliveryBoyData extends Partial<CreateDeliveryBoyData> {}

// Helper function to get auth headers
const getAuthHeaders = () => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
  return {};
};

// API Functions
export const createDeliveryBoy = async (data: CreateDeliveryBoyData): Promise<DeliveryBoy> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/deliverBoy/add`, data, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Error creating delivery boy:', error);
    throw new Error(
      axios.isAxiosError(error) && error.response?.data?.message
        ? error.response.data.message
        : 'Failed to create delivery boy'
    );
  }
};

export const getAllDeliveryBoys = async (
  page: number = 1,
  limit: number = 10,
  filters?: {
    search?: string;
  }
): Promise<DeliveryBoyResponse> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filters?.search) {
      params.append('search', filters.search);
    }

    const response = await axios.get(`${API_BASE_URL}/deliverBoy/getAll?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching delivery boys:', error);
    throw new Error(
      axios.isAxiosError(error) && error.response?.data?.message
        ? error.response.data.message
        : 'Failed to fetch delivery boys'
    );
  }
};

export const getDeliveryBoyById = async (id: string): Promise<{ result: DeliveryBoy }> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/deliverBoy/getById/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching delivery boy:', error);
    throw new Error(
      axios.isAxiosError(error) && error.response?.data?.message
        ? error.response.data.message
        : 'Failed to fetch delivery boy details'
    );
  }
};

export const updateDeliveryBoy = async (
  id: string,
  data: UpdateDeliveryBoyData
): Promise<DeliveryBoy> => {
  try {
    const response = await axios.put(`${API_BASE_URL}/deliverBoy/update/${id}`, data, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Error updating delivery boy:', error);
    throw new Error(
      axios.isAxiosError(error) && error.response?.data?.message
        ? error.response.data.message
        : 'Failed to update delivery boy'
    );
  }
};

export const deleteDeliveryBoy = async (id: string): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/deliverBoy/delete/${id}`, {
      headers: getAuthHeaders(),
    });
  } catch (error) {
    console.error('Error deleting delivery boy:', error);
    throw new Error(
      axios.isAxiosError(error) && error.response?.data?.message
        ? error.response.data.message
        : 'Failed to delete delivery boy'
    );
  }
};