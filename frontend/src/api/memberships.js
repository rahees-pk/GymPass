import api from "./axios";

/**
 * Membership API calls for the authenticated user, built on the
 * existing shared Axios instance — same pattern as every other API
 * module in this project.
 */

// GET /api/memberships/me
export const fetchMyMembership = async () => {
  const res = await api.get("/memberships/me");
  return res.data.membership;
};

// GET /api/memberships/check-active
export const checkActiveMembershipRequest = async () => {
  const res = await api.get("/memberships/check-active");
  return { hasMembership: res.data.hasMembership, membership: res.data.membership };
};

// PATCH /api/memberships/:id/cancel
export const cancelMembershipRequest = async (id) => {
  const res = await api.patch(`/memberships/${id}/cancel`);
  return res.data.membership;
};