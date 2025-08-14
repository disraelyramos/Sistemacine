const db = require('../config/db');
const oracledb = require('oracledb');
const jwt = require('jsonwebtoken');

exports.loginWithGoogle = async (req, res) => {
  const { email, name } = req.body;

  if (!email || !name) {
    return res.status(400).json({ message: 'Datos incompletos de Google' });
  }

  let connection;
  try {
    connection = await db.getConnection();

    // Buscar si ya existe el usuario por correo
    const userResult = await connection.execute(
      `SELECT id, usuario, role_id FROM usuarios WHERE correo = :correo`,
      [email],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    let user;
    if (userResult.rows.length > 0) {
      user = userResult.rows[0];
    } else {
      // Crear nuevo usuario con rol cliente (ID = 8)
      const nuevoUsuario = await connection.execute(
        `INSERT INTO usuarios (nombre, correo, usuario, password_hash, estado, role_id)
         VALUES (:nombre, :correo, :usuario, :password_hash, :estado, :role_id)
         RETURNING id, usuario, role_id INTO :id, :usuario_out, :role_id_out`,
        {
          nombre: name,
          correo: email,
          usuario: email,
          password_hash: 'GOOGLE_AUTH', // valor simbólico, no se usa
          estado: 1,
          role_id: 8,
          id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
          usuario_out: { dir: oracledb.BIND_OUT, type: oracledb.STRING },
          role_id_out: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        }
      );

      user = {
        id: nuevoUsuario.outBinds.id[0],
        usuario: nuevoUsuario.outBinds.usuario_out[0],
        role_id: nuevoUsuario.outBinds.role_id_out[0]
      };

      await connection.commit();
    }

    // Generar token
    const token = jwt.sign(
      {
        id: user.id,
        usuario: user.usuario,
        role_id: user.role_id
      },
      process.env.JWT_SECRET,
      { expiresIn: '3m' }
    );

    res.json({
      id: user.id,
      usuario: user.usuario,
      role_id: user.role_id,
      token
    });

  } catch (error) {
    console.error('Error login Google:', error);
    res.status(500).json({ message: 'Error al autenticar con Google' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) {
        console.error('Error cerrando conexión:', e);
      }
    }
  }
};
