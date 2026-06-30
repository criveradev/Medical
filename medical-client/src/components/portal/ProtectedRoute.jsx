import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Guard de rutas del portal: si no hay sesión activa, redirige a /login
 * recordando la ruta de origen.
 * @param {{children: import('react').ReactNode}} props
 * @returns {JSX.Element}
 */
export default function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}
