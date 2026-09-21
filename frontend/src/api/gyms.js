import api from "./axios";

/**
 * All gym-related API calls, built on top of the existing shared Axios
 * instance (src/api/axios.js), which already has baseURL + withCredentials
 * configured. No new Axios instance is created here.
 */

// GET /api/gyms/owner/mine — gyms belonging to the logged-in owner
export const fetchOwnerGyms = async () => {
  const res = await api.get("/gyms/owner/mine");
  return res.data.gyms;
};

// POST /api/gyms — create a new gym (multipart/form-data)
export const createGymRequest = async (formData) => {
  const res = await api.post("/gyms", formData);
  return res.data.gym;
};

// PUT /api/gyms/:id — update an existing gym (multipart/form-data)
export const updateGymRequest = async (id, formData) => {
  const res = await api.put(`/gyms/${id}`, formData);
  return res.data.gym;
};

// DELETE /api/gyms/:id
export const deleteGymRequest = async (id) => {
  const res = await api.delete(`/gyms/${id}`);
  return res.data;
};