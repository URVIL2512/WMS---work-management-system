import { BrowserRouter, Routes, Route, Navigate, useNavigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Price from './pages/Price';
import Quotation from './pages/Quotation';
import Orders from './pages/Orders';
import WorkOrders from './pages/WorkOrders';
import InhouseJobs from './pages/InhouseJobs';
import OutsideJobs from './pages/OutsideJobs';
import Inward from './pages/Inward';
import InternalProcess from './pages/InternalProcess';
import Inspection from './pages/Inspection';
import CompletedJobs from './pages/CompletedJobs';
import ReadyDispatch from './pages/ReadyDispatch';
import DispatchHistory from './pages/DispatchHistory';
import Masters from './pages/Masters';
import Customers from './pages/Customers';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Settings from './pages/Settings';

function AppContent() {
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/login');
  };

  // Layout wrapper that persists across route changes
  const LayoutWrapper = () => {
    return (
      <ProtectedRoute>
        <Layout onLogout={handleLogout}>
          <Outlet />
        </Layout>
      </ProtectedRoute>
    );
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* All protected routes share the same Layout instance */}
      <Route element={<LayoutWrapper />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/price" element={<Price />} />
        <Route path="/quotation" element={<Quotation />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/work-orders" element={<WorkOrders />} />
        <Route path="/inhouse-jobs" element={<InhouseJobs />} />
        <Route path="/outside-jobs" element={<OutsideJobs />} />
        <Route path="/inward" element={<Inward />} />
        <Route path="/internal-process" element={<InternalProcess />} />
        <Route path="/inspection" element={<Inspection />} />
        <Route path="/completed-jobs" element={<CompletedJobs />} />
        <Route path="/ready-dispatch" element={<ReadyDispatch />} />
        <Route path="/dispatch-history" element={<DispatchHistory />} />
        <Route path="/masters" element={<Masters />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/users" element={<Users />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
