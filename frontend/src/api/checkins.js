import api from "./axios";

/**
 * Check-in API calls, built on the existing shared Axios instance —
 * same pattern as every other API module in this project.
 */

// POST /api/checkins
export const createCheckInRequest = async (gymId) => {
  const res = await api.post("/checkins", { gymId });
  return res.data.checkIn;
};

// GET /api/checkins/active
export const getActiveCheckInRequest = async () => {
  const res = await api.get("/checkins/active");
  return res.data.checkIn;
};

// PATCH /api/checkins/:id/checkout
export const checkoutRequest = async (id) => {
  const res = await api.patch(`/checkins/${id}/checkout`);
  return res.data.checkIn;
};

// GET /api/checkins/history
export const getCheckInHistoryRequest = async () => {
  const res = await api.get("/checkins/history");
  return res.data.checkIns;
};