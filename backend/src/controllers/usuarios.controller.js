const bcrypt = require('bcryptjs');
const config = require('../config/config');
const Usuario = require('../models/usuario.model');
const HttpError = require('../utils/HttpError');
const v = require('../utils/validacao');

/** RF08 — Gerenciar usuários e perfis de acesso (restrito ao perfil admin). */
class UsuariosController {
  static async listar(req, res) {
    const usuarios = await Usuario.listar();
    res.status(200).json({ sucesso: true, total: usuarios.length, dados: usuarios });
  }

  static async criar(req, res) {
    const corpo = req.body || {};
    const nome = v.texto(corpo.nome, 'nome', { max: 150, obrigatorio: true });
    const email = v.email(corpo.email, { obrigatorio: true });
    const perfil = v.perfil(corpo.perfil) || 'pesquisador';
    const senha = v.senha(corpo.senha);

    if (await Usuario.buscarComSenhaPorEmail(email)) {
      throw new HttpError(409, 'Email já cadastrado no sistema');
    }

    const usuarioId = await Usuario.criar({
      nome,
      email,
      perfil,
      senhaHash: await bcrypt.hash(senha, config.bcryptRounds)
    });

    res.status(201).json({ sucesso: true, mensagem: 'Usuário cadastrado com sucesso', usuarioId });
  }

  static async atualizar(req, res) {
    const id = v.idParam(req.params.id);
    const corpo = req.body || {};

    const atual = await Usuario.buscarPorId(id);
    if (!atual) {
      throw new HttpError(404, 'Usuário não encontrado');
    }

    const nome = v.texto(corpo.nome, 'nome', { max: 150 });
    const email = v.email(corpo.email);
    const perfil = v.perfil(corpo.perfil);
    const senhaHash = corpo.senha !== undefined && corpo.senha !== null && corpo.senha !== ''
      ? await bcrypt.hash(v.senha(corpo.senha), config.bcryptRounds)
      : undefined;

    if (email && email !== atual.email.toLowerCase()) {
      const outro = await Usuario.buscarComSenhaPorEmail(email);
      if (outro && outro.id !== id) {
        throw new HttpError(409, 'Email já cadastrado no sistema');
      }
    }

    if (perfil && perfil !== 'admin' && atual.perfil === 'admin' && (await Usuario.contarAdmins()) <= 1) {
      throw new HttpError(409, 'Não é possível rebaixar o único administrador do sistema');
    }

    await Usuario.atualizar(id, { nome, email, perfil, senhaHash });
    res.status(200).json({ sucesso: true, mensagem: 'Usuário atualizado com sucesso' });
  }

  static async deletar(req, res) {
    const id = v.idParam(req.params.id);

    const usuario = await Usuario.buscarPorId(id);
    if (!usuario) {
      throw new HttpError(404, 'Usuário não encontrado');
    }
    if (id === req.usuario.id) {
      throw new HttpError(409, 'Não é possível excluir a própria conta');
    }
    if (usuario.perfil === 'admin' && (await Usuario.contarAdmins()) <= 1) {
      throw new HttpError(409, 'Não é possível excluir o único administrador do sistema');
    }

    await Usuario.remover(id);
    res.status(200).json({ sucesso: true, mensagem: 'Usuário removido com sucesso' });
  }
}

module.exports = UsuariosController;
