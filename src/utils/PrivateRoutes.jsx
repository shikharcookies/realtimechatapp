import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/authHook';

const PrivateRoutes = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Ensure we check explicitly for `false`
  if (user.emailVerification === false) {
    return <Navigate to="/verify" />;
  }

  return <Outlet />;
};

export default PrivateRoutes;
