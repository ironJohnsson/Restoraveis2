const express = require('express');
const router = express.Router();
const TopsisController = require('../controllers/topsis.controller');

router.post('/executar', TopsisController.executar);
router.get('/simulacoes', TopsisController.historico);
router.get('/simulacoes/:id', TopsisController.obterSimulacao);

module.exports = router;
