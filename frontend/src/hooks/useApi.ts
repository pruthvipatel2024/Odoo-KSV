import { useAuth } from "../context/AuthContext";

export const API_BASE_URL = "http://localhost:5000";

interface FetchOptions extends Omit<RequestInit, "body"> {
  body?: any;
  isFormData?: boolean;
}

export const useApi = () => {
  const { token, logout } = useAuth();

  const request = async (endpoint: string, options: FetchOptions = {}) => {
    const url = `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
    
    const headers: Record<string, string> = {};
    
    // Add token
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    // Setup Content-Type (automatically omitted if using FormData so browser handles boundary)
    if (!options.isFormData && !(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...(options.headers as Record<string, string>),
      },
    };

    if (options.body) {
      config.body = options.isFormData || options.body instanceof FormData
        ? options.body
        : JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      
      // Auto logout if token expires (401)
      if (response.status === 401) {
        logout();
        throw new Error("Session expired. Please log in again.");
      }

      // Handle file download streams directly
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/pdf")) {
        return response;
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.msg || data.errors ? JSON.stringify(data.errors || data.msg) : "Something went wrong");
      }
      
      return data;
    } catch (error: any) {
      console.error("API Request Error:", error);
      throw error;
    }
  };

  return {
    get: (endpoint: string, options?: FetchOptions) => request(endpoint, { ...options, method: "GET" }),
    post: (endpoint: string, body?: any, options?: FetchOptions) => request(endpoint, { ...options, method: "POST", body }),
    put: (endpoint: string, body?: any, options?: FetchOptions) => request(endpoint, { ...options, method: "PUT", body }),
    delete: (endpoint: string, options?: FetchOptions) => request(endpoint, { ...options, method: "DELETE" }),
  };
};
