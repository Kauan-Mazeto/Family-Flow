import express from 'express';
import { authRole } from '../middlewares/authRole.js';
// import { authToken } from '../middlewares/authToken.js';

rotas_tasks.post('/tasks/daily', authRole, (req, res) => {

});

const rotas_tasks = express();

export default rotas_tasks;