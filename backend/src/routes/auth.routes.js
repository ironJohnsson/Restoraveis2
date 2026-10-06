const express = require('express');
const rateLimit = require('express-rate-limit');
const AuthController = require('../controllers/auth.controller');
const { requireAuth } = require('../middlewares/auth');
const asyncHandler = require('../utils/asyncHandler');
const config = require('../config/config');

const router = express.Router();

// Limita tentativas de login por IP (proteção contra força bruta)
const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.env === 'test',
  message: { sucesso: false, mensagem: 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.' }
});

router.post('/login', limiteLogin, asyncHandler(AuthController.login));
router.get('/me', requireAuth, asyncHandler(AuthController.me));
router.put('/senha', requireAuth, asyncHandler(AuthController.alterarSenha));

module.exports = router;
