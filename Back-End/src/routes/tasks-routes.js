import express from 'express';
import { authRole } from '../middlewares/authRole.js';
import { authToken } from '../middlewares/authToken.js';
import { task_adm } from '../controller/tasks-controller.js';

const rotas_tasks = express();

rotas_tasks.post('/tasks/daily', authToken, authRole, (req, res) => {
    task_adm(req, res);
});

export default rotas_tasks;