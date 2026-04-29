import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;

const client = axios.create({
    baseURL: BASE_URL,
});

client.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

client.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refresh_token = localStorage.getItem("refresh_token");

            if (!refresh_token) {
                window.location.href = "/login";
                return Promise.reject(error);
            }

            try {
                const res = await axios.post(`${BASE_URL}/api/token/refresh/`, {
                    refresh: refresh_token
                });

                localStorage.setItem("access_token", res.data.access);

                return client(originalRequest);
            } catch {
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                window.location.href = "/login";
            }
        }

        return Promise.reject(error);
    }
)

export default client;