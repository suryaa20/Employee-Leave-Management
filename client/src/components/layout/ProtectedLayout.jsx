import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../context/authContext';

const ProtectedLayout = () => {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-dark-bg">
      <Sidebar role={user?.role} />
      <div className="flex-1 ml-64">
        <Header />
        <main className="p-8 overflow-auto bg-gray-100 dark:bg-dark-bg" style={{ height: 'calc(100vh - 73px)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ProtectedLayout;