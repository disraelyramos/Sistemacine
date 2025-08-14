// src/controllers/nuevapelicula.controller.js
const oracledb = require('oracledb');
const db = require('../config/db');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// ===============================
// Configuración de multer para imágenes
// ===============================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});
const upload = multer({ storage });

// ===============================
// GET /api/peliculas/select-data
// ===============================
const getSelectData = async (req, res) => {
  let connection;
  try {
    connection = await db.getConnection();

    const [idiomas, clasificaciones, formatos, salas, categorias] = await Promise.all([
      connection.execute(
        `SELECT ID_IDIOMA AS "id", NOMBRE AS "nombre" FROM IDIOMAS ORDER BY NOMBRE`,
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      ),
      connection.execute(
        `SELECT ID_CLASIFICACION AS "id", NOMBRE AS "nombre" FROM CLASIFICACION ORDER BY NOMBRE`,
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      ),
      connection.execute(
        `SELECT ID_FORMATO AS "id", NOMBRE AS "nombre" FROM FORMATO ORDER BY NOMBRE`,
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      ),
      connection.execute(
        `SELECT ID_SALA AS "id", NOMBRE AS "nombre" FROM SALAS ORDER BY NOMBRE`,
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      ),
      connection.execute(
        `SELECT ID_CATEGORIA AS "id", NOMBRE AS "nombre" FROM CATEGORIAS ORDER BY NOMBRE`,
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      ),
    ]);

    res.json({
      idiomas: idiomas.rows ?? [],
      clasificaciones: clasificaciones.rows ?? [],
      formatos: formatos.rows ?? [],
      salas: salas.rows ?? [],
      categorias: categorias.rows ?? [],
    });
  } catch (err) {
    console.error('GET select-data ->', err);
    res.status(500).json({ message: 'Error al obtener datos de referencia' });
  } finally {
    if (connection) await connection.close();
  }
};

