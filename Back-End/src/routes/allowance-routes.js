import express from 'express';
import { authToken } from '../middlewares/authToken.js';
import { values_allowance, getAllowanceSaldo, getAllowanceHistorico, getAllowancePrioridades, getAllowanceMembros, updateAllowancePrioridades } from '../controller/allowance-controller.js';
import { authTaskMember } from '../middlewares/authTaskMember.js';

const rotas_allowance = express();

rotas_allowance.patch('/allowance/reward/:id', authToken, authTaskMember, (req, res) => {
    values_allowance(req, res);
});

// rotas para obter informações da mesada
rotas_allowance.get('/allowance/saldo', authToken, (req, res) => {
    getAllowanceSaldo(req, res);
});

// rota para obter histórico de recompensas
rotas_allowance.get('/allowance/historico', authToken, (req, res) => {
    getAllowanceHistorico(req, res);
});

// rota para obter tabela de prioridades
rotas_allowance.get('/allowance/prioridades', authToken, (req, res) => {
    getAllowancePrioridades(req, res);
});
// rota para atualizar tabela de prioridades
rotas_allowance.put('/allowance/prioridades', authToken, (req, res) => {
    updateAllowancePrioridades(req, res);
});

// rota para obter membros da família com mesada
rotas_allowance.get('/allowance/membros', authToken, (req, res) => {
    getAllowanceMembros(req, res);
});

// p mudar a tabela de precos, somente admin

export default rotas_allowance;
