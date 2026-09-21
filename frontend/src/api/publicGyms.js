import api from "./axios";

/**
 * Public, unauthenticated gym browsing calls — no login required.
 * Kept separate from api/gyms.js (owner-authenticated) and
 * api/adminGyms.js (admin-authenticated) since these hit the backend's
 * public endpoints, which only ever return approved gyms and never
 * depend on who (if anyone) is logged in.
 */

// GET /api/gyms — all approved gyms
export const fetchApprovedGyms = async () => {
  const res = await api.get("/gyms");
  return res.data.gyms;
};

// GET /api/gyms/:id — a single approved gym
export const fetchGymById = async (id) => {
  const res = await api.get(`/gyms/${id}`);
  return res.data.gym;
};