import express from 'express';
import { authToken } from '../middlewares/authToken.js';
import { authRole } from '../middlewares/authRole.js';
import { 
    set_priority_values, 
    get_priority_values, 
    get_user_mesada, 
    get_mesada_stats
} from '../controller/mesada-controller.js';

const rotas_mesada = express();

// Configurar valores de prioridade (apenas admin)
rotas_mesada.post('/mesada/config', authToken, authRole, (req, res) => {
    set_priority_values(req, res);
});

// Obter valores de prioridade
rotas_mesada.get('/mesada/config', authToken, (req, res) => {
    get_priority_values(req, res);
});

// Obter mesada do usuário
rotas_mesada.get('/mesada/balance', authToken, (req, res) => {
    get_user_mesada(req, res);
});

// Obter estatísticas para gráficos
rotas_mesada.get('/mesada/stats', authToken, (req, res) => {
    get_mesada_stats(req, res);
});

export default rotas_mesada;