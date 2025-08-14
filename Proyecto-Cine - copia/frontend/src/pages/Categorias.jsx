import React, { useState } from 'react';
import { FaPlus, FaTags, FaSave, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';
import '../styles/categorias.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const Categorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [nombre, setNombre] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // 📌 Generar código local temporal solo para mostrar
  const generarCodigoLocal = () => {
    const totalNuevas = categorias.filter(cat => cat.isNew).length + 1;
    return `CAT${String(totalNuevas).padStart(3, '0')}`;
  };

  // ➕ Agregar nueva categoría
  const agregarCategoria = () => {
    if (!nombre.trim()) {
      toast.error('El nombre de la categoría es obligatorio');
      return;
    }

    const nuevaCategoria = {
      // El backend generará el código real
      codigo: generarCodigoLocal(),
      nombre: nombre.trim(),
      isNew: true
    };

    setCategorias(prev => [...prev, nuevaCategoria]);
    setNombre('');
    toast.success(`Categoría agregada (Código provisional: ${nuevaCategoria.codigo})`);
  };

  // 💾 Guardar todas las categorías nuevas en BD
  const guardarCategorias = async () => {
    const nuevas = categorias.filter(cat => cat.isNew);

    if (nuevas.length === 0) {
      toast.info('No hay categorías nuevas para guardar');
      return;
    }

    try {
      const res = await axios.post(`${API_BASE}/categoria-productos/lote`, {
        categorias: nuevas.map(({ nombre }) => ({ nombre })) // Solo enviamos nombre
      });

      toast.success(res.data.message);

      const categoriasGuardadas = res.data.categorias;

      // 🔄 Reemplazar códigos temporales con los reales
      setCategorias(prev =>
        prev.map(cat => {
          if (cat.isNew) {
            const actualizado = categoriasGuardadas.shift();
            return { ...cat, codigo: actualizado.codigo, isNew: false };
          }
          return cat;
        })
      );
    } catch (error) {
      console.error('Error al guardar categorías:', error);
      toast.error(error.response?.data?.message || 'Error al guardar categorías');
    }
  };

  // 🔍 Buscar en BD
  const buscarCategorias = async (texto) => {
    setBusqueda(texto);
    if (!texto.trim()) {
      setCategorias([]);
      return;
    }

    try {
      const res = await axios.get(`${API_BASE}/categoria-productos/buscar`, {
        params: { q: texto }
      });

      const data = res.data.map(cat => ({
        codigo: cat.CODIGO,
        nombre: cat.NOMBRE,
        isNew: false
      }));

      setCategorias(data);
    } catch (error) {
      console.error('Error al buscar categorías:', error);
      toast.error('Error al buscar categorías');
    }
  };

  // 🗑 Eliminar categoría
  const eliminarCategoria = async (codigo, isNew) => {
    if (isNew) {
      setCategorias(prev => prev.filter(cat => cat.codigo !== codigo));
      toast.info(`Categoría ${codigo} eliminada de la lista`);
    } else {
      try {
        await axios.delete(`${API_BASE}/categoria-productos/${codigo}`);
        setCategorias(prev => prev.filter(cat => cat.codigo !== codigo));
        toast.info(`Categoría ${codigo} eliminada`);
      } catch (error) {
        console.error('Error al eliminar categoría:', error);
        toast.error('No se pudo eliminar la categoría existe referencia a un producto');
      }
    }
  };

  return (
    <div className="categorias-container">
      {/* Formulario agregar */}
      <div className="card agregar-categoria">
        <h3><FaPlus /> Agregar Categoría</h3>
        <input
          type="text"
          placeholder="Código generado automáticamente"
          value={generarCodigoLocal()}
          readOnly
        />
        <input
          type="text"
          placeholder="Ej: jugos, bebidas calientes,caja"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <button className="btn-azul" onClick={agregarCategoria}>
          <FaTags /> Agregar Categoría
        </button>
        <button className="btn-verde" onClick={guardarCategorias}>
          <FaSave /> Guardar Todo
        </button>
      </div>

      {/* Lista */}
      <div className="card categorias-agregadas">
        <div className="header-lista">
          <h3>📄 Lista de Categorías</h3>
          <span className="badge">{categorias.length}</span>
        </div>

        {/* Buscador */}
        <div className="buscador">
          <input
            type="text"
            placeholder="Buscar categoría..."
            value={busqueda}
            onChange={(e) => buscarCategorias(e.target.value)}
          />
        </div>

        {/* Lista */}
        <div className="lista-categorias">
          {categorias.map((cat) => (
            <div className="item-categoria" key={cat.codigo}>
              <div>
                <FaTags /> <strong>{cat.codigo}</strong>
                <p>{cat.nombre}</p>
              </div>
              <button
                className="btn-rojo"
                onClick={() => eliminarCategoria(cat.codigo, cat.isNew)}
              >
                <FaTrash /> Eliminar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Categorias;
