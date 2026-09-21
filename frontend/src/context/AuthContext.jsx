import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Calls GET /api/auth/me. This endpoint always returns 200 with
   * either { user: {...} } or { user: null } — so there is no
   * "unauthenticated = error" case to handle here.
   */
  const refreshUser = async () => {
    const res = await api.get("/auth/me");
    setUser(res.data.user);
    return res.data.user;
  };

  // On initial app load, find out if there's an existing valid session
  // (the httpOnly cookie persists across refreshes even though this
  // React state does not).
  useEffect(() => {
    const initAuth = async () => {
      try {
        await refreshUser();
      } catch (error) {
        // Unexpected failure (e.g. network/server error, not a normal
        // "not logged in" case, since /me itself never errors for that).
        console.error("Failed to check auth session:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Logs in and stores the returned user. Throws on failure so the
   * calling page can display a specific error message.
   */
  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      setUser(res.data.user);
      return res.data.user;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Registers a new account and stores the returned user. Throws on
   * failure so the calling page can display a specific error message.
   */
  const register = async (name, email, password, role) => {
    try {
      const res = await api.post("/auth/register", { name, email, password, role });
      setUser(res.data.user);
      return res.data.user;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Logs out on the backend (clears the httpOnly cookie) and always
   * clears local user state, even if the network call fails.
   */
  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Convenience hook for consuming AuthContext. Throws if used outside
 * an AuthProvider, to catch wiring mistakes early during development.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};