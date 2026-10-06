const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const Usuario = require('../models/usuario.model');
const HttpError = require('../utils/HttpError');
const v = require('../utils/validacao');

// Comparado quando o e-mail não existe, para que o tempo de resposta não revele quais contas existem
const HASH_FICTICIO = bcrypt.hashSync('senha-inexistente', config.bcryptRounds);

class AuthController {
  static async login(req, res) {
    const { email, senha } = req.body || {};
    if (typeof email !== 'string' || typeof senha !== 'string' || !email.trim() || !senha) {
      throw new HttpError(400, 'Email e senha são obrigatórios');
    }

    const usuario = await Usuario.buscarComSenhaPorEmail(email.trim());
    const senhaValida = await bcrypt.compare(senha, usuario ? usuario.senha_hash : HASH_FICTICIO);
    if (!usuario || !senhaValida) {
      throw new HttpError(401, 'Credenciais inválidas');
    }

    const payload = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil
    };
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

    res.status(200).json({
      sucesso: true,
      mensagem: 'Login realizado com sucesso',
      token,
      usuario: payload
    });
  }

  static async me(req, res) {
    res.status(200).json({ sucesso: true, usuario: req.usuario });
  }

  /** Troca da própria senha: exige a senha atual. */
  static async alterarSenha(req, res) {
    const { senhaAtual, novaSenha } = req.body || {};
    if (typeof senhaAtual !== 'string' || !senhaAtual) {
      throw new HttpError(400, "O campo 'senhaAtual' é obrigatório");
    }
    v.senha(novaSenha, 'novaSenha');

    const usuario = await Usuario.buscarComSenhaPorId(req.usuario.id);
    if (!(await bcrypt.compare(senhaAtual, usuario.senha_hash))) {
      throw new HttpError(401, 'Senha atual incorreta');
    }

    await Usuario.atualizar(usuario.id, { senhaHash: await bcrypt.hash(novaSenha, config.bcryptRounds) });
    res.status(200).json({ sucesso: true, mensagem: 'Senha alterada com sucesso' });
  }
}

module.exports = AuthController;
