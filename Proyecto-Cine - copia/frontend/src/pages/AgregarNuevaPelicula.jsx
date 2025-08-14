import React, { useState } from 'react';
import { toast } from 'react-toastify';
import AgregarPelicula from '../components/AgregarPelicula';

const Peliculas = () => {
  const [showModal, setShowModal] = useState(false);
  const [peliculas, setPeliculas] = useState([]);

  const onGuardado = (payload) => {
    // payload viene del modal con la info más importante
    setPeliculas((prev) => [{ id: payload.id, ...payload }, ...prev]);
    toast.success('Película registrada');
    setShowModal(false);
  };

  return (
    <div className="container">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="h5 m-0">Películas</h2>

        {/* 👉 Solo el botón */}
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <i className="bi bi-plus-circle me-1" /> Agregar nueva película
        </button>
      </div>

      {/* Grid de cards */}
      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
        {peliculas.length === 0 ? (
          <div className="col">
            <div className="card shadow-sm border-0">
              <div className="card-body text-muted">
                Aún no hay películas registradas. Usa “Agregar nueva película”.
              </div>
            </div>
          </div>
        ) : (
          peliculas.map((p) => (
            <div className="col" key={p.id}>
              <div className="card h-100 shadow-sm border-0">
                {p.posterUrl || p.posterLocal ? (
                  <img
                    src={p.posterUrl || p.posterLocal}
                    alt={p.titulo}
                    className="card-img-top"
                    style={{ objectFit: 'cover', height: 220 }}
                  />
                ) : null}
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="card-title mb-0" title={p.titulo}>
                      {p.titulo}
                    </h5>
                    <span className="badge bg-success">Q {Number(p.precio).toFixed(2)}</span>
                  </div>

                  <div className="mb-2">
                    <span className="badge bg-secondary me-1">{p.formato}</span>
                    <span className="badge bg-info text-dark me-1">{p.idioma}</span>
                    <span className="badge bg-dark">{p.clasificacion}</span>
                  </div>

                  <ul className="list-unstyled small text-muted mb-0">
                    <li><i className="bi bi-clock me-1" /> {p.duracion} min</li>
                    <li><i className="bi bi-calendar-event me-1" /> {p.fecha} {p.hora}</li>
                    <li><i className="bi bi-tag me-1" /> {p.categoria}</li>
                    <li><i className="bi bi-door-open me-1" /> {p.sala}</li>
                  </ul>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <AgregarPelicula
          show={showModal}
          onClose={() => setShowModal(false)}
          onGuardado={onGuardado}
        />
      )}
    </div>
  );
};

export default Peliculas;
