import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { CustomerDetails } from './pages/CustomerDetails';
import { Staff } from './pages/Staff';
import { Vehicles } from './pages/Vehicles';
import { Lessons } from './pages/Lessons';
import { Payments } from './pages/Payments';
import { Addresses } from './pages/Addresses';
import { Login } from './pages/Login';
import { Profile } from './pages/Profile';
import { hasAccess, UserRole } from './utils/rolePermissions';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        // Validate user has required fields
        if (user.account_id && user.username && user.role && user.userType) {
          setIsAuthenticated(true);
          setUserRole(user.role);
        } else {
          // Invalid user data, clear it
          console.error('Invalid user data structure in localStorage');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
          setUserRole(null);
        }
      } catch (err) {
        // Failed to parse user data
        console.error('Failed to parse user data:', err);
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setUserRole(null);
      }
    }
    setIsLoading(false);
  }, []);

  const ProtectedRoute: React.FC<{ children: React.ReactNode; path: string }> = ({ children, path }) => {
    const location = useLocation();
    
    if (!isAuthenticated) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    
    if (userRole && !hasAccess(userRole, path)) {
      return <Navigate to="/dashboard" replace />;
    }
    
    return <>{children}</>;
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="*"
          element={
            isLoading ? (
              <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-600">Loading...</p>
                </div>
              </div>
            ) : isAuthenticated ? (
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <div className="flex-1 bg-gray-100 p-6">
                  <div className="container mx-auto">
                    <Routes>
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route 
                        path="/dashboard" 
                        element={
                          <ProtectedRoute path="/dashboard">
                            <Dashboard />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/customers" 
                        element={
                          <ProtectedRoute path="/customers">
                            <Customers />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/customers/:id" 
                        element={
                          <ProtectedRoute path="/customers">
                            <CustomerDetails />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/staff" 
                        element={
                          <ProtectedRoute path="/staff">
                            <Staff />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/vehicles" 
                        element={
                          <ProtectedRoute path="/vehicles">
                            <Vehicles />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/lessons" 
                        element={
                          <ProtectedRoute path="/lessons">
                            <Lessons />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/payments" 
                        element={
                          <ProtectedRoute path="/payments">
                            <Payments />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/addresses" 
                        element={
                          <ProtectedRoute path="/addresses">
                            <Addresses />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/profile" 
                        element={
                          <ProtectedRoute path="/profile">
                            <Profile />
                          </ProtectedRoute>
                        } 
                      />
                      
                      { /* Chat feature removed */ }
                    </Routes>
                  </div>
                </div>
              </div>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
