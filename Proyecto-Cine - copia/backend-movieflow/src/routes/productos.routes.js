const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configuración de almacenamiento en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Importar controladores
const { 
  nuevoProducto, 
  listarProductos,
  buscarProductoPorNombre,
  obtenerEstados // ✅ nuevo import
} = require('../controllers/nuevoproducto.controller');

// 📌 POST: Registrar nuevo producto con imagen
router.post('/nuevo-producto', upload.single('imagen'), nuevoProducto);

// 📌 GET: Listar todos los productos
router.get('/', listarProductos);

// 📌 GET: Buscar productos por nombre
router.get('/buscar', buscarProductoPorNombre);



module.exports = router;
