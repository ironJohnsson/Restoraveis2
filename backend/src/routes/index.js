const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const municipiosRoutes = require('./municipios.routes');
const criteriosRoutes = require('./criterios.routes');
const topsisRoutes = require('./topsis.routes');
const relatoriosRoutes = require('./relatorios.routes');

// Endpoint de verificação de integridade (Health Check)
router.get('/status', (req, res) => {
  res.status(200).json({
    status: 'online',
    plataforma: 'Plataforma de Energia Renovável com TOPSIS',
    versao: '1.0.0',
    normas: ['ISO/IEC 12207', 'ISO/IEC 15504', 'ISO/IEC 25010'],
    timestamp: new Date().toISOString()
  });
});

router.use('/auth', authRoutes);
router.use('/municipios', municipiosRoutes);
router.use('/criterios', criteriosRoutes);
router.use('/topsis', topsisRoutes);
router.use('/relatorios', relatoriosRoutes);

module.exports = router;
