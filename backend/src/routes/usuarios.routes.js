const express = require('express');
const UsuariosController = require('../controllers/usuarios.controller');
const { requireRole } = require('../middlewares/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(requireRole('admin'));
router.get('/', asyncHandler(UsuariosController.listar));
router.post('/', asyncHandler(UsuariosController.criar));
router.put('/:id', asyncHandler(UsuariosController.atualizar));
router.delete('/:id', asyncHandler(UsuariosController.deletar));

module.exports = router;
