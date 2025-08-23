import axios from "axios";

const API_BASE_URL = "http://localhost:9001/api/v1";

const getAuthorizationHeader = (): string => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication required. Please log in again.');
  }
  return `Bearer ${token}`;
};

export interface User {
  _id: string;
  email: string;
  name: string;
  role: string;
  tokens: string | null;
  refreshTokens: string | null;
  tempTokens: string | null;
  restPasswordTokens: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UserApiResponse {
  success: boolean;
  statusCode: number;
  message: string;
  result: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    users: User[];
  };
}

interface SingleUserApiResponse {
  success: boolean;
  statusCode: number;
  message: string;
  result: User;
}

interface SimpleApiResponse {
  success: boolean;
  statusCode: number;
  message: string;
  result?: string;
}

interface ResetPasswordData {
  newPassword: string;
  confirmPassword: string;
}

interface RegisterUserData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface GetUsersFilters {
  name?: string;
  email?: string;
  phone?: string;
}

// Get all users with pagination and filters
export async function getAllUsers(page: number, limit: number, filters: GetUsersFilters = {}) {
  try {
    const params = {
      page,
      limit,
      ...(filters.name && { name: filters.name }),
      ...(filters.email && { email: filters.email }),
      ...(filters.phone && { phone: filters.phone })
    };

    const response = await axios.get<UserApiResponse>(`${API_BASE_URL}/user/getAllUsers`, {
      params,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthorizationHeader()
      }
    });

    const data = response.data;

    return data;
  } catch (error) {
    console.error('Error fetching users:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to fetch users');
    }
    throw error;
  }
}

// Get user by ID
export async function getUserById(userId: string) {
  try {
    const response = await axios.get<SingleUserApiResponse>(`${API_BASE_URL}/user/getUserById/${userId}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthorizationHeader()
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching user:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user');
    }
    throw error;
  }
}

// Update user
export async function updateUser(userId: string, updateData: Partial<User>) {
  try {
    const response = await axios.put<SimpleApiResponse>(
      `${API_BASE_URL}/user/updateUser/${userId}`,
      updateData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthorizationHeader()
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error updating user:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to update user');
    }
    throw error;
  }
}

// Delete user
export async function deleteUser(userId: string) {
  try {
    const response = await axios.delete<SimpleApiResponse>(
      `${API_BASE_URL}/user/deleteUser/${userId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthorizationHeader()
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error deleting user:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to delete user');
    }
    throw error;
  }
}

// Logout user
export async function logoutUser(userId: string) {
  try {
    const response = await axios.get<SimpleApiResponse>(
      `${API_BASE_URL}/user/logout/${userId}`
      
    );

    return response.data;
  } catch (error) {
    console.error('Error logging out user:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to logout user');
    }
    throw error;
  }
}

// Forgot password
export async function forgotPassword(email: string) {
  try {
    const response = await axios.post<SimpleApiResponse>(
      `${API_BASE_URL}/user/forgotPassword`,
      { email },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthorizationHeader()
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error in forgot password:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to process forgot password request');
    }
    throw error;
  }
}

// Reset password
export async function resetPassword(token: string, data: ResetPasswordData) {
  try {
    const response = await axios.post<SimpleApiResponse>(
      `${API_BASE_URL}/user/resetPassword/${token}`,
      data,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthorizationHeader()
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error resetting password:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to reset password');
    }
    throw error;
  }
}

// Register new user
export async function registerUser(data: RegisterUserData) {
  try {
    const response = await axios.post<SimpleApiResponse>(
      `${API_BASE_URL}/user/register`,
      data,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthorizationHeader()
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error registering user:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to register user');
    }
    throw error;
  }
}
