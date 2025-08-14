// productoestado.controller.js
const db = require('../config/db');
const oracledb = require('oracledb');

exports.listarEstadosProducto = async (req, res) => {
  let connection;
  try {
    connection = await db.getConnection();
    const result = await connection.execute(
      `SELECT DISTINCT ESTADO AS NOMBRE 
       FROM PRODUCTO_ESTADO 
       ORDER BY ESTADO`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo estados de producto:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  } finally {
    if (connection) await connection.close();
  }
};
