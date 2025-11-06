import express from 'express';
import { authRole } from '../middlewares/authRole.js';
import { authToken } from '../middlewares/authToken.js';
import { task_adm, remove_task_adm, create_task_user, get_task_user, patch_task_adm } from '../controller/tasks-controller.js';

const rotas_tasks = express();

rotas_tasks.post('/tasks/create/daily', authToken, authRole, (req, res) => {
    task_adm(req, res);
});

rotas_tasks.delete('/tasks/delete', authToken, authRole, (req, res) => {
    remove_task_adm(req, res);
});
    
rotas_tasks.patch('/tasks/update/:id', authToken, (req, res) => {
    patch_task_adm(req, res);
});

rotas_tasks.post('/tasks/create/ponctual', authToken, (req, res) => {
    create_task_user(req, res);
});

rotas_tasks.get('/tasks/info', authToken, (req, res) => {
    get_task_user(req, res);
});

export default rotas_tasks;