const express = require('express');
const router = express.Router();

// ✅ Importar controlador
const actualizarProductoCtrl = require('../controllers/actualizar-producto.controller');

// 🔍 Buscar productos por nombre (ahora también devuelve ID)
router.get('/buscar', actualizarProductoCtrl.buscarProductoPorNombre);

// 📌 Obtener datos completos de un producto por ID
router.get('/:id', actualizarProductoCtrl.obtenerProductoPorId);

// ✏️ Actualizar solo los campos modificados de un producto por ID
router.put('/:id', actualizarProductoCtrl.actualizarProductoPorId);

module.exports = router;
