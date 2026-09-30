const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { requireAuth } = require('../middlewares/auth');

router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.get('/me', requireAuth, AuthController.me);

module.exports = router;
