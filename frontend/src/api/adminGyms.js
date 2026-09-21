import api from "./axios";

/**
 * Admin-only gym management API calls, built on the existing shared
 * Axios instance (src/api/axios.js). Kept separate from api/gyms.js
 * since these hit the distinct /admin/gyms backend prefix and are only
 * ever meant to be called from admin-facing pages.
 */

// GET /api/admin/gyms
// GET /api/admin/gyms?status=pending|approved|rejected|suspended
export const fetchAllGymsForAdmin = async (status) => {
  const res = await api.get("/admin/gyms", { params: status ? { status } : {} });
  return res.data.gyms;
};

// PATCH /api/admin/gyms/:id/status
export const updateGymStatusRequest = async (id, status) => {
  const res = await api.patch(`/admin/gyms/${id}/status`, { status });
  return res.data.gym;
};