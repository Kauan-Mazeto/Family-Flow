import express from 'express';
import { create_family, delete_family, enter_family, get_user_family, get_family_members, leave_family, promote_to_admin } from '../controller/family-controller.js';
import { authToken } from '../middlewares/authToken.js';
import { authAdminFamily } from '../middlewares/authAdminFamily.js';

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

rotas_family.get('/family/members', authToken, (req, res) => {
    get_family_members(req, res);
});

rotas_family.post('/family/leave', authToken, (req, res) => {
    leave_family(req, res);
});

rotas_family.delete('/family/delete', authToken, authAdminFamily, (req, res) => {
    delete_family(req, res);
});

rotas_family.post('/family/promote-admin', authToken, (req, res) => {
    promote_to_admin(req, res);
});

// Endpoint de teste para verificar autenticação
// rotas_family.get('/family/test-auth', authToken, (req, res) => {
//     console.log('TESTE DE AUTH - Usuário:', req.usuario);
//     res.json({ 
//         mensagem: 'Autenticação funcionando!', 
//         usuario: req.usuario 
//     });
// });

export default rotas_family;