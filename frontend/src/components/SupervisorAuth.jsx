import { useState, useEffect } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";

const SupervisorAuth = ({ onSuccess }) => {
  const [codigo, setCodigo] = useState("");
  const [mostrarCodigo, setMostrarCodigo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [intentosFallidos, setIntentosFallidos] = useState(0);
  const [cooldownRestante, setCooldownRestante] = useState(0);

  // Cooldown de 30 segundos después de 3 intentos fallidos
  const MAX_INTENTOS = 3;
  const COOLDOWN_SEGUNDOS = 30;

  useEffect(() => {
    if (cooldownRestante > 0) {
      const timer = setTimeout(() => {
        setCooldownRestante(cooldownRestante - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (cooldownRestante === 0 && intentosFallidos >= MAX_INTENTOS) {
      setIntentosFallidos(0); // Reset después del cooldown
    }
  }, [cooldownRestante, intentosFallidos]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cooldownRestante > 0) {
      Swal.fire({
        icon: "warning",
        title: "Espera",
        text: `Demasiados intentos. Intenta de nuevo en ${cooldownRestante}s`,
      });
      return;
    }

    if (!codigo.trim()) {
      Swal.fire({
        icon: "error",
        title: "Campo incompleto",
        text: "Por favor ingresa tu código de supervisor",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Verificar credenciales con el endpoint de verificación
      const response = await axios.post("http://localhost:3001/api/supervisores/verificar", {
        codigo: codigo.trim(),
      });

      if (response.data.success) {
        // Si llega aquí, el código es válido
        Swal.fire({
          icon: "success",
          title: "¡Acceso Concedido!",
          text: `Bienvenido, ${response.data.supervisor.nombre}`,
          timer: 1500,
          showConfirmButton: false,
        });

        // Guardar en sessionStorage
        sessionStorage.setItem("supervisorAuth", "true");
        sessionStorage.setItem("supervisorNombre", response.data.supervisor.nombre);
        sessionStorage.setItem("supervisorCode", codigo);

        // Reset intentos fallidos
        setIntentosFallidos(0);

        onSuccess();
      }
    } catch (error) {
      // Incrementar intentos fallidos
      const nuevosIntentos = intentosFallidos + 1;
      setIntentosFallidos(nuevosIntentos);

      if (nuevosIntentos >= MAX_INTENTOS) {
        setCooldownRestante(COOLDOWN_SEGUNDOS);
        Swal.fire({
          icon: "error",
          title: "Demasiados Intentos",
          text: `Has fallado ${MAX_INTENTOS} veces. Espera ${COOLDOWN_SEGUNDOS} segundos antes de intentar nuevamente.`,
        });
      } else {
        const intentosRestantes = MAX_INTENTOS - nuevosIntentos;
        Swal.fire({
          icon: "error",
          title: "Acceso Denegado",
          html: `
            <p>${error.response?.data?.message || "Credenciales incorrectas"}</p>
            <p class="text-sm text-gray-600 mt-2">Intentos restantes: ${intentosRestantes}</p>
          `,
        });
      }
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
          {/* Campo Código */}
          <div>
            <label htmlFor="codigo" className="block text-sm font-semibold text-gray-700 mb-2">
              Código de Supervisor
            </label>
            <div className="relative">
              <input
                type={mostrarCodigo ? "text" : "password"}
                id="codigo"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ingresa tu código"
                className="w-full px-4 py-3 pr-11 border-2 border-gray-300 rounded-lg
                         focus:border-blue-500 focus:outline-none transition-colors"
                disabled={isLoading || cooldownRestante > 0}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setMostrarCodigo(!mostrarCodigo)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                disabled={isLoading || cooldownRestante > 0}
              >
                {mostrarCodigo ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mostrar cooldown si está activo */}
          {cooldownRestante > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-center font-semibold">
                Espera {cooldownRestante}s antes de intentar nuevamente
              </p>
            </div>
          )}

          {/* Botón de acceso */}
          <button
            type="submit"
            disabled={isLoading || cooldownRestante > 0}
            className={`w-full py-3 rounded-lg font-semibold text-white transition-all
              ${isLoading || cooldownRestante > 0 ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-95"}`}
          >
            {isLoading ? "Verificando..." : cooldownRestante > 0 ? `Bloqueado (${cooldownRestante}s)` : "Acceder"}
          </button>
        </form>

        <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
          <p className="text-sm text-yellow-800">
            <strong>Nota:</strong> Solo personal autorizado puede acceder a esta sección. Después de 3 intentos fallidos, se bloqueará el acceso por 30 segundos.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SupervisorAuth;
