const express = require('express');
const ImportacaoController = require('../controllers/importacao.controller');
const { requireRole } = require('../middlewares/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(requireRole('admin'));

router.get('/modelo.csv', asyncHandler(ImportacaoController.modeloCsv));
router.post(
  '/municipios',
  express.text({ type: ['text/csv', 'text/plain'], limit: '5mb' }),
  asyncHandler(ImportacaoController.importarMunicipios)
);
router.get('/ibge/municipios', asyncHandler(ImportacaoController.pesquisarIbge));
router.get('/ibge/municipios/:codigo', asyncHandler(ImportacaoController.municipioIbge));
router.get('/cep/:cep', asyncHandler(ImportacaoController.municipioPorCep));

module.exports = router;
