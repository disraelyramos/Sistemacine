const db = require('../config/db');
const oracledb = require('oracledb');
const xss = require('xss');

/**
 * 🔍 Buscar productos por nombre (solo CODIGO_BARRAS y NOMBRE)
 */
exports.buscarProductoPorNombre = async (req, res) => {
  let connection;
  try {
    const nombre = xss((req.query.nombre || '').trim());

    if (!nombre) {
      return res.status(400).json({ message: 'El nombre de búsqueda es obligatorio.' });
    }

    connection = await db.getConnection();
    const result = await connection.execute(
      `SELECT ID, CODIGO_BARRAS, NOMBRE
       FROM PRODUCTO_NUEVO
       WHERE UPPER(NOMBRE) LIKE UPPER(:nombre)
       ORDER BY NOMBRE ASC`,
      { nombre: `%${nombre}%` },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return res.json(result.rows || []);
  } catch (error) {
    console.error('[ERROR] buscarProductoPorNombre:', error);
    return res.status(500).json({ message: 'Error interno al buscar productos.' });
  } finally {
    if (connection) await connection.close();
  }
};

/**
 * 📌 Obtener datos completos de un producto por ID
 */
exports.obtenerProductoPorId = async (req, res) => {
  let connection;
  try {
    const id = parseInt(xss((req.params.id || '').trim()), 10);

    if (!id) {
      return res.status(400).json({ message: 'El ID es obligatorio y debe ser numérico.' });
    }

    connection = await db.getConnection();
    const result = await connection.execute(
      `SELECT 
          P.ID AS ID,
          P.CODIGO_BARRAS AS CODIGO,
          P.NOMBRE AS NOMBRE,
          P.CATEGORIA_ID AS CATEGORIA_ID,
          C.NOMBRE AS CATEGORIA_NOMBRE,
          P.UNIDAD_MEDIDA_ID AS UNIDAD_MEDIDA_ID,
          U.NOMBRE AS UNIDAD_NOMBRE,
          P.CANTIDAD AS CANTIDAD,
          TO_CHAR(P.FECHA_VENCIMIENTO, 'YYYY-MM-DD') AS FECHAVENCIMIENTO,
          P.PRECIO_COSTO AS PRECIOCOSTO,
          P.PRECIO_VENTA AS PRECIOVENTA,
          NVL(PE.ESTADO, 'INACTIVO') AS ESTADO
       FROM PRODUCTO_NUEVO P
       JOIN CATEGORIAPRODUCTO C ON C.ID = P.CATEGORIA_ID
       JOIN UNIDAD_MEDIDA U ON U.ID = P.UNIDAD_MEDIDA_ID
       LEFT JOIN PRODUCTO_ESTADO PE ON PE.PRODUCTO_ID = P.ID
       WHERE P.ID = :id`,
      { id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: 'Producto no encontrado.' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('[ERROR] obtenerProductoPorId:', error);
    return res.status(500).json({ message: 'Error interno al obtener producto.' });
  } finally {
    if (connection) await connection.close();
  }
};

/**
 * ✏️ Actualizar SOLO campos modificados de un producto por ID, evitando duplicados
 */
exports.actualizarProductoPorId = async (req, res) => {
  let connection;
  try {
    const id = parseInt(xss((req.params.id || '').trim()), 10);
    if (!id) {
      return res.status(400).json({ message: 'El ID es obligatorio y debe ser numérico.' });
    }

    const camposPermitidos = [
      'codigo',
      'nombre',
      'categoria_id',
      'unidad_id',
      'cantidad',
      'fechaVencimiento',
      'precioCosto',
      'precioVenta',
      'estado'
    ];

    const datosLimpios = {};
    for (const campo of camposPermitidos) {
      if (req.body[campo] !== undefined && req.body[campo] !== null && req.body[campo] !== '') {
        let valor = req.body[campo];
        if (['categoria_id', 'unidad_id', 'cantidad', 'precioCosto', 'precioVenta'].includes(campo)) {
          valor = Number(valor);
        } else if (typeof valor === 'string') {
          valor = xss(valor.trim());
        }
        datosLimpios[campo] = valor;
      }
    }

    if (!Object.keys(datosLimpios).length) {
      return res.status(400).json({ message: 'No se enviaron campos para actualizar.' });
    }

    connection = await db.getConnection();

    if (datosLimpios.nombre) {
      const checkNombre = await connection.execute(
        `SELECT COUNT(*) AS total
         FROM PRODUCTO_NUEVO
         WHERE UPPER(NOMBRE) = UPPER(:nombre)
         AND ID <> :id`,
        { nombre: datosLimpios.nombre, id },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      if (checkNombre.rows[0].TOTAL > 0) {
        return res.status(400).json({ message: 'Ya existe otro producto con ese nombre.' });
      }
    }

    if (datosLimpios.codigo) {
      const checkCodigo = await connection.execute(
        `SELECT COUNT(*) AS total
         FROM PRODUCTO_NUEVO
         WHERE CODIGO_BARRAS = :codigo
         AND ID <> :id`,
        { codigo: datosLimpios.codigo, id },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      if (checkCodigo.rows[0].TOTAL > 0) {
        return res.status(400).json({ message: 'Ya existe otro producto con ese código de barras.' });
      }
    }

    const sets = [];
    const binds = { id };
    let i = 1;

    for (const [campo, valor] of Object.entries(datosLimpios)) {
      let col;
      switch (campo) {
        case 'codigo': col = 'CODIGO_BARRAS'; break;
        case 'categoria_id': col = 'CATEGORIA_ID'; break;
        case 'unidad_id': col = 'UNIDAD_MEDIDA_ID'; break;
        case 'fechaVencimiento':
          sets.push(`FECHA_VENCIMIENTO = TO_DATE(:valor${i}, 'YYYY-MM-DD')`);
          binds[`valor${i}`] = valor;
          i++;
          continue;
        case 'precioCosto': col = 'PRECIO_COSTO'; break;
        case 'precioVenta': col = 'PRECIO_VENTA'; break;
        default: col = campo.toUpperCase();
      }
      sets.push(`${col} = :valor${i}`);
      binds[`valor${i}`] = valor;
      i++;
    }

    const sql = `UPDATE PRODUCTO_NUEVO SET ${sets.join(', ')} WHERE ID = :id`;
    const result = await connection.execute(sql, binds, { autoCommit: true });

    if (!result.rowsAffected) {
      return res.status(404).json({ message: 'Producto no encontrado o sin cambios.' });
    }

    return res.json({
      message: 'Producto actualizado correctamente',
      campos_actualizados: Object.keys(datosLimpios)
    });
  } catch (error) {
    console.error('[ERROR] actualizarProductoPorId:', error);
    return res.status(500).json({ message: 'Error interno al actualizar producto.' });
  } finally {
    if (connection) await connection.close();
  }
};
