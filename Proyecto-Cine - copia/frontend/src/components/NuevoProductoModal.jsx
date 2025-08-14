// frontend/src/components/NuevoProductoModal.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const NuevoProductoModal = ({ show, onClose, onGuardado }) => {
  const [form, setForm] = useState({
    nombre: '',
    codigo_barras: '',
    categoria_id: '',
    unidad_medida_id: '',
    fecha_vencimiento: '',
    cantidad: '',
    precio_venta: '',
    precio_costo: ''
  });

  const [categorias, setCategorias] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [imagenFile, setImagenFile] = useState(null);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // ⛔ candado

  // Cargar cat/unidades cuando se muestre el modal
  useEffect(() => {
    if (!show) return;
    (async () => {
      try {
        const [catRes, uniRes] = await Promise.all([
          axios.get('http://localhost:3001/api/categoria-productos'),
          axios.get('http://localhost:3001/api/unidadmedida')
        ]);
        setCategorias(catRes.data);
        setUnidades(uniRes.data);
      } catch {
        toast.error('Error al cargar categorías o unidades de medida');
      }
    })();
  }, [show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagenFile(file);
      setImagenPreview(URL.createObjectURL(file));
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    const [yyyy, mm, dd] = fecha.split('-');
    return `${dd}/${mm}/${yyyy}`;
  };

  const handleGuardar = async () => {
    if (isSubmitting) return;         // evita doble envío
    setIsSubmitting(true);

    const { nombre, codigo_barras, categoria_id, unidad_medida_id, precio_venta } = form;

    // Validaciones básicas
    if (!nombre || !codigo_barras || !categoria_id || !unidad_medida_id || !precio_venta) {
      toast.warn('Completa los campos obligatorios');
      setIsSubmitting(false);
      return;
    }

    const usuarioId = Number(localStorage.getItem('usuario_id') || sessionStorage.getItem('usuario_id'));
    const rolId = Number(localStorage.getItem('rol_id') || sessionStorage.getItem('rol_id'));

    if (!usuarioId || !rolId) {
      toast.error('No se pudo identificar al usuario. Inicia sesión nuevamente.');
      setIsSubmitting(false);
      return;
    }

    try {
      const fd = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (key === 'fecha_vencimiento') {
          fd.append(key, formatearFecha(value));
        } else if (['categoria_id', 'unidad_medida_id', 'cantidad', 'precio_venta', 'precio_costo'].includes(key)) {
          fd.append(key, value ? Number(value) : null);
        } else {
          fd.append(key, value ?? '');
        }
      });

      fd.append('usuario_id', usuarioId);
      fd.append('rol_id', rolId);
      if (imagenFile) fd.append('imagen', imagenFile);

      const res = await axios.post(
        'http://localhost:3001/api/productos/nuevo-producto',
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      // 🔒 Un solo toast según success
      if (res.data?.success) {
        toast.success(res.data.message || 'Producto creado correctamente.');
        onGuardado && onGuardado();
        handleReset();
        onClose();
      } else {
        toast.error(res.data?.message || 'No se pudo crear el producto.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar producto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm({
      nombre: '',
      codigo_barras: '',
      categoria_id: '',
      unidad_medida_id: '',
      fecha_vencimiento: '',
      cantidad: '',
      precio_venta: '',
      precio_costo: ''
    });
    setImagenFile(null);
    setImagenPreview(null);
  };

  if (!show) return null;

  return (
    <div className="modal fade show" style={{ display: 'block' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">

          <div className="modal-header">
            <h5 className="modal-title">Nuevo Producto</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            {/* Nombre y código */}
            {[
              { label: 'Nombre', name: 'nombre', type: 'text' },
              { label: 'Código de Barras', name: 'codigo_barras', type: 'text' }
            ].map(field => (
              <div className="mb-3" key={field.name}>
                <label>{field.label}</label>
                <input
                  type={field.type}
                  name={field.name}
                  className="form-control"
                  value={form[field.name]}
                  onChange={handleChange}
                />
              </div>
            ))}

            {/* Categoría */}
            <div className="mb-3">
              <label>Categoría</label>
              <select name="categoria_id" className="form-select" value={form.categoria_id} onChange={handleChange}>
                <option value="">Seleccione</option>
                {categorias.map(cat => (
                  <option key={cat.ID} value={cat.ID}>{cat.NOMBRE}</option>
                ))}
              </select>
            </div>

            {/* Unidad de medida */}
            <div className="mb-3">
              <label>Unidad de Medida</label>
              <select name="unidad_medida_id" className="form-select" value={form.unidad_medida_id} onChange={handleChange}>
                <option value="">Seleccione</option>
                {unidades.map(uni => (
                  <option key={uni.ID} value={uni.ID}>{uni.NOMBRE}</option>
                ))}
              </select>
            </div>

            {/* Fecha */}
            <div className="mb-3">
              <label>Fecha de Vencimiento</label>
              <input
                type="date"
                name="fecha_vencimiento"
                className="form-control"
                value={form.fecha_vencimiento}
                onChange={handleChange}
              />
            </div>

            {/* Numéricos */}
            {[
              { label: 'Cantidad', name: 'cantidad', step: '1' },
              { label: 'Precio Venta', name: 'precio_venta', step: '0.01' },
              { label: 'Precio Costo', name: 'precio_costo', step: '0.01' }
            ].map(field => (
              <div className="mb-3" key={field.name}>
                <label>{field.label}</label>
                <input
                  type="number"
                  step={field.step}
                  name={field.name}
                  className="form-control"
                  value={form[field.name]}
                  onChange={handleChange}
                />
              </div>
            ))}

            {/* Imagen */}
            <div className="mb-3">
              <label>Imagen</label>
              <input type="file" className="form-control" accept="image/*" onChange={handleImagenChange} />
              {imagenPreview && (
                <div className="mt-2">
                  <img src={imagenPreview} alt="Preview" style={{ width: '100px', borderRadius: '4px', border: '1px solid #ddd' }} />
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleGuardar}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando…' : 'Guardar'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default NuevoProductoModal;
