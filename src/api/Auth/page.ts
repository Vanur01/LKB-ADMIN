import axios from "axios";

const API_BASE_URL = "http://localhost:9001/api/v1";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserData {
  _id: string;
  email: string;
  name: string;
  role: string;
  tokens: string;
  refreshTokens: string;
  tempTokens: string | null;
  restPasswordTokens: string | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface LoginResponse {
  success: boolean;
  statusCode: number;
  message: string;
  result: UserData;
}

export const loginUser = async (credentials: LoginRequest): Promise<LoginResponse> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/user/login`,
      credentials
    );
    
    // Check if we have a successful response
    if (response.data.success && response.data.result) {
      const { tokens, refreshTokens } = response.data.result;
      
      // Store the tokens in localStorage
      localStorage.setItem("token", tokens);
      localStorage.setItem("refreshToken", refreshTokens);
      
      // Store user data without sensitive information
      const userData = {
        _id: response.data.result._id,
        email: response.data.result.email,
        name: response.data.result.name,
        role: response.data.result.role,
      };
      localStorage.setItem("user", JSON.stringify(userData));
      
      return response.data;
    } else {
      // If the response indicates failure but didn't throw an error
      throw new Error(response.data.message || "Login failed");
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Handle specific error cases
      if (error.response?.status === 404) {
        throw new Error("User not found. Please check your email and try again.");
      } else if (error.response?.status === 401) {
        throw new Error("Invalid credentials. Please check your email and password.");
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error("An error occurred during login. Please try again.");
      }
    } else {
      throw new Error("An unknown error occurred. Please try again later.");
    }
  }
};
