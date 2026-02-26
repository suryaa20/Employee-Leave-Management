import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import Loader from '../components/common/Loader';

const PrivateRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default PrivateRoute;