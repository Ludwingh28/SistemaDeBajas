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

    // Si es el campo código, solo permitir números
    if (name === "codigoCliente") {
      const soloNumeros = value.replace(/[^0-9]/g, "");
      setFormData((prev) => ({
        ...prev,
        [name]: soloNumeros,
      }));
      return;
    }

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
      const formDataToSend = new FormData();
      formDataToSend.append("codigoCliente", formData.codigoCliente.trim());
      formDataToSend.append("motivo", formData.motivo);

      formData.fotos.forEach((foto) => {
        formDataToSend.append("fotos", foto);
      });

      const response = await solicitudBajaAPI.enviar(formDataToSend);

      loadingSwal.close();

      // MANEJO DE 3 ESTADOS DIFERENTES

      // ESTADO 1: Cliente SÍ puede ser inhabilitado
      if (response.puedeInhabilitar === true) {
        await showSuccessAlert(response.codigo, response.nombreCliente, response.motivo, response.razon);
        resetForm();
      }
      // ESTADO 2: Derivado a revisión manual
      else if (response.requiereRevisionManual === true) {
        await showManualReviewAlert(response.codigo, response.nombreCliente, response.motivo, response.razon, response.instrucciones);
        resetForm();
      }
      // ESTADO 3: Cliente NO puede ser inhabilitado
      else {
        await showErrorAlert(response.codigo, response.nombreCliente, response.motivo, response.razon);
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
    // Limpiar también el input de archivos
    const fileInput = document.getElementById("fotos");
    if (fileInput) {
      fileInput.value = "";
    }
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
            type="tel"
            id="codigoCliente"
            name="codigoCliente"
            value={formData.codigoCliente}
            onChange={handleInputChange}
            placeholder="Ej: 420568"
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
            {motivos
              .filter((motivo) => motivo.activo)
              .map((motivo) => (
                <option key={motivo.id} value={motivo.nombre}>
                  {motivo.nombre}
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
                             opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity
                             hover:bg-red-600 active:scale-90 shadow-lg"
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
