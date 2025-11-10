import express from 'express';
import { authRole } from '../middlewares/authRole.js';
import { authToken } from '../middlewares/authToken.js';
import { create_daily_task_admin, remove_task_adm, patch_task_adm, get_family_daily_tasks_controller, complete_task_controller, uncomplete_task_controller, create_punctual_task_controller, get_user_punctual_tasks_controller } from '../controller/tasks/tasks-controller-admin.js';
import { create_task_user, get_task_user, remove_task_user, update_status } from '../controller/tasks/tasks-controller-anyone.js';
import { authTaskMember } from '../middlewares/authTaskMember.js';

const rotas_tasks = express();

rotas_tasks.post('/tasks/create/daily', authToken, authRole, (req, res) => {
    create_daily_task_admin(req, res);
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

// Novas rotas para tarefas pontuais (sistema Kanban)
rotas_tasks.post('/tasks/create/punctual', authToken, (req, res) => {
    create_punctual_task_controller(req, res);
});

rotas_tasks.get('/tasks/punctual/user', authToken, (req, res) => {
    get_user_punctual_tasks_controller(req, res);
});

rotas_tasks.get('/tasks/info', authToken, (req, res) => {
    get_task_user(req, res);
});

// rota p/ concluir tarefa
rotas_tasks.patch('/tasks/conclude/:id', authToken, authTaskMember, (req, res) => {
    update_status(req, res)
});

rotas_tasks.get('/tasks/daily/family', authToken, (req, res) => {
    get_family_daily_tasks_controller(req, res);
});


rotas_tasks.patch('/tasks/:id/uncomplete', authToken, (req, res) => {
    uncomplete_task_controller(req, res);
});

export default rotas_tasks;

