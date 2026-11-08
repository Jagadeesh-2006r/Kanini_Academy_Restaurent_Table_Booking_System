import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import BranchListPage from './pages/BranchListPage';
import BranchDetailPage from './pages/BranchDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';

// Customer Pages
import CustomerDashboard from './pages/CustomerDashboard';
import NewReservationPage from './pages/NewReservationPage';
import MyReservationsPage from './pages/MyReservationsPage';
import ReservationConfirmationPage from './pages/ReservationConfirmationPage';

// Staff Pages
import StaffDashboard from './pages/StaffDashboard';
import StaffTodayPage from './pages/StaffTodayPage';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import ManageBranchesPage from './pages/ManageBranchesPage';
import ManageTablesPage from './pages/ManageTablesPage';
import ManageStaffPage from './pages/ManageStaffPage';
import AllReservationsPage from './pages/AllReservationsPage';
import ReportsPage from './pages/ReportsPage';

function App() {
  return (
    <AuthProvider>
      <div className="d-flex flex-column min-vh-100">
        <Navbar />

        <main className="flex-grow-1">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/branches" element={<BranchListPage />} />
            <Route path="/branches/:id" element={<BranchDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Common Authenticated Routes */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER', 'STAFF', 'ADMIN']}>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Customer Protected Routes */}
            <Route
              path="/customer/dashboard"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reservations/new"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                  <NewReservationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reservations/my"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                  <MyReservationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reservations/confirmation/:id"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER', 'STAFF', 'ADMIN']}>
                  <ReservationConfirmationPage />
                </ProtectedRoute>
              }
            />

            {/* Staff Protected Routes */}
            <Route
              path="/staff/dashboard"
              element={
                <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
                  <StaffDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/today"
              element={
                <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
                  <StaffTodayPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Protected Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/branches"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <ManageBranchesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/tables"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <ManageTablesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/staff"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <ManageStaffPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reservations"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AllReservationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />

            {/* Fallback Catch-all Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;
