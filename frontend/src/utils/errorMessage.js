/**
 * Converts an Axios error into a clean, user-facing message, following
 * the same status-code mapping across every gym management page so we
 * don't duplicate this logic in each component.
 */
export const getErrorMessage = (error) => {
  // No response at all means the request never reached the server
  // (server down, no network, CORS failure, etc.)
  if (!error.response) {
    return "Unable to connect to the server. Please check your connection and try again.";
  }

  const { status, data } = error.response;

  switch (status) {
    case 400:
      return data?.message || "Please check the information you entered and try again.";
    case 401:
      return "Please login again.";
    case 403:
      return "You do not have permission to manage gyms.";
    case 404:
      return data?.message || "The requested gym could not be found.";
    case 500:
    default:
      return "Something went wrong. Please try again.";
  }
};