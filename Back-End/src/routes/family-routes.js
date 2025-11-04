import express from 'express';
import { create_family, enter_family, get_user_family } from '../controller/family-controller.js';
import { authToken } from '../middlewares/authToken.js';

const rotas_family = express();

rotas_family.post('/family/create', authToken, (req, res) => {
    create_family(req, res);
});

rotas_family.post('/family/enter', authToken, (req, res) => {
    enter_family(req, res);
});

rotas_family.get('/family/info', authToken, (req, res) => {
    get_user_family(req, res);
});

// Endpoint de teste para verificar autenticação
rotas_family.get('/family/test-auth', authToken, (req, res) => {
    // console.log('🧪 TESTE DE AUTH - Usuário:', req.usuario);
    res.json({ 
        mensagem: 'Autenticação funcionando!', 
        usuario: req.usuario 
    });
});

export default rotas_family;