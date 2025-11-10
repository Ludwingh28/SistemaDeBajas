import { useState, useEffect } from "react";
import { Camera, Send, X } from "lucide-react";
import { solicitudBajaAPI } from "../utils/api";
import { showLoadingAlert, showSuccessAlert, showErrorAlert, showValidationError, showGeneralError } from "../utils/alerts";

const FormularioBaja = () => {
  const [formData, setFormData] = useState({
    codigoCliente: "",
    motivo: "",
    fotos: [],
  });

  const [motivos, setMotivos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Cargar motivos al montar el componente
  useEffect(() => {
    cargarMotivos();
  }, []);

  const cargarMotivos = async () => {
    try {
      const data = await solicitudBajaAPI.getMotivos();
      setMotivos(data.motivos || []);
    } catch (error) {
      console.error("Error cargando motivos:", error);
      // Motivos por defecto en caso de error
      setMotivos(["Cierre definitivo", "No cumple requisitos", "Deuda pendiente", "Cambio de giro", "Solicitud del cliente", "Otro"]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    // Validar que sean imágenes
    const validFiles = files.filter((file) => file.type.startsWith("image/"));

    if (validFiles.length !== files.length) {
      showGeneralError("Solo se permiten archivos de imagen");
      return;
    }

    // Limitar a 5 fotos máximo
    if (formData.fotos.length + validFiles.length > 5) {
      showGeneralError("Máximo 5 fotos permitidas");
      return;
    }

    // Agregar fotos
    setFormData((prev) => ({
      ...prev,
      fotos: [...prev.fotos, ...validFiles],
    }));

    // Crear previews
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
    setFormData((prev) => ({
      ...prev,
      fotos: prev.fotos.filter((_, i) => i !== index),
    }));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const validarFormulario = () => {
    if (!formData.codigoCliente.trim()) {
      showValidationError("Debes ingresar el código del cliente");
      return false;
    }

    if (!formData.motivo) {
      showValidationError("Debes seleccionar un motivo");
      return false;
    }

    if (formData.fotos.length === 0) {
      showValidationError("Debes subir al menos una foto de la tienda");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    setIsLoading(true);
    const loadingSwal = showLoadingAlert();

    try {
      // Crear FormData para enviar archivos
      const formDataToSend = new FormData();
      formDataToSend.append("codigoCliente", formData.codigoCliente.trim());
      formDataToSend.append("motivo", formData.motivo);

      // Agregar cada foto
      formData.fotos.forEach((foto, index) => {
        formDataToSend.append("fotos", foto);
      });

      const response = await solicitudBajaAPI.enviar(formDataToSend);

      loadingSwal.close();

      if (response.puedeInhabilitar) {
        await showSuccessAlert(formData.codigoCliente, formData.motivo);
        // Limpiar formulario después de éxito
        resetForm();
      } else {
        await showErrorAlert(formData.codigoCliente, response.razon);
      }
    } catch (error) {
      loadingSwal.close();

      if (error.response?.data?.error) {
        showGeneralError(error.response.data.error);
      } else {
        showGeneralError("Error al procesar la solicitud. Verifica tu conexión e intenta de nuevo.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      codigoCliente: "",
      motivo: "",
      fotos: [],
    });
    setPreviews([]);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Solicitud de Baja de Cliente</h2>
        <p className="text-gray-600 text-sm">Completa todos los campos para procesar la solicitud</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Código Cliente */}
        <div>
          <label htmlFor="codigoCliente" className="block text-sm font-semibold text-gray-700 mb-2">
            Código de Cliente *
          </label>
          <input
            type="text"
            id="codigoCliente"
            name="codigoCliente"
            value={formData.codigoCliente}
            onChange={handleInputChange}
            placeholder="Ej: CLT-12345"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg 
                     focus:border-blue-500 focus:outline-none transition-colors
                     text-gray-800 placeholder-gray-400"
            disabled={isLoading}
          />
        </div>

        {/* Motivo */}
        <div>
          <label htmlFor="motivo" className="block text-sm font-semibold text-gray-700 mb-2">
            Motivo de Baja *
          </label>
          <select
            id="motivo"
            name="motivo"
            value={formData.motivo}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg 
                     focus:border-blue-500 focus:outline-none transition-colors
                     text-gray-800"
            disabled={isLoading}
          >
            <option value="">Selecciona un motivo</option>
            {motivos.map((motivo, index) => (
              <option key={index} value={motivo}>
                {motivo}
              </option>
            ))}
          </select>
        </div>

        {/* Fotos */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Fotos de la Tienda * (Máximo 5)</label>

          {/* Input oculto */}
          <input type="file" id="fotos" accept="image/*" multiple onChange={handleFileChange} className="hidden" disabled={isLoading || formData.fotos.length >= 5} />

          {/* Botón de carga */}
          <label
            htmlFor="fotos"
            className={`
              flex items-center justify-center w-full px-6 py-4 
              border-2 border-dashed rounded-lg cursor-pointer
              transition-all duration-200
              ${formData.fotos.length >= 5 ? "border-gray-300 bg-gray-100 cursor-not-allowed" : "border-blue-400 bg-blue-50 hover:bg-blue-100 active:scale-95"}
            `}
          >
            <div className="flex flex-col items-center space-y-2">
              <Camera className={`w-8 h-8 ${formData.fotos.length >= 5 ? "text-gray-400" : "text-blue-600"}`} />
              <span className={`text-sm font-medium ${formData.fotos.length >= 5 ? "text-gray-400" : "text-blue-600"}`}>
                {formData.fotos.length >= 5 ? "Máximo alcanzado" : "Toca para subir fotos"}
              </span>
              <span className="text-xs text-gray-500">{formData.fotos.length} / 5 fotos</span>
            </div>
          </label>

          {/* Preview de fotos */}
          {previews.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              {previews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-32 object-cover rounded-lg border-2 border-gray-200" />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full
                             opacity-0 group-hover:opacity-100 transition-opacity
                             hover:bg-red-600 active:scale-90"
                    aria-label="Eliminar foto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botón Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className={`
            w-full py-4 rounded-lg font-semibold text-white
            flex items-center justify-center space-x-2
            transition-all duration-200
            ${isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-lg hover:shadow-xl"}
          `}
        >
          <Send className="w-5 h-5" />
          <span>{isLoading ? "Enviando..." : "Enviar Solicitud"}</span>
        </button>
      </form>

      {/* Nota informativa */}
      <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
        <p className="text-sm text-yellow-800">
          <strong>Nota:</strong> Asegúrate de que las fotos sean claras y muestren el estado actual de la tienda. Los campos marcados con * son obligatorios.
        </p>
      </div>
    </div>
  );
};

export default FormularioBaja;
