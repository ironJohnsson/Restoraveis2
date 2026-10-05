const express = require('express');
const TopsisController = require('../controllers/topsis.controller');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(TopsisController.historico));
router.get('/:id', asyncHandler(TopsisController.obterSimulacao));

module.exports = router;
