// src/controllers/menu.controller.js
const db = require('../config/db');
const oracledb = require('oracledb');

exports.getMenuByRole = async (req, res) => {
  const role_id = req.params.role_id;
  let connection;

  if (!role_id) {
    return res.status(400).json({ message: 'role_id es obligatorio' });
  }

  try {
    connection = await db.getConnection();

    const result = await connection.execute(
      `SELECT 
        m.ID AS MODULO_ID,
        m.NAME AS MODULO_NAME,
        m.ICON AS MODULO_ICON,
        m.ROUTE AS MODULO_ROUTE,
        s.ID AS SUBMODULO_ID,
        s.NAME AS SUBMODULO_NAME,
        s.ROUTE AS SUBMODULO_ROUTE,
        s.ICON AS SUBMODULO_ICON
      FROM "MODULO" m
      LEFT JOIN "SUBMODULO" s ON s.MODULO_ID = m.ID
      INNER JOIN "PERMISOS" p ON p.MODULO_ID = m.ID AND (p.SUBMODULO_ID = s.ID OR s.ID IS NULL)
      WHERE p.ROLES_ID = :role_id AND p.ACTIVE = 1
      ORDER BY m.ID, s.ID`,
      [role_id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const menu = [];
    const map = new Map();

    for (const row of result.rows) {
      let modulo = map.get(row.MODULO_ID);
      if (!modulo) {
        modulo = {
          id: row.MODULO_ID,
          name: row.MODULO_NAME,
          icon: row.MODULO_ICON,
          route: row.MODULO_ROUTE,
          submodulos: [],
        };
        map.set(row.MODULO_ID, modulo);
        menu.push(modulo);
      }
      if (row.SUBMODULO_ID) {
        modulo.submodulos.push({
          id: row.SUBMODULO_ID,
          name: row.SUBMODULO_NAME,
          icon: row.SUBMODULO_ICON,
          route: row.SUBMODULO_ROUTE,
        });
      }
    }

    res.json(menu);

  } catch (error) {
    console.error('Error en getMenuByRole:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeError) {
        console.error('Error cerrando conexión:', closeError);
      }
    }
  }
};
