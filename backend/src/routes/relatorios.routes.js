const express = require('express');
const RelatoriosController = require('../controllers/relatorios.controller');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// UC04 — Gerar Relatório: ator Gestor Público (qualquer usuário autenticado)
router.get('/:id/csv', asyncHandler(RelatoriosController.exportarCSV));
router.get('/:id/pdf', asyncHandler(RelatoriosController.exportarPDF));

module.exports = router;
