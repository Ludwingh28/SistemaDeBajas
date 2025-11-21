import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Tag } from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";

const GestionMotivos = ({ onBack }) => {
  const [motivos, setMotivos] = useState([]);
  const [nuevoMotivo, setNuevoMotivo] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    cargarMotivos();
  }, []);

  const cargarMotivos = async () => {
    try {
      const response = await axios.get("http://localhost:3001/api/motivos");
      setMotivos(response.data.motivos || []);
    } catch (error) {
      console.error("Error cargando motivos:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los motivos",
      });
    }
  };

  const agregarMotivo = async (e) => {
    e.preventDefault();

    if (!nuevoMotivo.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Campo vacío",
        text: "Por favor ingresa un motivo",
      });
      return;
    }

    setIsLoading(true);

    try {
      await axios.post("http://localhost:3001/api/motivos/agregar", {
        motivo: nuevoMotivo.trim(),
      });

      Swal.fire({
        icon: "success",
        title: "¡Éxito!",
        text: "Motivo agregado correctamente",
        timer: 1500,
        showConfirmButton: false,
      });

      setNuevoMotivo("");
      cargarMotivos();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.error || "No se pudo agregar el motivo",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Header con botón volver */}
      <button onClick={onBack} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-semibold">
        <ArrowLeft className="w-5 h-5" />
        Volver al Menú
      </button>

      <div className="bg-white rounded-2xl shadow-lg p-8">
        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-purple-100 p-3 rounded-xl">
            <Tag className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Gestión de Motivos</h2>
            <p className="text-gray-600 text-sm">Administra los motivos de baja de clientes</p>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-purple-50 rounded-xl p-4 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{motivos.length}</div>
            <div className="text-sm text-gray-600">Motivos Activos</div>
          </div>
        </div>

        {/* Form agregar */}
        <form onSubmit={agregarMotivo} className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Agregar Nuevo Motivo</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={nuevoMotivo}
              onChange={(e) => setNuevoMotivo(e.target.value)}
              placeholder="Ejemplo: Cliente sin actividad comercial"
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg
                       focus:border-purple-500 focus:outline-none transition-colors"
              disabled={isLoading}
              maxLength={255}
            />
            <button
              type="submit"
              disabled={isLoading}
              className={`px-6 py-3 rounded-lg font-semibold text-white flex items-center gap-2
                ${isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700 active:scale-95"} transition-all`}
            >
              <Plus className="w-5 h-5" />
              {isLoading ? "Agregando..." : "Agregar"}
            </button>
          </div>
        </form>

        {/* Lista de motivos */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Motivos Actuales</h3>
          {motivos.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Tag className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>No hay motivos registrados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {motivos.map((motivo, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 w-8 h-8 rounded-full flex items-center justify-center text-purple-600 font-semibold text-sm">{index + 1}</div>
                    <span className="text-gray-800 font-medium">{motivo}</span>
                  </div>
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">Activo</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GestionMotivos;
