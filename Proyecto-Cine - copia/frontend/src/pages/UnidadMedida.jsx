// src/pages/UnidadMedida.jsx
import React, { useState } from 'react';
import { FaPlus, FaBalanceScale, FaSave, FaTrash, FaSearch } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';
import '../styles/categorias.css'; // ♻️ Reutilizamos el mismo CSS

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const UnidadMedida = () => {
  const [unidades, setUnidades] = useState([]);
  const [nombre, setNombre] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // 📌 Generar código local temporal
  const generarCodigoLocal = () => {
    const totalNuevas = unidades.filter(um => um.isNew).length + 1;
    return `UM${String(totalNuevas).padStart(3, '0')}`;
  };

  // ➕ Agregar nueva unidad
  const agregarUnidad = () => {
    if (!nombre.trim()) {
      toast.error('El nombre de la unidad de medida es obligatorio');
      return;
    }

    const nuevoCodigo = generarCodigoLocal();
    const nuevaUnidad = {
      codigo: nuevoCodigo,
      nombre: nombre.trim(),
      isNew: true
    };

    setUnidades(prev => [...prev, nuevaUnidad]);
    setNombre('');
    toast.success(`Unidad agregada (Código: ${nuevoCodigo})`);
  };

  // 💾 Guardar todas las unidades nuevas en BD
  const guardarUnidades = async () => {
    const nuevas = unidades.filter(um => um.isNew);

    if (nuevas.length === 0) {
      toast.info('No hay unidades nuevas para guardar');
      return;
    }

    try {
      const res = await axios.post(`${API_BASE}/unidadmedida/lote`, {
        unidades: nuevas
      });

      toast.success(res.data.message);

      const unidadesGuardadas = res.data.unidades; // códigos reales desde backend

      // 🔄 Reemplazar en la lista local
      setUnidades(prev =>
        prev.map(um => {
          if (um.isNew) {
            const actualizado = unidadesGuardadas.shift();
            return { ...um, codigo: actualizado.codigo, isNew: false };
          }
          return um;
        })
      );
    } catch (error) {
      console.error('Error al guardar unidades:', error);
      toast.error(error.response?.data?.message || 'Error al guardar unidades');
    }
  };

  // 🔍 Buscar en BD
  const buscarUnidades = async (texto) => {
    setBusqueda(texto);
    if (!texto.trim()) {
      setUnidades([]);
      return;
    }

    try {
      const res = await axios.get(`${API_BASE}/unidadmedida/buscar`, {
        params: { q: texto }
      });

      const data = res.data.map(um => ({
        codigo: um.CODIGO,
        nombre: um.NOMBRE,
        isNew: false
      }));

      setUnidades(data);
    } catch (error) {
      console.error('Error al buscar unidades:', error);
      toast.error('Error al buscar unidades');
    }
  };

  // 🗑 Eliminar unidad
  const eliminarUnidad = async (codigo, isNew) => {
    if (isNew) {
      setUnidades(prev => prev.filter(um => um.codigo !== codigo));
      toast.info(`Unidad ${codigo} eliminada de la lista`);
    } else {
      try {
        await axios.delete(`${API_BASE}/unidadmedida/${codigo}`);
        setUnidades(prev => prev.filter(um => um.codigo !== codigo));
        toast.info(`Unidad ${codigo} eliminada de BD`);
      } catch (error) {
        console.error('Error al eliminar unidad:', error);
        toast.error('No se pudo eliminar la unidad');
      }
    }
  };

  return (
    <div className="categorias-container">
      {/* Formulario agregar */}
      <div className="card agregar-categoria">
        <h3><FaPlus /> Agregar Unidad de Medida</h3>
        <input
          type="text"
          placeholder="Código generado automáticamente"
          value={generarCodigoLocal()}
          readOnly
        />
        <input
          type="text"
          placeholder="Ej: Litro, Gramo, Unidad"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <button className="btn-azul" onClick={agregarUnidad}>
          <FaBalanceScale /> Agregar Unidad
        </button>
        <button className="btn-verde" onClick={guardarUnidades}>
          <FaSave /> Guardar Todo
        </button>
      </div>

      {/* Lista */}
      <div className="card categorias-agregadas">
        <div className="header-lista">
          <h3>📄 Lista de Unidades de Medida</h3>
          <span className="badge">{unidades.length}</span>
        </div>

        {/* Buscador */}
        <div className="buscador">
          
          <input
            type="text"
            placeholder="Buscar unidad..."
            value={busqueda}
            onChange={(e) => buscarUnidades(e.target.value)}
          />
        </div>

        {/* Lista */}
        <div className="lista-categorias">
          {unidades.map((um) => (
            <div className="item-categoria" key={um.codigo}>
              <div>
                <FaBalanceScale /> <strong>{um.codigo}</strong>
                <p>{um.nombre}</p>
              </div>
              <button
                className="btn-rojo"
                onClick={() => eliminarUnidad(um.codigo, um.isNew)}
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

export default UnidadMedida;
