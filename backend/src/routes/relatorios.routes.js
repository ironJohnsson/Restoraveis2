const express = require('express');
const router = express.Router();
const RelatoriosController = require('../controllers/relatorios.controller');

router.get('/:id/csv', RelatoriosController.exportarCSV);
router.get('/:id/pdf', RelatoriosController.exportarPDF);

module.exports = router;
