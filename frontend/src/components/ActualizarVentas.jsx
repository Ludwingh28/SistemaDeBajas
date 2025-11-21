import { useState, useEffect } from "react";
import { ArrowLeft, Upload, Database, AlertTriangle } from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";

const ActualizarVentas = ({ onBack }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [reemplazar, setReemplazar] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({ total: 0, min_fecha: null, max_fecha: null, dias: 0 });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      const response = await axios.get("http://localhost:3001/api/ventas/estadisticas");
      setStats(response.data);
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    }
  };

  const handleFileSelect = (file) => {
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls"].includes(ext)) {
      Swal.fire({
        icon: "error",
        title: "Archivo inválido",
        text: "Por favor selecciona un archivo Excel (.xlsx o .xls)",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const procesarArchivo = async () => {
    if (!selectedFile) {
      Swal.fire({
        icon: "warning",
        title: "Sin archivo",
        text: "Por favor selecciona un archivo Excel",
      });
      return;
    }

    if (reemplazar) {
      const result = await Swal.fire({
        icon: "warning",
        title: "¿Estás seguro?",
        text: "Esta acción REEMPLAZARÁ todos los datos existentes. No se puede deshacer.",
        showCancelButton: true,
        confirmButtonText: "Sí, reemplazar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#dc2626",
      });

      if (!result.isConfirmed) return;
    }

    setIsProcessing(true);
    setProgress(10);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("reemplazar", reemplazar);

      setProgress(30);

      const response = await axios.post("http://localhost:3001/api/actualizarBD", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(30 + (percent * 0.4));
        },
      });

      setProgress(90);

      if (response.data.success) {
        setProgress(100);

        await Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          html: `
            <p>${response.data.message}</p>
            <p class="mt-2"><strong>Registros procesados:</strong> ${response.data.registros.toLocaleString()}</p>
          `,
        });

        setSelectedFile(null);
        setReemplazar(false);
        cargarEstadisticas();
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || error.message || "Error al procesar el archivo",
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const cancelar = () => {
    setSelectedFile(null);
    setReemplazar(false);
    setProgress(0);
  };

  return (
    <div>
      {/* Header */}
      <button onClick={onBack} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-semibold">
        <ArrowLeft className="w-5 h-5" />
        Volver al Menú
      </button>

      <div className="bg-white rounded-2xl shadow-lg p-8">
        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-green-100 p-3 rounded-xl">
            <Database className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Actualizar Ventas</h2>
            <p className="text-gray-600 text-sm">Importa nuevos datos de ventas desde Excel</p>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.total.toLocaleString()}</div>
            <div className="text-xs text-gray-600">Total Ventas</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <div className="text-lg font-bold text-blue-600">{stats.min_fecha || "-"}</div>
            <div className="text-xs text-gray-600">Fecha Mínima</div>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <div className="text-lg font-bold text-purple-600">{stats.max_fecha || "-"}</div>
            <div className="text-xs text-gray-600">Fecha Máxima</div>
          </div>
          <div className="bg-orange-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.dias}</div>
            <div className="text-xs text-gray-600">Días con Ventas</div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
          <p className="text-sm text-blue-900">
            <strong>Archivo requerido:</strong> Excel con hoja "VentasPOD" que contenga las columnas: <strong>Fecha</strong>, <strong>Cliente</strong> (código), <strong>Nombre Cliente</strong>.
          </p>
        </div>

        {/* Upload Area */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => document.getElementById("fileInput").click()}
          className={`border-3 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all mb-6
            ${isDragging ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-green-400 hover:bg-gray-50"}`}
        >
          <Upload className="w-16 h-16 mx-auto mb-4 text-green-600" />
          <p className="text-lg font-semibold text-gray-700 mb-2">Click para seleccionar o arrastra el archivo aquí</p>
          <p className="text-sm text-gray-500">Archivos soportados: .xlsx, .xls</p>
        </div>

        <input type="file" id="fileInput" accept=".xlsx,.xls" onChange={(e) => handleFileSelect(e.target.files[0])} className="hidden" />

        {/* File Info */}
        {selectedFile && (
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <div className="font-semibold text-gray-800 mb-2">📄 {selectedFile.name}</div>
            <div className="text-sm text-gray-600 mb-4">Tamaño: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</div>

            {/* Checkbox reemplazar */}
            <label className="flex items-center gap-3 p-4 bg-white rounded-lg cursor-pointer hover:bg-gray-50 transition-colors mb-4">
              <input type="checkbox" checked={reemplazar} onChange={(e) => setReemplazar(e.target.checked)} className="w-5 h-5 cursor-pointer" />
              <span className="font-medium text-gray-700">Reemplazar todos los datos existentes</span>
            </label>

            {/* Warning */}
            {reemplazar && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mb-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <strong>Advertencia:</strong> Esta acción eliminará todas las ventas actuales y las reemplazará con los nuevos datos. Esta operación no se puede deshacer.
                  </div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={procesarArchivo}
                disabled={isProcessing}
                className={`flex-1 py-3 rounded-lg font-semibold text-white transition-all
                  ${isProcessing ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 active:scale-95"}`}
              >
                {isProcessing ? "Procesando..." : "Procesar Archivo"}
              </button>
              <button onClick={cancelar} disabled={isProcessing} className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold transition-colors">
                Cancelar
              </button>
            </div>

            {/* Progress Bar */}
            {isProcessing && (
              <div className="mt-4">
                <div className="w-full h-8 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center text-white text-sm font-semibold transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  >
                    {progress}%
                  </div>
                </div>
                <p className="text-center text-sm text-gray-600 mt-2">Procesando archivo...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActualizarVentas;
