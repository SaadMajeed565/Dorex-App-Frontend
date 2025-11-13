import axios from "axios";
import router from "./router";

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
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