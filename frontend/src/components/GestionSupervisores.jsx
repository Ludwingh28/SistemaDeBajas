import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Shield, Key, ToggleLeft, ToggleRight, Eye, EyeOff } from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";

const GestionSupervisores = ({ onBack }) => {
  const [supervisores, setSupervisores] = useState([]);
  const [nuevoSupervisor, setNuevoSupervisor] = useState({ nombre: "", codigo: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  useEffect(() => {
    cargarSupervisores();
  }, []);

  const cargarSupervisores = async () => {
    try {
      const response = await axios.get("/api/supervisores");
      setSupervisores(response.data.supervisores || []);
    } catch (error) {
      console.error("Error cargando supervisores:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los supervisores",
      });
    }
  };

  const crearSupervisor = async (e) => {
    e.preventDefault();

    if (!nuevoSupervisor.nombre.trim() || !nuevoSupervisor.codigo.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "Por favor ingresa nombre y código",
      });
      return;
    }

    if (nuevoSupervisor.codigo.trim().length < 6) {
      Swal.fire({
        icon: "warning",
        title: "Código muy corto",
        text: "El código debe tener al menos 6 caracteres",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post("/api/supervisores", {
        nombre: nuevoSupervisor.nombre.trim(),
        codigo: nuevoSupervisor.codigo.trim(),
        creadoPor: "ADMIN"
      });

      Swal.fire({
        icon: "success",
        title: "¡Éxito!",
        text: "Supervisor creado correctamente",
        timer: 1500,
        showConfirmButton: false,
      });

      setNuevoSupervisor({ nombre: "", codigo: "" });
      cargarSupervisores();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "No se pudo crear el supervisor",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cambiarHash = async (id, nombreSupervisor) => {
    const { value: formValues } = await Swal.fire({
      title: `Cambiar Código de ${nombreSupervisor}`,
      html: `
        <input id="nuevo-codigo" type="password" class="swal2-input" placeholder="Nuevo código (mín. 6 caracteres)">
        <input id="confirmar-codigo" type="password" class="swal2-input" placeholder="Confirmar código">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Cambiar",
      cancelButtonText: "Cancelar",
      preConfirm: () => {
        const nuevoCodigo = document.getElementById('nuevo-codigo').value;
        const confirmarCodigo = document.getElementById('confirmar-codigo').value;

        if (!nuevoCodigo || !confirmarCodigo) {
          Swal.showValidationMessage('Ambos campos son requeridos');
          return false;
        }

        if (nuevoCodigo.length < 6) {
          Swal.showValidationMessage('El código debe tener al menos 6 caracteres');
          return false;
        }

        if (nuevoCodigo !== confirmarCodigo) {
          Swal.showValidationMessage('Los códigos no coinciden');
          return false;
        }

        return { nuevoCodigo };
      }
    });

    if (formValues) {
      try {
        await axios.put(`/api/supervisores/${id}/cambiar-hash`, {
          nuevoCodigo: formValues.nuevoCodigo,
          actualizadoPor: "ADMIN"
        });

        Swal.fire({
          icon: "success",
          title: "¡Actualizado!",
          text: "Código actualizado correctamente",
          timer: 1500,
          showConfirmButton: false,
        });

        cargarSupervisores();
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.response?.data?.message || "No se pudo actualizar el código",
        });
      }
    }
  };

  const toggleActivoSupervisor = async (id, supervisorNombre, estaActivo) => {
    const accion = estaActivo ? "inhabilitar" : "activar";
    const result = await Swal.fire({
      title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} supervisor?`,
      text: `¿Estás seguro de que deseas ${accion} a "${supervisorNombre}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await axios.patch(`/api/supervisores/${id}/estado`, {
          activo: !estaActivo
        });

        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: `Supervisor ${accion}do correctamente`,
          timer: 1500,
          showConfirmButton: false,
        });

        cargarSupervisores();
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.response?.data?.message || `No se pudo ${accion} el supervisor`,
        });
      }
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "Nunca";
    return new Date(fecha).toLocaleString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
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
          <div className="bg-indigo-100 p-3 rounded-xl">
            <Shield className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">Gestión de Supervisores</h2>
            <p className="text-gray-600 text-xs md:text-sm">Administra los accesos de supervisores al sistema</p>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-indigo-50 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{supervisores.filter(s => s.activo).length}</div>
              <div className="text-sm text-gray-600">Activos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{supervisores.filter(s => !s.activo).length}</div>
              <div className="text-sm text-gray-600">Inactivos</div>
            </div>
          </div>
        </div>

        {/* Form crear supervisor */}
        <form onSubmit={crearSupervisor} className="mb-8 bg-gray-50 p-6 rounded-xl">
          <label className="block text-sm font-semibold text-gray-700 mb-4">Crear Nuevo Supervisor</label>

          <div className="space-y-3">
            <input
              type="text"
              value={nuevoSupervisor.nombre}
              onChange={(e) => setNuevoSupervisor({...nuevoSupervisor, nombre: e.target.value})}
              placeholder="Nombre del supervisor"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg
                       focus:border-indigo-500 focus:outline-none transition-colors text-sm md:text-base"
              disabled={isLoading}
              maxLength={100}
            />

            <div className="relative">
              <input
                type={mostrarPassword ? "text" : "password"}
                value={nuevoSupervisor.codigo}
                onChange={(e) => setNuevoSupervisor({...nuevoSupervisor, codigo: e.target.value})}
                placeholder="Código secreto (mín. 6 caracteres)"
                className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg
                         focus:border-indigo-500 focus:outline-none transition-colors text-sm md:text-base"
                disabled={isLoading}
                maxLength={100}
              />
              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {mostrarPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full px-6 py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2
                ${isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 active:scale-95"} transition-all`}
            >
              <Plus className="w-5 h-5" />
              <span>{isLoading ? "Creando..." : "Crear Supervisor"}</span>
            </button>
          </div>
        </form>

        {/* Lista de supervisores */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Supervisores Registrados</h3>
          {supervisores.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Shield className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>No hay supervisores registrados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {supervisores.map((supervisor) => (
                <div
                  key={supervisor.id}
                  className="flex flex-col p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-3 border-l-4 border-indigo-500"
                >
                  {/* Header con nombre y estado */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="bg-indigo-100 w-10 h-10 rounded-full flex items-center justify-center">
                        <Shield className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`font-semibold text-lg block ${supervisor.activo ? 'text-gray-800' : 'text-gray-500 line-through'}`}>
                          {supervisor.nombre}
                        </span>
                        <span className="text-xs text-gray-500">
                          Último acceso: {formatearFecha(supervisor.ultimo_acceso)}
                        </span>
                      </div>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      supervisor.activo
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {supervisor.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  {/* Metadata */}
                  <div className="text-xs text-gray-500 pl-13">
                    Creado: {formatearFecha(supervisor.fecha_creacion)}
                    {supervisor.creado_por && ` • Por: ${supervisor.creado_por}`}
                  </div>

                  {/* Botones de acción */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Botón Cambiar Hash */}
                    <button
                      onClick={() => cambiarHash(supervisor.id, supervisor.nombre)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center gap-2 font-medium"
                      title="Cambiar código"
                    >
                      <Key className="w-4 h-4" />
                      <span className="text-sm">Cambiar Código</span>
                    </button>

                    {/* Botón Toggle Activo/Inactivo */}
                    <button
                      onClick={() => toggleActivoSupervisor(supervisor.id, supervisor.nombre, supervisor.activo)}
                      className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-medium ${
                        supervisor.activo
                          ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                          : 'bg-green-100 text-green-600 hover:bg-green-200'
                      }`}
                      title={supervisor.activo ? 'Inhabilitar supervisor' : 'Activar supervisor'}
                    >
                      {supervisor.activo ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      <span className="text-sm">{supervisor.activo ? 'Inhabilitar' : 'Activar'}</span>
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

export default GestionSupervisores;
