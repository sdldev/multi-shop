import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import { ToastProvider } from './components/ui/toast';
import { FlashSuccessProvider } from './components/FlashSuccessProvider';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import StaffMobile from './pages/StaffMobile';

function App() {
  return (
    <Provider store={store}>
      <FlashSuccessProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              {/* Staff Mobile Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <StaffMobile />
                  </ProtectedRoute>
                }
              />
              
              {/* Redirect all other routes to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </FlashSuccessProvider>
    </Provider>
  );
}

export default App;
