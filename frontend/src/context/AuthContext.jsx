import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('intranet_token'));
  const [loading, setLoading] = useState(true);
  const [menuSections, setMenuSections] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);

  const loadUserData = async () => {
    try {
      const userData = await api.getMe();
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Error cargando usuario:', error);
      api.setToken(null);
      setToken(null);
      setUser(null);
    }
  };

  // Check auth state on mount
  useEffect(() => {
    async function loadInitial() {
      const savedToken = localStorage.getItem('intranet_token');
      if (savedToken) {
        const u = await loadUserData();
        if (u) {
          await loadMenu();
        }
      }
      setLoading(false);
    }
    loadInitial();
  }, []);

  const loadMenu = async () => {
    try {
      setMenuLoading(true);
      const navData = await api.getMenu();
      setMenuSections(navData.sections || []);
    } catch (error) {
      console.error('Error cargando menú de navegación:', error);
    } finally {
      setMenuLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.login(email, password);
      api.setToken(response.access_token);
      setToken(response.access_token);
      setUser(response.user);
      
      // Load role-based dynamic navigation
      const navData = await api.getMenu();
      setMenuSections(navData.sections || []);
      
      return response;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    api.setToken(null);
    setToken(null);
    setUser(null);
    setMenuSections([]);
  };

  const updateUser = (updatedFields) => {
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : prev));
  };

  const refreshUser = async () => {
    return await loadUserData();
  };

  const hasRole = (roles) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  const hasModulePermission = (moduleKey) => {
    if (!user) return false;

    // 1. Global Module Active Check: if deactivated in Intranet-Einstellungen, hide everywhere for everyone
    if (menuSections && menuSections.length > 0) {
      const allActiveItems = menuSections.flatMap((s) => s.items || []);
      const isPresentInActiveMenu = allActiveItems.some(
        (i) =>
          i.key === moduleKey ||
          i.path === `/${moduleKey}` ||
          (moduleKey === 'tickets' && (i.key === 'it-helpdesk' || i.path?.includes('tickets') || i.path?.includes('helpdesk'))) ||
          (moduleKey === 'hr-requests' && (i.key === 'hr-requests' || i.key === 'hr_requests' || i.path?.includes('requests'))) ||
          (moduleKey === 'it-management' && (i.key === 'it-management' || i.path?.includes('management')))
      );

      if (moduleKey !== 'dashboard' && !isPresentInActiveMenu) {
        return false;
      }
    }

    // 2. SuperAdmin has access to all currently active modules
    if (user.role === 'ADMIN') return true;

    // 3. Granular user module override matrix
    if (user.allowed_modules && Array.isArray(user.allowed_modules)) {
      return user.allowed_modules.includes(moduleKey);
    }

    // 4. Default role-based boundaries
    if (['admin-users', 'admin-roles', 'admin-settings'].includes(moduleKey)) {
      return user.role === 'ADMIN';
    }
    if (['hr-requests', 'performance'].includes(moduleKey)) {
      return ['ADMIN', 'HR_MANAGER'].includes(user.role);
    }
    if (['it-management'].includes(moduleKey)) {
      return ['ADMIN', 'IT_ADMIN'].includes(user.role);
    }

    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        menuSections,
        menuLoading,
        login,
        logout,
        hasRole,
        hasModulePermission,
        updateUser,
        refreshUser,
        refreshMenu: loadMenu,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
