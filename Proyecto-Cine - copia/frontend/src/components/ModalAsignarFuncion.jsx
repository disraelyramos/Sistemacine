import React, { useEffect, useMemo, useState } from 'react';

export default function ModalAsignarFuncion({
  open, onClose, modo, salas = [], peliculas = [], registro, onProgramar, onEliminar
}) {
  const [form, setForm] = useState({ salaId: '', peliculaId: '', hora: '', precio: '', observacion: '' });

  useEffect(() => {
    if (modo === 'ver' && registro) {
      setForm({
        salaId: registro.salaId,
        peliculaId: registro.peliculaId,
        hora: registro.hora,
        precio: registro.precio,
        observacion: registro.observacion || ''
      });
    } else {
      setForm({ salaId: '', peliculaId: '', hora: '', precio: '', observacion: '' });
    }
  }, [modo, registro]);

  const titulo = useMemo(
    () => (modo === 'crear' ? 'Asignar nueva función' : 'Detalle de función'),
    [modo]
  );
  const disabled = modo === 'ver';

  const submit = (e) => {
    e.preventDefault();
    if (!form.salaId || !form.peliculaId || !form.hora || !form.precio) return;
    onProgramar({
      salaId: Number(form.salaId),
      peliculaId: Number(form.peliculaId),
      hora: form.hora,
      precio: Number(form.precio),
      observacion: form.observacion?.trim()
    });
  };

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-card__header">
          <h5 className="m-0">{titulo}</h5>
          <button className="btn-close" onClick={onClose} />
        </div>

        <form onSubmit={submit}>
          <div className="modal-card__body">
            {/* Grid 2 columnas × 2 filas */}
            <div className="modal-grid">
              <div>
                <label className="form-label">Película</label>
                <select
                  className="form-select"
                  value={form.peliculaId}
                  onChange={(e) => setForm({ ...form, peliculaId: e.target.value })}
                  disabled={disabled}
                >
                  <option value="">Seleccione...</option>
                  {peliculas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.titulo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Sala</label>
                <select
                  className="form-select"
                  value={form.salaId}
                  onChange={(e) => setForm({ ...form, salaId: e.target.value })}
                  disabled={disabled}
                >
                  <option value="">Seleccione...</option>
                  {salas.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Hora</label>
                <input
                  type="time"
                  className="form-control"
                  value={form.hora}
                  onChange={(e) => setForm({ ...form, hora: e.target.value })}
                  disabled={disabled}
                  step="900"
                />
              </div>

              <div>
                <label className="form-label">Precio</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  placeholder="0.00"
                  value={form.precio}
                  onChange={(e) => setForm({ ...form, precio: e.target.value })}
                  disabled={disabled}
                />
              </div>
            </div>

            {/* Observación ocupa toda la fila */}
            <div style={{ marginTop: '16px' }}>
              <label className="form-label">Observación</label>
              <textarea
                className="form-control"
                rows="3"
                value={form.observacion}
                onChange={(e) => setForm({ ...form, observacion: e.target.value })}
                disabled={disabled}
              />
            </div>
          </div>

          {/* Botones juntos */}
          <div className="modal-card__footer" style={{ justifyContent: 'flex-end', gap: '8px' }}>
            {modo === 'crear' ? (
              <>
                <button type="submit" className="btn btn-success">
                  Programar función
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => onEliminar(registro.id)}
                >
                  Eliminar función
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                  Cerrar
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
