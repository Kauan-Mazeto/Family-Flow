import express from 'express';
import { authToken } from '../middlewares/authToken';
import { values_allowance } from '../controller/allowance-controller';
import { authTaskMember } from '../middlewares/authTaskMember';

const rotas_allowance = express();

rotas_allowance.patch('/allowance/reward', authToken, authTaskMember, (req, res) => {
    values_allowance(req, res);
});

// p mudar a tabela de precos, somente admin

export default rotas_allowance;
