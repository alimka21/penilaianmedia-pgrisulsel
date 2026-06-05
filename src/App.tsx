import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { JuriDashboard } from "@/pages/juri/JuriDashboard";

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) => {
  const { user, isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  
  // Custom check: if role is admin and allowed is admin, or we allowed 'juri' and user.role starts with 'juri-'
  const isAuthorized = allowedRoles.includes(user.role!) || 
                       (allowedRoles.includes('juri') && user.role?.startsWith('juri-'));

  if (!isAuthorized) {
    // If logged in but unauthorized, redirect to their respective dashboard
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/juri/dashboard'} replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* Admin Routes */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Juri Routes */}
        <Route 
          path="/juri/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['juri']}>
              <JuriDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

