const express = require('express');
const MunicipiosController = require('../controllers/municipios.controller');
const { requireRole } = require('../middlewares/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(MunicipiosController.listar));
router.get('/:id', asyncHandler(MunicipiosController.obterPorId));
// UC01 — Cadastrar Município: ator Administrador
router.post('/', requireRole('admin'), asyncHandler(MunicipiosController.criar));
router.put('/:id', requireRole('admin'), asyncHandler(MunicipiosController.atualizar));
router.delete('/:id', requireRole('admin'), asyncHandler(MunicipiosController.deletar));

module.exports = router;
