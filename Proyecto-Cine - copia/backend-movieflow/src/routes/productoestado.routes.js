const express = require('express');
const router = express.Router();
const productoEstadoCtrl = require('../controllers/productoestado.controller');

router.get('/', productoEstadoCtrl.listarEstadosProducto);

module.exports = router;
