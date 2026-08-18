import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"
});

// Attach Authorization header dynamically from localStorage on every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token && token !== "undefined" && token !== "null") {
            config.headers.Authorization = `Bearer ${token}`;
            // Track which token was used so the response interceptor
            // can verify it's still the active token when a 401 is received
            (config as any)._authToken = token;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Handle 401 unauthorized responses safely.
// Only fire auth:logout if the token that FAILED is still the current token
// in localStorage. This prevents stale 401s from old requests from wiping
// out a freshly-issued token after a new login.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isAuthEndpoint =
            error.config?.url?.includes('/api/auth/login') ||
            error.config?.url?.includes('/api/auth/register');

        if (error.response?.status === 401 && !isAuthEndpoint) {
            const tokenUsed = (error.config as any)?._authToken;
            const currentToken = localStorage.getItem("token");
            // Only log out if the token that caused the 401 is still the active token
            if (tokenUsed && tokenUsed === currentToken) {
                window.dispatchEvent(new CustomEvent('auth:logout'));
            }
        }
        return Promise.reject(error);
    }
);

export default api;



