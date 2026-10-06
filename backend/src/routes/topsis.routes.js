const express = require('express');
const TopsisController = require('../controllers/topsis.controller');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// UC03 — Executar TOPSIS: atores Pesquisador e Gestor (qualquer usuário autenticado)
router.post('/executar', asyncHandler(TopsisController.executar));
// Mantidos por compatibilidade; os caminhos do roteiro são /api/simulacoes
router.get('/simulacoes', asyncHandler(TopsisController.historico));
router.get('/simulacoes/:id', asyncHandler(TopsisController.obterSimulacao));

module.exports = router;
