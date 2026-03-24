import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import ApiService from "../services/api";

/**
 * Context para estado global da aplicação
 * Gerir perfil do utilizador e dados de sessão
 */
export const AppContext = createContext();

export function AppProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  /**
   * Carregar perfil do utilizador autenticado
   */
  const loadMyProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('authToken');
      if (!token) {
        setProfile(null);
        setIsLoggedIn(false);
        return;
      }
      const data = await ApiService.getMyProfile();
      // If token was cleared by ApiService (stale/invalid), detect it
      const stillHasToken = !!localStorage.getItem('authToken');
      setIsLoggedIn(stillHasToken);
      setProfile(stillHasToken ? data : null);
    } catch (err) {
      console.error("Error loading profile:", err);
      setError(err.message);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Carregar perfil do utilizador por ID
   */
  const loadProfile = useCallback(async (profileId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await ApiService.getProfile(profileId);
      setProfile(data);
      setIsLoggedIn(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Atualizar perfil
   */
  const updateProfile = useCallback(async (profileData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await ApiService.updateProfile(profileData);
      setProfile(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Logout
   */
  const logout = useCallback(async () => {
    await ApiService.logout();
    setProfile(null);
    setIsLoggedIn(false);
    setError(null);
  }, []);

  // Carregar perfil ao iniciar se autenticado
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      loadMyProfile();
    } else {
      setLoading(false);
    }
  }, [loadMyProfile]);

  const value = {
    profile,
    loading,
    error,
    isLoggedIn,
    loadProfile,
    loadMyProfile,
    updateProfile,
    logout,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/**
 * Hook para usar o AppContext
 */
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp deve ser usado dentro de AppProvider");
  }
  return context;
}
