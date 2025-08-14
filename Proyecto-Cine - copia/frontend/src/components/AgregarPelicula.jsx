import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:3001';

const AgregarPelicula = ({ show, onClose, onGuardado }) => {
  // Form
  const [titulo, setTitulo] = useState('');
  const [duracion, setDuracion] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [idiomaId, setIdiomaId] = useState('');
  const [clasificacionId, setClasificacionId] = useState('');
  const [formatoId, setFormatoId] = useState('');
  const [precio, setPrecio] = useState('');
  const [salaId, setSalaId] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [imagenFile, setImagenFile] = useState(null);
  const [imagenPreview, setImagenPreview] = useState('');

  // Catálogos (desde BD)
  const [idiomas, setIdiomas] = useState([]);
  const [clasificaciones, setClasificaciones] = useState([]);
  const [formatos, setFormatos] = useState([]);
  const [salas, setSalas] = useState([]);
  const [categorias, setCategorias] = useState([]);

  // UI
  const [cargandoCat, setCargandoCat] = useState(false);
  const [enviando, setEnviando] = useState(false);

  // Previsualización
  useEffect(() => {
    if (!imagenFile) return setImagenPreview('');
    const url = URL.createObjectURL(imagenFile);
    setImagenPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imagenFile]);

  // Cargar todos los catálogos desde BD
  useEffect(() => {
    const cargarCatalogos = async () => {
      setCargandoCat(true);
      try {
        const { data } = await axios.get(`${API_BASE}/api/peliculas/select-data`);
        setIdiomas(Array.isArray(data?.idiomas) ? data.idiomas : []);
        setClasificaciones(Array.isArray(data?.clasificaciones) ? data.clasificaciones : []);
        setFormatos(Array.isArray(data?.formatos) ? data.formatos : []);
        setSalas(Array.isArray(data?.salas) ? data.salas : []);
        setCategorias(Array.isArray(data?.categorias) ? data.categorias : []);
      } catch (e) {
        console.error(e);
        toast.error('Error al cargar catálogos');
      } finally {
        setCargandoCat(false);
      }
    };

    if (show) cargarCatalogos();
  }, [show]);

  const fechaHoraISO = useMemo(() => {
    if (!fecha || !hora) return null;
    return `${fecha}T${hora}:00`;
  }, [fecha, hora]);

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return setImagenFile(null);
    const okTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!okTypes.includes(f.type)) return toast.warn('Usa JPG, PNG o WEBP');
    if (f.size > 2 * 1024 * 1024) return toast.warn('Imagen máx. 2MB');
    setImagenFile(f);
  };

  const resetForm = () => {
    setTitulo(''); setDuracion(''); setFecha(''); setHora('');
    setIdiomaId(''); setClasificacionId(''); setFormatoId('');
    setPrecio(''); setSalaId(''); setCategoriaId('');
    setImagenFile(null); setImagenPreview('');
  };

  const nombrePorId = (lista, id) =>
    (lista.find(x => String(x?.id) === String(id))?.nombre) || '—';

  const handleSubmit = async (e) => {
    e.preventDefault();

    const t = titulo.trim();
    if (!t) return toast.warn('Ingrese el título');
    if (t.length > 150) return toast.warn('El título no debe superar 150 caracteres');

    const d = Number(duracion);
    if (!d || d <= 0 || d > 600) return toast.warn('Duración inválida (1-600 min)');

    if (!fecha) return toast.warn('Seleccione una fecha');
    if (!hora) return toast.warn('Seleccione un horario');

    if (!idiomaId) return toast.warn('Seleccione el idioma');
    if (!clasificacionId) return toast.warn('Seleccione la clasificación');
    if (!formatoId) return toast.warn('Seleccione el formato');
    if (!categoriaId) return toast.warn('Seleccione la categoría');
    if (!salaId) return toast.warn('Seleccione la sala');

    const p = Number(precio);
    if (!p || p <= 0 || p > 1000) return toast.warn('Precio inválido');
    if (!imagenFile) return toast.warn('Adjunte una imagen');

    try {
      setEnviando(true);
      const fd = new FormData();
      fd.append('titulo', t);
      fd.append('duracionMin', String(d));
      fd.append('fechaHora', fechaHoraISO);

      // ⬇⬇ IDs desde BD (coinciden con el controlador)
      fd.append('id_idioma', String(idiomaId));
      fd.append('id_clasificacion', String(clasificacionId));
      fd.append('id_formato', String(formatoId));
      fd.append('id_categoria', String(categoriaId));
      fd.append('id_sala', String(salaId));

      fd.append('precio', String(p));
      fd.append('imagen', imagenFile);

      const resp = await axios.post(`${API_BASE}/api/peliculas`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Data para card
      const data = resp?.data || {};
      const nuevo = {
        id: data?.ID || data?.id || Date.now(),
        titulo: t,
        duracion: d,
        fecha,
        hora,
        idioma: nombrePorId(idiomas, idiomaId),
        clasificacion: nombrePorId(clasificaciones, clasificacionId),
        formato: nombrePorId(formatos, formatoId),
        precio: p,
        sala: nombrePorId(salas, salaId),
        categoria: nombrePorId(categorias, categoriaId),
        posterUrl: data?.posterUrl || data?.poster || null,
        posterLocal: imagenPreview
      };

      onGuardado?.(nuevo);
      resetForm();
    } catch (err) {
      console.error('Error al registrar película:', err);
      toast.error(
        err?.response?.data?.message ||
        (err?.request ? 'No se pudo conectar con el servidor' : err?.message) ||
        'No se pudo registrar la película'
      );
    } finally {
      setEnviando(false);
    }
  };

  if (!show) return null;

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Agregar nueva película</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => { resetForm(); onClose?.(); }}
                aria-label="Close"
              />
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="modal-body">
                <div className="row g-3">
                  {/* Título */}
                  <div className="col-12">
                    <label className="form-label">Título</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej. La Gran Aventura"
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      maxLength={150}
                      required
                    />
                    <div className="text-end">
                      <small className="text-muted">{titulo.length}/150</small>
                    </div>
                  </div>

                  {/* Duración */}
                  <div className="col-12 col-md-4">
                    <label className="form-label">Duración (min)</label>
                    <div className="input-group">
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Ej. 120"
                        value={duracion}
                        onChange={(e) => setDuracion(e.target.value)}
                        min={1}
                        max={600}
                        required
                      />
                      <span className="input-group-text">min</span>
                    </div>
                  </div>

                  {/* Fecha */}
                  <div className="col-12 col-md-4">
                    <label className="form-label">Fecha</label>
                    <input
                      type="date"
                      className="form-control"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      required
                    />
                  </div>

                  {/* Hora */}
                  <div className="col-12 col-md-4">
                    <label className="form-label">Horario</label>
                    <input
                      type="time"
                      className="form-control"
                      value={hora}
                      onChange={(e) => setHora(e.target.value)}
                      required
                    />
                  </div>

                  {/* Idioma (BD) */}
                  <div className="col-12 col-md-6">
                    <label className="form-label">Idioma</label>
                    <select
                      className="form-select"
                      value={idiomaId}
                      onChange={(e) => setIdiomaId(e.target.value)}
                      required
                      disabled={cargandoCat}
                    >
                      <option value="">{cargandoCat ? 'Cargando...' : 'Seleccione...'}</option>
                      {idiomas.map((opt) => (
                        <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                      ))}
                    </select>
                  </div>

                  {/* Clasificación (BD) */}
                  <div className="col-12 col-md-6">
                    <label className="form-label">Clasificación</label>
                    <select
                      className="form-select"
                      value={clasificacionId}
                      onChange={(e) => setClasificacionId(e.target.value)}
                      required
                      disabled={cargandoCat}
                    >
                      <option value="">{cargandoCat ? 'Cargando...' : 'Seleccione...'}</option>
                      {clasificaciones.map((c) => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>

                  {/* Formato (BD) */}
                  <div className="col-12 col-md-6">
                    <label className="form-label">Formato</label>
                    <select
                      className="form-select"
                      value={formatoId}
                      onChange={(e) => setFormatoId(e.target.value)}
                      required
                      disabled={cargandoCat}
                    >
                      <option value="">{cargandoCat ? 'Cargando...' : 'Seleccione...'}</option>
                      {formatos.map((f) => (
                        <option key={f.id} value={f.id}>{f.nombre}</option>
                      ))}
                    </select>
                  </div>

                  {/* Precio */}
                  <div className="col-12 col-md-6">
                    <label className="form-label">Precio</label>
                    <div className="input-group">
                      <span className="input-group-text">Q</span>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Ej. 45.00"
                        value={precio}
                        onChange={(e) => setPrecio(e.target.value)}
                        min="0.01"
                        step="0.01"
                        max="1000"
                        required
                      />
                    </div>
                  </div>

                  {/* Sala (BD) */}
                  <div className="col-12 col-md-6">
                    <label className="form-label">Sala asignada</label>
                    <select
                      className="form-select"
                      value={salaId}
                      onChange={(e) => setSalaId(e.target.value)}
                      required
                      disabled={cargandoCat}
                    >
                      <option value="">{cargandoCat ? 'Cargando...' : 'Seleccione...'}</option>
                      {salas.map((s) => (
                        <option key={s.id} value={s.id}>{s.nombre}</option>
                      ))}
                    </select>
                  </div>

                  {/* Categoría (BD) */}
                  <div className="col-12 col-md-6">
                    <label className="form-label">Categoría</label>
                    <select
                      className="form-select"
                      value={categoriaId}
                      onChange={(e) => setCategoriaId(e.target.value)}
                      required
                      disabled={cargandoCat}
                    >
                      <option value="">{cargandoCat ? 'Cargando...' : 'Seleccione...'}</option>
                      {categorias.map((c) => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>

                  {/* Imagen */}
                  <div className="col-12 col-md-6">
                    <label className="form-label">Imagen (JPG/PNG/WEBP, máx. 2MB)</label>
                    <input
                      type="file"
                      className="form-control"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={onFileChange}
                      required
                    />
                    {imagenPreview && (
                      <div className="mt-2">
                        <img
                          src={imagenPreview}
                          alt="Previsualización"
                          style={{ maxWidth: '220px', borderRadius: '12px' }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => { resetForm(); onClose?.(); }}
                  disabled={enviando}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={enviando}>
                  {enviando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      <div className="modal-backdrop fade show" />
    </>
  );
};

export default AgregarPelicula; 