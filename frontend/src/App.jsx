import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import { ToastProvider } from './components/ui/toast';
import ProtectedRoute from './components/ProtectedRoute';
import RoleBasedRoute from './components/RoleBasedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Branches from './pages/Branches';
import Customers from './pages/Customers';
import Staff from './pages/Staff';
import StaffMobile from './pages/StaffMobile';
import Admins from './pages/Admins';

function App() {
  return (
    <Provider store={store}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Staff Mobile Route (standalone, no Layout) */}
            <Route
              path="/staff-mobile"
              element={
                <ProtectedRoute>
                  <StaffMobile />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes (with Layout) */}
            <Route
              path="/"
              element={
                <RoleBasedRoute>
                  <Layout />
                </RoleBasedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="customers" element={<Customers />} />
              <Route
                path="branches"
                element={
                  <ProtectedRoute adminOnly>
                    <Branches />
                  </ProtectedRoute>
                }
              />
              <Route
                path="staff"
                element={
                  <ProtectedRoute adminOnly>
                    <Staff />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admins"
                element={
                  <ProtectedRoute adminOnly>
                    <Admins />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </Provider>
  );
}

export default App;
