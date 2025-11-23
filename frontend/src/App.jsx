import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Register from './pages/Register';
import ExporterDashboard from './pages/exporter/ExporterDashboard';
import NewBatch from './pages/exporter/NewBatch';
import AdminDashboard from './pages/admin/AdminDashboard';
import CustomsDashboard from './pages/customs/CustomsDashboard';
import VerifyPortal from './pages/verify/VerifyPortal';
import RoleRedirect from './pages/RoleRedirect';
import Unauthorized from './pages/Unauthorized';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<RoleRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'QA']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exporter"
          element={
            <ProtectedRoute allowedRoles={['EXPORTER']}>
              <ExporterDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exporter/new"
          element={
            <ProtectedRoute allowedRoles={['EXPORTER']}>
              <NewBatch />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customs"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMS', 'IMPORTER']}>
              <CustomsDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/verify" element={<VerifyPortal />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" />
    </>
  );
}

export default App;
