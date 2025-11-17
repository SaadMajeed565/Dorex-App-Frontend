import axios from "axios";
import router from "./router";

/**
 * Get the API base URL based on the current subdomain/domain
 * Takes VITE_API_BASE_URL from .env and replaces hostname with current tenant subdomain
 * 
 * Example:
 * - .env: VITE_API_BASE_URL=http://localhost:8000/api
 * - Frontend: http://tenant1.localhost:5173
 * - Result: http://tenant1.localhost:8000/api
 */
function getApiBaseUrl(): string {
    const currentHostname = window.location.hostname; // e.g., tenant.dorex.app
    const appUrl = import.meta.env.VITE_APP_URL;      // e.g., dorex.app
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL; // e.g., api.dorex.app

    if (apiBaseUrl && appUrl) {
        try {
            const currentSubdomain = currentHostname.replace(`.${appUrl}`, ''); // "tenant"
            const envUrl = new URL(`https://${apiBaseUrl}`);
            envUrl.hostname = `${currentSubdomain}.${envUrl.hostname}`; // "tenant.api.dorex.app"
            return envUrl.toString().replace(/\/$/, ''); // remove trailing slash
        } catch (e) {
            console.error('[API Config] Invalid VITE_API_BASE_URL or VITE_APP_URL', e);
        }
    }

    // Fallback: construct URL from current location
    const protocol = window.location.protocol;
    const apiPort = import.meta.env.VITE_API_PORT || '8000';
    const port = apiPort ? `:${apiPort}` : '';
    return `${protocol}//${currentHostname}${port}/api`;
}


const axiosClient = axios.create({
    baseURL: getApiBaseUrl(),
    withCredentials: true,
    withXSRFToken: true
});

// axiosClient.interceptors.request.use( (config:any) => {
//     config.headers.Authorization = `Bearer ${localStorage.getItem('token')}`
// });

axiosClient.interceptors.request.use(
    (config: any) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config; // ✅ must return config
    },
    (error) => Promise.reject(error) // optional error handler
  );
  

axiosClient.interceptors.response.use((response) => {
    return response
}, error => {
    if (error.response && error.response.status === 401) {
        router.push({ name: "Home.Index" });
    }

    throw error;
});

export default axiosClient;