const express = require('express');
const router = express.Router();
const CriteriosController = require('../controllers/criterios.controller');

router.get('/', CriteriosController.listar);
router.put('/pesos', CriteriosController.atualizarPesos);
router.put('/:id', CriteriosController.atualizar);

module.exports = router;
