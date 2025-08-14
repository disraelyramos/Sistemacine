// src/controllers/nuevoproducto.controller.js
const db = require('../config/db');
const oracledb = require('oracledb');

// Mapeo para formato uniforme de producto
const mapProducto = (prod) => ({
  codigo_barras: prod.CODIGO_BARRAS,
  nombre: prod.NOMBRE,
  categoria: prod.CATEGORIA,
  unidad: prod.UNIDAD,
  cantidad: prod.CANTIDAD,
  fecha_vencimiento: prod.FECHA_VENCIMIENTO,
  precio_costo: prod.PRECIO_COSTO,
  precio_venta: prod.PRECIO_VENTA,
  estados: prod.ESTADOS ? prod.ESTADOS.split(',') : []
});

// 📌 Crear nuevo producto
exports.nuevoProducto = async (req, res) => {
  const {
    codigo_barras, nombre, categoria_id, unidad_medida_id,
    cantidad, precio_venta, precio_costo, fecha_vencimiento,
    usuario_id, rol_id
  } = req.body;

  let connection;
  try {
    if (!codigo_barras || !nombre || !categoria_id || !unidad_medida_id ||
        !precio_venta || !precio_costo || !usuario_id || !rol_id) {
      return res.status(400).json({ success: false, message: 'Faltan campos obligatorios.' });
    }

    connection = await db.getConnection();

    // Validar usuario y rol
    const userCheck = await connection.execute(
      `SELECT COUNT(*) AS TOTAL
       FROM USUARIOS
       WHERE ID = :usuario_id AND ROLE_ID = :rol_id`,
      { usuario_id, rol_id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (userCheck.rows[0].TOTAL === 0) {
      return res.status(403).json({ success: false, message: 'Usuario o rol inválido.' });
    }

    // Verificar duplicados
    const dupCheck = await connection.execute(
      `SELECT COUNT(*) AS TOTAL
       FROM PRODUCTO_NUEVO
       WHERE CODIGO_BARRAS = :codigo_barras
          OR UPPER(NOMBRE) = UPPER(:nombre)`,
      { codigo_barras, nombre },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (dupCheck.rows[0].TOTAL > 0) {
      return res.status(409).json({ success: false, message: 'El producto ya existe (código o nombre duplicado).' });
    }

    // Formatear fecha
    let fechaFormateada = null;
    if (fecha_vencimiento) {
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(fecha_vencimiento)) {
        const [dia, mes, anio] = fecha_vencimiento.split('/');
        fechaFormateada = `${anio}-${mes}-${dia}`;
      } else {
        fechaFormateada = fecha_vencimiento;
      }
    }

    // Insertar producto
    const result = await connection.execute(
      `INSERT INTO PRODUCTO_NUEVO (
         CODIGO_BARRAS, NOMBRE, CATEGORIA_ID, UNIDAD_MEDIDA_ID,
         CANTIDAD, PRECIO_VENTA, PRECIO_COSTO, FECHA_VENCIMIENTO,
         USUARIO_ID, ROL_ID
       ) VALUES (
         :codigo_barras, :nombre, :categoria_id, :unidad_medida_id,
         :cantidad, :precio_venta, :precio_costo,
         TO_DATE(:fecha_vencimiento, 'YYYY-MM-DD'),
         :usuario_id, :rol_id
       )`,
      {
        codigo_barras, nombre, categoria_id, unidad_medida_id,
        cantidad: cantidad || 0, precio_venta, precio_costo,
        fecha_vencimiento: fechaFormateada, usuario_id, rol_id
      },
      { autoCommit: true }
    );

    if (result.rowsAffected > 0) {
      return res.status(201).json({ success: true, message: 'Producto creado correctamente.' });
    }

    return res.status(500).json({ success: false, message: 'No se pudo crear el producto.' });

  } catch (error) {
    console.error('[ERROR] nuevoProducto:', error);
    return res.status(500).json({ success: false, message: 'Error interno al crear producto.', error: error.message });
  } finally {
    if (connection) await connection.close();
  }
};

// 📌 Listar todos los productos
exports.listarProductos = async (req, res) => {
  let connection;
  try {
    connection = await db.getConnection();
    const result = await connection.execute(
      `SELECT 
          P.CODIGO_BARRAS,
          P.NOMBRE,
          C.NOMBRE AS CATEGORIA,
          U.NOMBRE AS UNIDAD,
          P.CANTIDAD,
          TO_CHAR(P.FECHA_VENCIMIENTO, 'DD/MM/YYYY') AS FECHA_VENCIMIENTO,
          P.PRECIO_COSTO,
          P.PRECIO_VENTA,
          LISTAGG(PE.ESTADO, ',') WITHIN GROUP (ORDER BY PE.ESTADO) AS ESTADOS
       FROM PRODUCTO_NUEVO P
       JOIN CATEGORIAPRODUCTO C ON C.ID = P.CATEGORIA_ID
       JOIN UNIDAD_MEDIDA U ON U.ID = P.UNIDAD_MEDIDA_ID
       LEFT JOIN PRODUCTO_ESTADO PE ON PE.PRODUCTO_ID = P.ID
       GROUP BY P.CODIGO_BARRAS, P.NOMBRE, C.NOMBRE, U.NOMBRE,
                P.CANTIDAD, P.FECHA_VENCIMIENTO, P.PRECIO_COSTO, P.PRECIO_VENTA
       ORDER BY P.NOMBRE ASC`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows.map(mapProducto));
  } catch (error) {
    console.error('[ERROR] listarProductos:', error);
    res.status(500).json({ message: 'Error interno al obtener productos' });
  } finally {
    if (connection) await connection.close();
  }
};

// 📌 Buscar producto por nombre
exports.buscarProductoPorNombre = async (req, res) => {
  const { nombre } = req.query;
  let connection;
  try {
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ message: 'El nombre de búsqueda es obligatorio.' });
    }

    connection = await db.getConnection();
    const result = await connection.execute(
      `SELECT 
          P.CODIGO_BARRAS,
          P.NOMBRE,
          C.NOMBRE AS CATEGORIA,
          U.NOMBRE AS UNIDAD,
          P.CANTIDAD,
          TO_CHAR(P.FECHA_VENCIMIENTO, 'DD/MM/YYYY') AS FECHA_VENCIMIENTO,
          P.PRECIO_COSTO,
          P.PRECIO_VENTA,
          LISTAGG(PE.ESTADO, ',') WITHIN GROUP (ORDER BY PE.ESTADO) AS ESTADOS
       FROM PRODUCTO_NUEVO P
       JOIN CATEGORIAPRODUCTO C ON C.ID = P.CATEGORIA_ID
       JOIN UNIDAD_MEDIDA U ON U.ID = P.UNIDAD_MEDIDA_ID
       LEFT JOIN PRODUCTO_ESTADO PE ON PE.PRODUCTO_ID = P.ID
       WHERE UPPER(P.NOMBRE) LIKE UPPER(:nombre)
       GROUP BY P.CODIGO_BARRAS, P.NOMBRE, C.NOMBRE, U.NOMBRE,
                P.CANTIDAD, P.FECHA_VENCIMIENTO, P.PRECIO_COSTO, P.PRECIO_VENTA
       ORDER BY P.NOMBRE ASC`,
      { nombre: `%${nombre}%` },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json(result.rows.map(mapProducto));
  } catch (error) {
    console.error('[ERROR] buscarProductoPorNombre:', error);
    res.status(500).json({ message: 'Error interno al buscar productos' });
  } finally {
    if (connection) await connection.close();
  }
};
