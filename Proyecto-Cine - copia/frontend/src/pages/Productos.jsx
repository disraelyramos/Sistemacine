import React, { useState, useEffect } from "react";
import { Plus, Package, DollarSign, BarChart2, AlertTriangle } from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "../styles/cards.css";
import NuevoProductoModal from "../components/NuevoProductoModal";
import axios from "axios";
import { io } from "socket.io-client";

const API_PRODUCTOS = "http://localhost:3001/api/productos";
const API_ESTADOS = "http://localhost:3001/api/producto-estados";
const API_CALCULO = "http://localhost:3001/api/calculo-productos";

const socket = io("http://localhost:3001", {
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const productosPorPagina = 8;

  // Filtro por estado
  const [estadosFiltro, setEstadosFiltro] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState("Todos");

  // Datos de cálculo
  const [stats, setStats] = useState({
    total_productos: 0,
    stock_total: 0,
    productos_stock_bajo: 0,
    costo_total: 0,
  });

  useEffect(() => {
    cargarProductos();
    cargarEstados();
    cargarCalculos();

    socket.on("producto_nuevo", (nuevoProducto) => {
      setProductos((prev) => [nuevoProducto, ...prev]);
      cargarCalculos();
    });

    return () => socket.off("producto_nuevo");
  }, []);

  const cargarProductos = async () => {
    try {
      const { data } = await axios.get(API_PRODUCTOS);
      setProductos(data || []);
    } catch (err) {
      console.error("Error cargando productos", err);
    }
  };

  const cargarEstados = async () => {
    try {
      const { data } = await axios.get(API_ESTADOS);
      setEstadosFiltro(data || []);
    } catch (err) {
      console.error("Error cargando estados de producto", err);
    }
  };

  const cargarCalculos = async () => {
    try {
      const { data } = await axios.get(API_CALCULO);
      setStats(data || {});
    } catch (err) {
      console.error("Error cargando cálculos de productos", err);
    }
  };

  const buscarProductos = async (valor) => {
    setBusqueda(valor);
    try {
      const { data } =
        valor.trim() === ""
          ? await axios.get(API_PRODUCTOS)
          : await axios.get(`${API_PRODUCTOS}/buscar`, {
            params: { nombre: valor },
          });
      setProductos(data || []);
      setPaginaActual(1);
    } catch (err) {
      console.error("Error buscando productos", err);
    }
  };

  const formatEstado = (estado) =>
    estado
      ? estado
        .toString()
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase())
      : "";

  const getBadgeClass = (estado) => {
    const e = formatEstado(estado).toLowerCase();
    switch (e) {
      case "ok":
      case "activo":
        return "badge bg-success";
      case "por vencer":
        return "badge bg-danger";
      case "stock minimo":
      case "stock bajo":
        return "badge bg-warning text-dark";
      case "vencido":
        return "badge bg-dark";
      default:
        return "badge bg-secondary";
    }
  };

  const formatQ = (n) =>
    `Q ${Number(n).toLocaleString("es-GT", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const productosFiltrados = productos.filter((p) => {
    if (filtroEstado !== "Todos") {
      return p.estados?.some(
        (estado) =>
          formatEstado(estado).toLowerCase() ===
          formatEstado(filtroEstado).toLowerCase()
      );
    }
    return true;
  });

  const indiceInicial = (paginaActual - 1) * productosPorPagina;
  const productosPaginados = productosFiltrados.slice(
    indiceInicial,
    indiceInicial + productosPorPagina
  );
  const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina);

  const cambiarPagina = (pagina) => {
    if (pagina >= 1 && pagina <= totalPaginas) {
      setPaginaActual(pagina);
    }
  };

  return (
    <div className="container-fluid mt-4">
      {/* Encabezado con filtro */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center gap-2">
            <Package size={28} />
            <h4 className="fw-bold m-0">Control de Productos</h4>
          </div>

          {/* Dropdown de estados */}
          <div className="dropdown">
            <button
              className="btn btn-outline-secondary dropdown-toggle d-flex align-items-center"
              type="button"
              id="dropdownEstados"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              {formatEstado(filtroEstado)}
            </button>
            <ul className="dropdown-menu" aria-labelledby="dropdownEstados">
              <li>
                <button
                  className="dropdown-item"
                  onClick={() => setFiltroEstado("Todos")}
                >
                  Todos
                </button>
              </li>
              {estadosFiltro.map((estado, index) => (
                <li key={index}>
                  <button
                    className="dropdown-item"
                    onClick={() => setFiltroEstado(estado.NOMBRE)}
                  >
                    {formatEstado(estado.NOMBRE)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Buscador + Botón Nuevo */}
        <div className="d-flex gap-2">
          <input
            type="text"
            className="form-control"
            placeholder="Buscar productos..."
            value={busqueda}
            onChange={(e) => buscarProductos(e.target.value)}
          />
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            <Plus size={18} /> Nuevo
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="table-responsive">
        <table className="table table-striped align-middle">
          <thead className="table-light">
            <tr>
              <th>Código de Barras</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Unidad</th>
              <th>Cantidad</th>
              <th>Fecha Venc.</th>
              <th>Precio Costo</th>
              <th>Precio Venta</th>
              <th>Estados</th>
            </tr>
          </thead>
          <tbody>
            {productosPaginados.length > 0 ? (
              productosPaginados.map((p, idx) => (
                <tr key={idx}>
                  <td>{p.codigo_barras}</td>
                  <td>{p.nombre}</td>
                  <td>{p.categoria}</td>
                  <td>{p.unidad}</td>
                  <td>{p.cantidad}</td>
                  <td>{p.fecha_vencimiento || "—"}</td>
                  <td>{formatQ(p.precio_costo)}</td>
                  <td>{formatQ(p.precio_venta)}</td>
                  <td>
                    {Array.isArray(p.estados) && p.estados.length > 0 ? (
                      p.estados.map((estado, i) => (
                        <span
                          key={i}
                          className={`${getBadgeClass(estado)} me-1`}
                        >
                          {formatEstado(estado)}
                        </span>
                      ))
                    ) : (
                      <span className="badge bg-secondary">—</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="text-center text-muted">
                  No hay productos registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginador */}
      {totalPaginas > 1 && (
        <div className="d-flex justify-content-end mt-3">
          <nav>
            <ul className="pagination">
              <li
                className={`page-item ${paginaActual === 1 ? "disabled" : ""}`}
              >
                <button
                  className="page-link"
                  onClick={() => cambiarPagina(paginaActual - 1)}
                >
                  &laquo;
                </button>
              </li>
              {Array.from({ length: totalPaginas }, (_, i) => (
                <li
                  key={i + 1}
                  className={`page-item ${paginaActual === i + 1 ? "active" : ""
                    }`}
                >
                  <button
                    className="page-link"
                    onClick={() => cambiarPagina(i + 1)}
                  >
                    {i + 1}
                  </button>
                </li>
              ))}
              <li
                className={`page-item ${paginaActual === totalPaginas ? "disabled" : ""
                  }`}
              >
                <button
                  className="page-link"
                  onClick={() => cambiarPagina(paginaActual + 1)}
                >
                  &raquo;
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}

      {/* Tarjetas de estadísticas con diseño */}
      <div className="row mt-5 g-4">
        <div className="col-md-3">
          <div className="stat-card stat-blue">
            <div className="stat-icon">
              <Package size={28} />
            </div>
            <h6>Total Productos</h6>
            <h3>{stats.total_productos}</h3>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card stat-green">
            <div className="stat-icon">
              <BarChart2 size={28} />
            </div>
            <h6>Stock Total</h6>
            <h3>{stats.stock_total}</h3>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card stat-yellow">
            <div className="stat-icon">
              <AlertTriangle size={28} />
            </div>
            <h6>Stock Bajo</h6>
            <h3>{stats.productos_stock_bajo}</h3>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card stat-gradient">
            <div className="stat-icon fw-bold fs-4 text-white bg-success d-flex align-items-center justify-content-center">
              Q
            </div>
            <h6>Costo Total</h6>
            <h3>{formatQ(stats.costo_total)}</h3>
          </div>
        </div>

      </div>


      {/* Modal */}
      <NuevoProductoModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onProductoCreado={(nuevoProducto) => {
          setProductos((prev) => [nuevoProducto, ...prev]);
          cargarCalculos();
        }}
      />
    </div>
  );
};

export default Productos;
