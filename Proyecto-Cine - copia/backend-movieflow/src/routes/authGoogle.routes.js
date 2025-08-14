const express = require('express');
const router = express.Router();
const authGoogleController = require('../controllers/authGoogle.controller');

// Ruta para login con Google
router.post('/', authGoogleController.loginWithGoogle);

module.exports = router;
