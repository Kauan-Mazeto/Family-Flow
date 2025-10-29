import express from 'express';
import { create_family, enter_family } from '../controller/family-controller.js';
import { authToken } from '../middlewares/authToken.js';

const rotas_family = express();

rotas_family.post('/family/create', authToken, (req, res) => {
    create_family(req, res);
});

rotas_family.post('/family/enter', authToken, (req, res) => {
    enter_family(req, res);
});

export default rotas_family;