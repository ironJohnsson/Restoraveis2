const express = require('express');
const CriteriosController = require('../controllers/criterios.controller');
const { requireRole } = require('../middlewares/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// UC02 — Configurar Critérios TOPSIS: ator Pesquisador (e Administrador)
const podeConfigurar = requireRole('admin', 'pesquisador');

router.get('/', asyncHandler(CriteriosController.listar));
router.post('/', podeConfigurar, asyncHandler(CriteriosController.criar));
router.put('/pesos', podeConfigurar, asyncHandler(CriteriosController.atualizarPesos));
router.put('/:id', podeConfigurar, asyncHandler(CriteriosController.atualizar));
router.delete('/:id', podeConfigurar, asyncHandler(CriteriosController.deletar));

module.exports = router;
