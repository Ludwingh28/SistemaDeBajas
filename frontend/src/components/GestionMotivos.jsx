import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Tag, Edit2, ToggleLeft, ToggleRight } from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";

const GestionMotivos = ({ onBack }) => {
  const [motivos, setMotivos] = useState([]);
  const [nuevoMotivo, setNuevoMotivo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [motivoEditando, setMotivoEditando] = useState(null);

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

  const editarMotivo = async (id, motivoActual) => {
    const { value: nuevoNombre } = await Swal.fire({
      title: "Editar Motivo",
      input: "text",
      inputLabel: "Nuevo nombre del motivo",
      inputValue: motivoActual,
      showCancelButton: true,
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
      inputValidator: (value) => {
        if (!value) {
          return "El motivo no puede estar vacío";
        }
      },
    });

    if (nuevoNombre && nuevoNombre !== motivoActual) {
      try {
        await axios.put(`http://localhost:3001/api/motivos/${id}`, {
          nombre: nuevoNombre.trim(),
        });

        Swal.fire({
          icon: "success",
          title: "¡Actualizado!",
          text: "Motivo actualizado correctamente",
          timer: 1500,
          showConfirmButton: false,
        });

        cargarMotivos();
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.response?.data?.error || "No se pudo actualizar el motivo",
        });
      }
    }
  };

  const toggleActivoMotivo = async (id, motivoNombre, estaActivo) => {
    const accion = estaActivo ? "inhabilitar" : "activar";
    const result = await Swal.fire({
      title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} motivo?`,
      text: `¿Estás seguro de que deseas ${accion} "${motivoNombre}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        const endpoint = estaActivo ? "desactivar" : "activar";
        await axios.patch(`http://localhost:3001/api/motivos/${id}/${endpoint}`);

        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: `Motivo ${accion}do correctamente`,
          timer: 1500,
          showConfirmButton: false,
        });

        cargarMotivos();
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.response?.data?.error || `No se pudo ${accion} el motivo`,
        });
      }
    }
  };

  return (
    <div>
      {/* Header con botón volver */}
      <button onClick={onBack} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-semibold">
        <ArrowLeft className="w-5 h-5" />
        Volver al Menú
      </button>

      <div className="bg-white rounded-2xl shadow-lg p-4 md:p-8">
        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-purple-100 p-3 rounded-xl">
            <Tag className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">Gestión de Motivos</h2>
            <p className="text-gray-600 text-xs md:text-sm">Administra los motivos de baja de clientes</p>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-purple-50 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{motivos.filter(m => m.activo).length}</div>
              <div className="text-sm text-gray-600">Activos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{motivos.filter(m => !m.activo).length}</div>
              <div className="text-sm text-gray-600">Inactivos</div>
            </div>
          </div>
        </div>

        {/* Form agregar */}
        <form onSubmit={agregarMotivo} className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Agregar Nuevo Motivo</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={nuevoMotivo}
              onChange={(e) => setNuevoMotivo(e.target.value)}
              placeholder="Ejemplo: Cliente sin actividad comercial"
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg
                       focus:border-purple-500 focus:outline-none transition-colors text-sm md:text-base"
              disabled={isLoading}
              maxLength={255}
            />
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full sm:w-auto px-4 md:px-6 py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2
                ${isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700 active:scale-95"} transition-all`}
            >
              <Plus className="w-5 h-5" />
              <span className="whitespace-nowrap">{isLoading ? "Agregando..." : "Agregar"}</span>
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
                <div
                  key={motivo.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-3"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="bg-purple-100 w-8 h-8 rounded-full flex items-center justify-center text-purple-600 font-semibold text-sm flex-shrink-0">
                      {index + 1}
                    </div>
                    <span className={`font-medium break-words ${motivo.activo ? 'text-gray-800' : 'text-gray-500 line-through'}`}>
                      {motivo.nombre}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      motivo.activo
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {motivo.activo ? 'Activo' : 'Inactivo'}
                    </span>

                    {/* Botón Editar */}
                    <button
                      onClick={() => editarMotivo(motivo.id, motivo.nombre)}
                      className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                      title="Editar motivo"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Botón Toggle Activo/Inactivo */}
                    <button
                      onClick={() => toggleActivoMotivo(motivo.id, motivo.nombre, motivo.activo)}
                      className={`p-2 rounded-lg transition-colors ${
                        motivo.activo
                          ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                          : 'bg-green-100 text-green-600 hover:bg-green-200'
                      }`}
                      title={motivo.activo ? 'Inhabilitar motivo' : 'Activar motivo'}
                    >
                      {motivo.activo ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    </button>
                  </div>
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
