import { useState } from "react";
import { Tag, Database, Download, LogOut } from "lucide-react";
import GestionMotivos from "./GestionMotivos";
import ActualizarVentas from "./ActualizarVentas";
import DescargarReportes from "./DescargarReportes";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const [vistaActiva, setVistaActiva] = useState("menu");
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem("supervisorAuth");
    sessionStorage.removeItem("supervisorCode");
    navigate("/");
  };

  const menuOptions = [
    {
      id: "motivos",
      title: "Gestión de Motivos",
      description: "Agregar y administrar motivos de baja",
      icon: Tag,
      color: "from-purple-500 to-purple-700",
    },
    {
      id: "ventas",
      title: "Actualizar Ventas",
      description: "Cargar nuevos datos de ventas desde Excel",
      icon: Database,
      color: "from-green-500 to-green-700",
    },
    {
      id: "reportes",
      title: "Descargar Reportes",
      description: "Exportar reportes históricos por rango de fechas",
      icon: Download,
      color: "from-blue-500 to-blue-700",
    },
  ];

  const renderContent = () => {
    switch (vistaActiva) {
      case "motivos":
        return <GestionMotivos onBack={() => setVistaActiva("menu")} />;
      case "ventas":
        return <ActualizarVentas onBack={() => setVistaActiva("menu")} />;
      case "reportes":
        return <DescargarReportes onBack={() => setVistaActiva("menu")} />;
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {menuOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={() => setVistaActiva(option.id)}
                  className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl
                           transition-all duration-300 p-8 text-left hover:scale-105"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${option.color} opacity-0 group-hover:opacity-10 transition-opacity`} />

                  <div className={`bg-gradient-to-br ${option.color} w-16 h-16 rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-xl font-bold text-gray-800 mb-2">{option.title}</h3>
                  <p className="text-gray-600 text-sm">{option.description}</p>

                  <div className="mt-4 flex items-center text-blue-600 font-semibold text-sm">
                    <span>Acceder</span>
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Panel de Administración</h1>
            <p className="text-sm text-gray-600">Sistema de Bajas - Supervisor</p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">{renderContent()}</div>
    </div>
  );
};

export default AdminDashboard;
