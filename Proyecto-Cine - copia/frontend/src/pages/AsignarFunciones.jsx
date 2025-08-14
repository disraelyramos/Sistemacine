import React, { useMemo, useState } from 'react';
import FabAdd from '../components/FabAdd';
import ModalAsignarFuncion from '../components/ModalAsignarFuncion';
import HoraChip from '../components/HoraChip';
import '../styles/funciones.css';

// Mocks de datos — luego se conectarán al backend
const salasMock = [
  { id: 1, nombre: 'Sala 4', capacidad: 200 },
  { id: 2, nombre: 'Sala VIP', capacidad: 50 },
  { id: 3, nombre: 'Sala IMAX', capacidad: 300 },
];
const peliculasMock = [
  { id: 101, titulo: 'Dune: Parte II' },
  { id: 102, titulo: 'Inside Out 2' },
  { id: 103, titulo: 'Deadpool & Wolverine' },
];

// Convierte HH:MM a minutos para orden
const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export default function ProgramarFunciones() {
  const [funciones, setFunciones] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modo, setModo] = useState('crear'); // crear o ver
  const [registroActivo, setRegistroActivo] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState('');

  const funcionesPorSala = useMemo(() => {
    const map = new Map();
    salasMock.forEach(s => map.set(s.id, []));
    funciones
      .filter(f => !fechaSeleccionada || f.fecha === fechaSeleccionada)
      .forEach(f => {
        if (!map.has(f.salaId)) map.set(f.salaId, []);
        map.get(f.salaId).push(f);
      });
    for (const arr of map.values()) {
      arr.sort((a, b) => toMinutes(a.hora) - toMinutes(b.hora));
    }
    return map;
  }, [funciones, fechaSeleccionada]);

  const abrirCrear = () => { setModo('crear'); setRegistroActivo(null); setModalOpen(true); };
  const abrirVer = (f) => { setModo('ver'); setRegistroActivo(f); setModalOpen(true); };

  const onProgramar = (payload) => {
    const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    setFunciones(prev => [...prev, { id, ...payload }]);
    setModalOpen(false);
  };

  const onEliminar = (id) => {
    setFunciones(prev => prev.filter(f => f.id !== id));
    setModalOpen(false);
  };

  return (
    <div className="container-fluid py-4">
      
      {/* Filtro por fecha */}
      <div className="mb-4 d-flex align-items-center gap-3">
        <label className="fw-bold">Seleccionar fecha:</label>
        <select
          className="form-select w-auto"
          value={fechaSeleccionada}
          onChange={(e) => setFechaSeleccionada(e.target.value)}
        >
          <option value="">Todas</option>
          <option value="2025-08-08">08/08/2025</option>
          <option value="2025-08-09">09/08/2025</option>
          <option value="2025-08-10">10/08/2025</option>
        </select>
      </div>

      <div className="row g-4">
        {salasMock.map((sala) => (
          <div key={sala.id} className="col-12 col-md-6 col-lg-4">
            <div className="panel-sala">
              <div className="panel-sala__header">
                <div className="panel-sala__title">
                  <i className="fas fa-door-open me-2"></i>{sala.nombre}
                </div>
                <span className="badge bg-light text-dark d-flex align-items-center gap-2">
                  <i className="fas fa-chair"></i>{sala.capacidad} asientos
                </span>
              </div>

              <div className="panel-sala__body">
                {funcionesPorSala.get(sala.id)?.length ? (
                  funcionesPorSala.get(sala.id).map((f) => (
                    <HoraChip key={f.id} hora={f.hora} label="Disponible" onClick={() => abrirVer(f)} />
                  ))
                ) : (
                  <div className="text-center text-muted small py-4">No hay funciones programadas</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <FabAdd onClick={abrirCrear} />

      {modalOpen && (
        <ModalAsignarFuncion
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          modo={modo}
          salas={salasMock}
          peliculas={peliculasMock}
          registro={registroActivo}
          onProgramar={onProgramar}
          onEliminar={onEliminar}
        />
      )}
    </div>
  );
}
