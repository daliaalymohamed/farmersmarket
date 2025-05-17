import axios from "axios";
import { toast } from "react-toastify";

// API Base URL from environment variables (with fallback)
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api";

// 🔹 Common response error handler
const responseInterceptor = (error) => {
  // if (process.env.NODE_ENV === "development") {
  //   console.error("Axios error:", error);
  // }
  // console.log("🚨 Interceptor caught error:", error);

  if (error.response) {
    const { status, data } = error.response;
    switch (status) {
      case 400:
        toast.error(`Bad Request: ${data.message || data.error || "Please check your input and try again."}`);
        break;
      case 401:
        toast.error("Unauthorized: Please log in again.");
        if (typeof window !== "undefined") {
          setTimeout(() => {
            window.location.href = "/login"; // Redirect after 2 seconds
          }, 2000);
        }
        break;
      case 403:
        toast.error("Forbidden: You don’t have permission.");
        break;
      case 404:
        toast.error("Not Found: The requested resource is unavailable.");
        break;
      case 500:
        toast.error("Server Error: Something went wrong. Please try again later.");
        break;
      default:
        toast.error(`Error: ${data.error || "An unexpected error occurred."}`);
    }
  } else if (error.request) {
    toast.error("No response received from the server.");
  } else {
    toast.error(`Error: ${error.message}`);
  }

  return Promise.reject(error);
};

// 🔹 Axios instance WITH authentication
const api = axios.create({
  baseURL: baseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Attach Authorization Token to requests
api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem("token"); // Get token from localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Handle API responses & errors
api.interceptors.response.use(
  (response) => response,
  responseInterceptor
);

// 🔹 Axios instance WITHOUT authentication
const apiWithoutAuth = axios.create({
  baseURL: baseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Apply response interceptor to unauthenticated API instance
apiWithoutAuth.interceptors.response.use(
  (response) => response,
  responseInterceptor
);

export { api, apiWithoutAuth };