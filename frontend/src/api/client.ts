import axios from "axios";

const client = axios.create({
    baseURL: "http://localhost:8000/api",
});

const address = "http://localhost:8000"

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
        if (error.response?.status === 401) {
            const refresh_token = localStorage.getItem("refresh_token");

            if (!refresh_token) {
                window.location.href = "/login";
                return Promise.reject(error);
            }

            try {
                const res = await axios.post(`${address}/api/token/refresh/`, {
                    refresh: refresh_token
                });

                localStorage.setItem("access_token", res.data.access)

                return client(error.config)
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