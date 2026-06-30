import { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

/**
 * Provider de autenticación: expone el usuario y las acciones login/logout/
 * actualizarFoto, persistiendo sesión en localStorage.
 * @param {{children: import('react').ReactNode}} props
 * @returns {JSX.Element}
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });

  /**
   * Inicia sesión (POST /api/auth/login) y guarda tokens + usuario.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<object>} El usuario autenticado.
   */
  const login = useCallback(async (email, password) => {
    const data = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.usuario));
    setUser(data.usuario);
    return data.usuario;
  }, []);

  /**
   * Cierra la sesión: limpia tokens y usuario.
   * @returns {void}
   */
  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  /**
   * Actualiza la foto de perfil en la sesión (tras subirla).
   * @param {string} foto - URL de la nueva foto.
   * @returns {void}
   */
  const actualizarFoto = useCallback((foto) => {
    setUser((u) => {
      if (!u) return u;
      const nuevo = { ...u, foto };
      localStorage.setItem('user', JSON.stringify(nuevo));
      return nuevo;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, actualizarFoto }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook para acceder al contexto de autenticación.
 * @returns {{user: object|null, login: Function, logout: Function, actualizarFoto: Function}}
 */
export function useAuth() {
  return useContext(AuthContext);
}
