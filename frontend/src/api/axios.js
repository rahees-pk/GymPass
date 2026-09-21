import axios from "axios";

// A single shared Axios instance used across the whole app.
// withCredentials: true is essential — it tells the browser to send the
// httpOnly JWT cookie along with every request, so the backend can identify the user.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

export default api;
