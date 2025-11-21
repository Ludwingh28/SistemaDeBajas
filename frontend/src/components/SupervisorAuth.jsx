import { useState } from "react";
import { Lock } from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";

const SupervisorAuth = ({ onSuccess }) => {
  const [codigo, setCodigo] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!codigo.trim()) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Por favor ingresa tu código de supervisor",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Verificar código con el backend
      const response = await axios.post("http://localhost:3001/api/reportes/descargar", {
        codigoSupervisor: codigo,
      });

      // Si llega aquí, el código es válido
      Swal.fire({
        icon: "success",
        title: "¡Acceso Concedido!",
        text: "Bienvenido, Supervisor",
        timer: 1500,
        showConfirmButton: false,
      });

      // Guardar en sessionStorage
      sessionStorage.setItem("supervisorAuth", "true");
      sessionStorage.setItem("supervisorCode", codigo);

      onSuccess();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Acceso Denegado",
        text: error.response?.data?.error || "Código de supervisor incorrecto",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-blue-100 p-4 rounded-full mb-4">
            <Lock className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Autenticación de Supervisor</h1>
          <p className="text-gray-600 text-center mt-2">Ingresa tu código para acceder al panel administrativo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="codigo" className="block text-sm font-semibold text-gray-700 mb-2">
              Código de Supervisor
            </label>
            <input
              type="password"
              id="codigo"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Ingresa tu código"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg
                       focus:border-blue-500 focus:outline-none transition-colors"
              disabled={isLoading}
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 rounded-lg font-semibold text-white transition-all
              ${isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-95"}`}
          >
            {isLoading ? "Verificando..." : "Acceder"}
          </button>
        </form>

        <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
          <p className="text-sm text-yellow-800">
            <strong>Nota:</strong> Solo personal autorizado puede acceder a esta sección.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SupervisorAuth;
