import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import ProtectedRoute from './components/portal/ProtectedRoute.jsx';
import PortalLayout from './components/portal/PortalLayout.jsx';
import Dashboard from './pages/portal/Dashboard.jsx';
import Citas from './pages/portal/Citas.jsx';
import Pacientes from './pages/portal/Pacientes.jsx';
import Doctores from './pages/portal/Doctores.jsx';
import Especialidades from './pages/portal/Especialidades.jsx';
import Departamentos from './pages/portal/Departamentos.jsx';
import Usuarios from './pages/portal/Usuarios.jsx';
import Pagos from './pages/portal/Pagos.jsx';
import Perfil from './pages/portal/Perfil.jsx';
import MisCitas from './pages/portal/paciente/MisCitas.jsx';
import MiHistorial from './pages/portal/paciente/MiHistorial.jsx';
import MisResultados from './pages/portal/paciente/MisResultados.jsx';
import MisPagos from './pages/portal/paciente/MisPagos.jsx';
import MiAgenda from './pages/portal/doctor/MiAgenda.jsx';
import SubirResultado from './pages/portal/doctor/SubirResultado.jsx';

/**
 * Componente raíz: define el árbol de rutas (landing pública, login y portal
 * protegido por rol) envuelto en los providers de la app.
 * @returns {JSX.Element}
 */
export default function App() {
  return (
    <Routes>
      {/* Público */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />

      {/* Portal protegido */}
      <Route
        path="/portal"
        element={
          <ProtectedRoute>
            <PortalLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="perfil" element={<Perfil />} />
        <Route path="citas" element={<Citas />} />
        <Route path="pacientes" element={<Pacientes />} />
        <Route path="pagos" element={<Pagos />} />
        <Route path="doctores" element={<Doctores />} />
        <Route path="especialidades" element={<Especialidades />} />
        <Route path="departamentos" element={<Departamentos />} />
        <Route path="usuarios" element={<Usuarios />} />

        {/* Doctor */}
        <Route path="mi-agenda" element={<MiAgenda />} />
        <Route path="subir-resultado" element={<SubirResultado />} />

        {/* Paciente */}
        <Route path="mis-citas" element={<MisCitas />} />
        <Route path="mi-historial" element={<MiHistorial />} />
        <Route path="mis-resultados" element={<MisResultados />} />
        <Route path="mis-pagos" element={<MisPagos />} />
      </Route>
    </Routes>
  );
}
