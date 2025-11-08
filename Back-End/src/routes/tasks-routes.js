import express from 'express';
import { authRole } from '../middlewares/authRole.js';
import { authToken } from '../middlewares/authToken.js';
import { task_adm, remove_task_adm, patch_task_adm } from '../controller/tasks/tasks-controller-admin.js';
import { create_task_user, get_task_user, remove_task_user, update_status } from '../controller/tasks/tasks-controller-anyone.js';
import { authTaskMember } from '../middlewares/authTaskMember.js';

const rotas_tasks = express();

rotas_tasks.post('/tasks/create/daily', authToken, authRole, (req, res) => {
    task_adm(req, res);
});

rotas_tasks.delete('/tasks/ponctual/delete', authToken, authRole, (req, res) => {
    remove_task_adm(req, res);
});

rotas_tasks.delete('/tasks/diaries/delete/:id', authToken, authTaskMember, (req, res) => {
    remove_task_user(req, res);
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

rotas_tasks.patch('/tasks/conclude/:id', authToken, authTaskMember, (req, res) => {
    update_status(req, res)
});

export default rotas_tasks;

