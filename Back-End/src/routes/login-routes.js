import express from 'express';
import { cadastrar_usuario, logout_usuario, resetar_senha, login_usuario, retornar_usuario_atual } from '../controller/login-controller.js';
import { authToken } from '../middlewares/authToken.js'; // já está correto, mas verifique se a pasta é 'Back-End'

const rotas_usuario = express();

rotas_usuario.post('/users/register', (req, res) => {
    cadastrar_usuario(req, res);
});

rotas_usuario.post('/users/login', (req, res) => {
    login_usuario(req, res);
});

rotas_usuario.post('/users/me' ,authToken, (req, res) => {
    retornar_usuario_atual(req, res);
});

rotas_usuario.patch('/users/changePassword' ,authToken, (req, res) => {
    resetar_senha(req, res);
});

rotas_usuario.post('/users/logout', authToken, (req, res) => {
    logout_usuario(req, res);
});

rotas_usuario.post('/users/verify', authToken, (req, res) => {
    res.json({
        mensagem: "Você esta autenticado.",
        usuario: req.usuario
    });
});

export default rotas_usuario;