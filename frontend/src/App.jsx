import Navbar from "./components/Navbar";
import FormularioBaja from "./components/FormularioBaja";

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8 md:py-12">
        <FormularioBaja />
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 text-center text-gray-600 text-sm">
        <p>Sistema de Gestión de Bajas © {new Date().getFullYear()}</p>
        <p className="text-xs mt-1 text-gray-500">Versión 1.0 - Solo para uso interno</p>
      </footer>
    </div>
  );
}

export default App;
