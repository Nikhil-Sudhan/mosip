import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getRoleLanding } from '../utils/roleRoutes';

export default function RoleRedirect() {
  const user = useAuthStore((state) => state.user);
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={getRoleLanding(user.role)} replace />;
}





