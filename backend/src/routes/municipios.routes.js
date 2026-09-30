const express = require('express');
const router = express.Router();
const MunicipiosController = require('../controllers/municipios.controller');

router.get('/', MunicipiosController.listar);
router.get('/:id', MunicipiosController.obterPorId);
router.post('/', MunicipiosController.criar);
router.put('/:id', MunicipiosController.atualizar);
router.delete('/:id', MunicipiosController.deletar);

module.exports = router;
