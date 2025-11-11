import { Download, HelpCircle } from "lucide-react";
import Swal from "sweetalert2";
import { showSupervisorPrompt, showLoadingAlert, showGeneralError } from "../utils/alerts";
import { reportesAPI } from "../utils/api";
import { iniciarTutorial } from "../utils/tutorial";

const Navbar = () => {
  const handleDescargarReporte = async () => {
    const codigo = await showSupervisorPrompt();

    if (!codigo) return;

    const loadingSwal = showLoadingAlert();

    try {
      const blob = await reportesAPI.descargar(codigo);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `reporte-bajas-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      loadingSwal.close();

      await Swal.fire({
        icon: "success",
        title: "Reporte descargado",
        text: "El archivo se ha descargado correctamente",
        confirmButtonText: "Entendido",
      });
    } catch (error) {
      loadingSwal.close();

      if (error.response?.status === 403) {
        showGeneralError("Código de supervisor inválido");
      } else {
        showGeneralError("Error al descargar el reporte. Intenta de nuevo.");
      }
    }
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Título */}
          <div className="flex items-center space-x-2">
            <div className="bg-white p-2 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold">Sistema de Bajas</h1>
              <p className="text-xs text-blue-100">Gestión de clientes</p>
            </div>
          </div>

          {/* Botones */}
          <div className="flex items-center space-x-3">
            {/* Botón de Ayuda */}
            <button
              onClick={iniciarTutorial}
              className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg 
                         flex items-center space-x-2 transition-all duration-200 
                         shadow-md hover:shadow-lg active:scale-95"
              aria-label="Ver tutorial"
              title="Ver tutorial del sistema"
            >
              <HelpCircle className="w-5 h-5" />
              <span className="hidden sm:inline">Ayuda</span>
            </button>

            {/* Botón Supervisor */}
            <button
              onClick={handleDescargarReporte}
              className="bg-white text-blue-600 hover:bg-blue-50 font-semibold py-2 px-4 rounded-lg 
                         flex items-center space-x-2 transition-all duration-200 
                         shadow-md hover:shadow-lg active:scale-95"
              aria-label="Descargar reporte (solo supervisores)"
              title="Descargar reporte de bajas"
            >
              <Download className="w-5 h-5" />
              <span className="hidden sm:inline">Descargar Reporte</span>
              <span className="sm:hidden">Reporte</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