// ===============================
// POST /api/peliculas
// ===============================
const createPelicula = async (req, res) => {
  let connection;
  try {
    const titulo = (req.body.titulo || '').trim();
    const duracionMin =
      Number(req.body.duracionMin ?? req.body.duracion ?? req.body.duracion_minutos);

    let fechaStr = req.body.fecha;
    let horario = req.body.horario;
    if (!fechaStr && !horario && req.body.fechaHora) {
      const [f, hFull] = String(req.body.fechaHora).split('T');
      fechaStr = f;
      horario = (hFull || '').slice(0, 5);
    }

    const precio = Number(req.body.precio);

    const id_idioma        = Number(req.body.id_idioma ?? req.body.idIdioma ?? req.body.idioma);
    const id_clasificacion = Number(req.body.id_clasificacion ?? req.body.idClasificacion ?? req.body.clasificacion);
    const id_formato       = Number(req.body.id_formato ?? req.body.idFormato ?? req.body.formato);
    const id_categoria     = Number(req.body.id_categoria ?? req.body.idCategoria ?? req.body.categoria);
    const id_sala          = Number(req.body.id_sala ?? req.body.idSala ?? req.body.sala);

    // Imagen obligatoria
    const imagen_url = req.file ? `/uploads/${req.file.filename}` : null;
    if (!imagen_url) {
      return res.status(400).json({ message: 'Debe subir una imagen de la película' });
    }

    // Validaciones
    if (!titulo) return res.status(400).json({ message: 'El título es obligatorio' });
    if (!duracionMin || duracionMin <= 0 || duracionMin > 600)
      return res.status(400).json({ message: 'Duración inválida (1-600)' });
    if (!fechaStr) return res.status(400).json({ message: 'La fecha es obligatoria' });
    if (!horario) return res.status(400).json({ message: 'El horario es obligatorio' });
    if (!Number.isFinite(precio) || precio < 0)
      return res.status(400).json({ message: 'Precio inválido' });

    const faltantes = [];
    if (!id_idioma) faltantes.push('idioma');
    if (!id_clasificacion) faltantes.push('clasificación');
    if (!id_formato) faltantes.push('formato');
    if (!id_categoria) faltantes.push('categoría');
    if (!id_sala) faltantes.push('sala');
    if (faltantes.length) {
      return res.status(400).json({ message: `Faltan campos: ${faltantes.join(', ')}` });
    }

    connection = await db.getConnection();

    // Validar existencia de FKs
    const [okIdioma, okClasif, okFormato, okCategoria, okSala] = await Promise.all([
      connection.execute(
        `SELECT COUNT(*) AS "TOTAL" FROM IDIOMAS WHERE ID_IDIOMA = :id`,
        { id: id_idioma },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      ),
      connection.execute(
        `SELECT COUNT(*) AS "TOTAL" FROM CLASIFICACION WHERE ID_CLASIFICACION = :id`,
        { id: id_clasificacion },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      ),
      connection.execute(
        `SELECT COUNT(*) AS "TOTAL" FROM FORMATO WHERE ID_FORMATO = :id`,
        { id: id_formato },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      ),
      connection.execute(
        `SELECT COUNT(*) AS "TOTAL" FROM CATEGORIAS WHERE ID_CATEGORIA = :id`,
        { id: id_categoria },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      ),
      connection.execute(
        `SELECT COUNT(*) AS "TOTAL" FROM SALAS WHERE ID_SALA = :id`,
        { id: id_sala },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      ),
    ]);

    if (!okIdioma.rows?.[0]?.TOTAL)    return res.status(400).json({ message: 'El idioma no existe' });
    if (!okClasif.rows?.[0]?.TOTAL)    return res.status(400).json({ message: 'La clasificación no existe' });
    if (!okFormato.rows?.[0]?.TOTAL)   return res.status(400).json({ message: 'El formato no existe' });
    if (!okCategoria.rows?.[0]?.TOTAL) return res.status(400).json({ message: 'La categoría no existe' });
    if (!okSala.rows?.[0]?.TOTAL)      return res.status(400).json({ message: 'La sala no existe' });

    // Verificar duplicados
    const dup = await connection.execute(
      `SELECT COUNT(*) AS "TOTAL"
         FROM PELICULA
        WHERE UPPER(TITULO) = UPPER(:titulo)
          AND ID_IDIOMA = :id_idioma
          AND ID_CLASIFICACION = :id_clasificacion
          AND ID_FORMATO = :id_formato
          AND ID_CATEGORIA = :id_categoria
          AND ID_SALA = :id_sala`,
      { titulo, id_idioma, id_clasificacion, id_formato, id_categoria, id_sala },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if ((dup.rows?.[0]?.TOTAL ?? 0) > 0) {
      return res.status(409).json({ message: 'La película ya existe con esa configuración' });
    }

    // Obtener ID con secuencia o MAX+1
    const seq = await connection.execute(
      `SELECT COUNT(*) AS "TOTAL" FROM USER_SEQUENCES WHERE SEQUENCE_NAME = 'SECUENCIA_PELICULA'`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    let insertSql;
    let bind = {
      titulo,
      duracionMin,
      fecha: fechaStr,
      horario,
      precio,
      id_idioma,
      id_clasificacion,
      id_formato,
      id_categoria,
      id_sala,
      imagen_url,
    };

    if ((seq.rows?.[0]?.TOTAL ?? 0) > 0) {
      insertSql = `
        INSERT INTO PELICULA (
          ID_PELICULA, TITULO, DURACION_MINUTOS, FECHA, HORARIO, PRECIO,
          ID_IDIOMA, ID_CLASIFICACION, ID_FORMATO, ID_CATEGORIA, ID_SALA, IMAGEN_URL
        ) VALUES (
          SECUENCIA_PELICULA.NEXTVAL, :titulo, :duracionMin, TO_DATE(:fecha, 'YYYY-MM-DD'), :horario, :precio,
          :id_idioma, :id_clasificacion, :id_formato, :id_categoria, :id_sala, TO_CLOB(:imagen_url)
        )
        RETURNING ID_PELICULA INTO :outId
      `;
      bind.outId = { dir: oracledb.BIND_OUT, type: oracledb.NUMBER };
    } else {
      const nextIdRes = await connection.execute(
        `SELECT NVL(MAX(ID_PELICULA), 0) + 1 AS "NEXT_ID" FROM PELICULA`,
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const nextId = nextIdRes.rows?.[0]?.NEXT_ID;
      insertSql = `
        INSERT INTO PELICULA (
          ID_PELICULA, TITULO, DURACION_MINUTOS, FECHA, HORARIO, PRECIO,
          ID_IDIOMA, ID_CLASIFICACION, ID_FORMATO, ID_CATEGORIA, ID_SALA, IMAGEN_URL
        ) VALUES (
          :newId, :titulo, :duracionMin, TO_DATE(:fecha, 'YYYY-MM-DD'), :horario, :precio,
          :id_idioma, :id_clasificacion, :id_formato, :id_categoria, :id_sala, TO_CLOB(:imagen_url)
        )
      `;
      bind.newId = nextId;
    }

    const result = await connection.execute(insertSql, bind, { autoCommit: true });
    const insertedId = bind.outId?.val ?? result?.outBinds?.outId ?? bind.newId ?? null;

    return res.status(201).json({
      message: 'Película registrada correctamente',
      ID: insertedId
    });

  } catch (err) {
    console.error('POST /api/peliculas ->', err);
    if (String(err?.message || '').includes('ORA-02289')) {
      return res.status(500).json({ message: 'Falta la secuencia SECUENCIA_PELICULA' });
    }
    if (String(err?.message || '').includes('ORA-02291')) {
      return res.status(400).json({ message: 'Alguna referencia (idioma, clasificación, formato, categoría o sala) no existe' });
    }
    res.status(500).json({ message: 'Error al registrar película' });
  } finally {
    try { if (connection) await connection.close(); } catch {}
  }
};

module.exports = { getSelectData, createPelicula, upload };
