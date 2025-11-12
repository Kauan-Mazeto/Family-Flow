import express from 'express';
import { cadastrar_usuario, logout_usuario, resetar_senha, login_usuario, retornar_usuario_atual } from '../controller/login-controller.js';
<<<<<<< HEAD
import { authToken } from '../middlewares/authToken.js';
import { enviar_codigo_recuperacao } from '../controller/functions/functions-controller-email.js';
=======
import { authToken } from '../middlewares/authToken.js'; // já está correto, mas verifique se a pasta é 'Back-End'
import { enviar_codigo_recuperacao } from '../controller/functions/functions-controller-email.js';
import { authCodeEmail } from "../middlewares/authCodeEmail.js"
>>>>>>> 51c63e367b1ab82eda7c1676d8096da5c59f8e53

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

<<<<<<< HEAD
rotas_usuario.post('/users/sendCode', authToken, (req, res) => {
    enviar_codigo_recuperacao(req, res);
});

rotas_usuario.patch('/users/changePassword' ,authToken, (req, res) => {
=======
rotas_usuario.patch('/users/changePassword' ,authToken, authCodeEmail, (req, res) => {
>>>>>>> 51c63e367b1ab82eda7c1676d8096da5c59f8e53
    resetar_senha(req, res);
});

rotas_usuario.post('/users/sendCode', authToken, (req, res) => {
    enviar_codigo_recuperacao(req, res);
});

rotas_usuario.post('/users/logout', authToken, (req, res) => {
    logout_usuario(req, res);
});

rotas_usuario.post('/users/verify', authToken, (req, res) => {
    res.json({
        mensagem: "Você está autenticado!",
        usuario: req.usuario
    });
});

export default rotas_usuario;