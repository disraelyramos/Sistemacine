import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './contexts/AuthContext';
import './styles/fonts.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Componente para proteger rutas privadas
const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div>Cargando...</div>;

  return user ? children : <Navigate to="/login" />;
};

// Componente para rutas públicas (login)
const PublicRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div>Cargando...</div>;

  return !user ? children : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login /> {/* Aquí debes colocar el botón GoogleLogin dentro del componente Login */}
            </PublicRoute>
          }
        />
        <Route
          path="/dashboard/*"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
