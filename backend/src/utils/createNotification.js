import Notification from "../models/Notification.js";

/**
 * Single reusable entry point for creating a Notification document.
 * Called from existing controllers (payment, membership, check-in,
 * checkout) after their own core operation has already succeeded —
 * never called speculatively, never called on a failed operation.
 *
 * Deliberately does NOT throw on failure by default: a notification
 * failing to save should never turn an otherwise-successful core
 * operation (a payment, a check-in, etc.) into a failed response to
 * the user. Callers should wrap this in their own try/catch (or rely
 * on this function's internal catch) and log, not propagate, unless
 * they have a specific reason to want the error surfaced.
 *
 * @param {Object} params
 * @param {string} params.user - User ObjectId
 * @param {"membership"|"payment"|"checkin"|"checkout"|"gym"|"system"} params.type
 * @param {string} params.title
 * @param {string} params.message
 * @param {string} [params.relatedId] - optional related document id
 * @param {string} [params.relatedType] - optional label for relatedId's type
 */
const createNotification = async ({ user, type, title, message, relatedId = null, relatedType = null }) => {
  try {
    const notification = await Notification.create({
      user,
      type,
      title,
      message,
      relatedId,
      relatedType,
    });
    return notification;
  } catch (error) {
    console.error("Failed to create notification:", { user, type, title }, error);
    return null;
  }
};

export default createNotification;