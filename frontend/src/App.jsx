import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import FormularioBaja from "./components/FormularioBaja";
import SupervisorAuth from "./components/SupervisorAuth";
import AdminDashboard from "./components/AdminDashboard";

// Componente para proteger rutas de admin
const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const auth = sessionStorage.getItem("supervisorAuth");
    setIsAuthenticated(auth === "true");
    setIsChecking(false);
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <SupervisorAuth onSuccess={() => setIsAuthenticated(true)} />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta pública para vendedores */}
        <Route
          path="/"
          element={
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
              <Navbar />
              <main className="container mx-auto px-4 py-8 md:py-12">
                <FormularioBaja />
              </main>
              <footer className="mt-auto py-6 text-center text-gray-600 text-sm">
                <p>Sistema de Gestión de Bajas © {new Date().getFullYear()}</p>
                <p className="text-xs mt-1 text-gray-500">Versión 1.0 - Solo para uso interno</p>
              </footer>
            </div>
          }
        />

        {/* Ruta protegida para supervisores */}
        <Route
          path="/api/index"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Redireccionar cualquier otra ruta al home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
