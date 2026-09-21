import api from "./axios";

/**
 * Payment/checkout API calls, built on the existing shared Axios
 * instance — same pattern as api/gyms.js, api/adminGyms.js, and
 * api/publicGyms.js. withCredentials is already true on the shared
 * instance, so the httpOnly auth cookie is sent automatically; no
 * token handling happens here.
 */

// POST /api/payments/create-order
// Server determines price/amount from `plan` alone — no amount is
// ever sent from the client.
export const createOrderRequest = async (plan) => {
  const res = await api.post("/payments/create-order", { plan });
  return res.data;
};

// POST /api/payments/verify
export const verifyPaymentRequest = async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  const res = await api.post("/payments/verify", {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  });
  return res.data;
};