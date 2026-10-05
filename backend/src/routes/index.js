const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middlewares/auth');
const authRoutes = require('./auth.routes');
const usuariosRoutes = require('./usuarios.routes');
const municipiosRoutes = require('./municipios.routes');
const criteriosRoutes = require('./criterios.routes');
const topsisRoutes = require('./topsis.routes');
const simulacoesRoutes = require('./simulacoes.routes');
const relatoriosRoutes = require('./relatorios.routes');
const importacaoRoutes = require('./importacao.routes');

// Endpoint de verificação de integridade (Health Check) — público
router.get('/status', (req, res) => {
  res.status(200).json({
    status: 'online',
    plataforma: 'Plataforma de Energia Renovável com TOPSIS',
    versao: '1.1.0',
    normas: ['ISO/IEC 12207', 'ISO/IEC 15504', 'ISO/IEC 25010'],
    timestamp: new Date().toISOString()
  });
});

// Login é público; /auth/me e /auth/senha exigem token (definido no próprio roteador)
router.use('/auth', authRoutes);

// Todas as rotas abaixo exigem um token JWT válido (RNF04)
router.use(requireAuth);
router.use('/usuarios', usuariosRoutes);
router.use('/municipios', municipiosRoutes);
router.use('/criterios', criteriosRoutes);
router.use('/topsis', topsisRoutes);
router.use('/simulacoes', simulacoesRoutes);
router.use('/relatorios', relatoriosRoutes);
router.use('/importacao', importacaoRoutes);

module.exports = router;
