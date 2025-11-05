import express from 'express';
import { authRole } from '../middlewares/authRole.js';
import { authToken } from '../middlewares/authToken.js';
import { task_adm, remove_task_adm, task_users_create } from '../controller/tasks-controller.js';

const rotas_tasks = express();

rotas_tasks.post('/tasks/create/daily', authToken, authRole, (req, res) => {
    task_adm(req, res);
});

rotas_tasks.delete('/tasks/delete', authToken, authRole, (req, res) => {
    remove_task_adm(req, res);
});

rotas_tasks.post('/tasks/create/ponctual', authToken, (req, res) => {
    task_users_create(req, res);
});

export default rotas_tasks;