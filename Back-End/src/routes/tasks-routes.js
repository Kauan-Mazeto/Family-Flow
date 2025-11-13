import express from 'express';
import { authRole } from '../middlewares/authRole.js';
import { authToken } from '../middlewares/authToken.js';
import { authTaskMember } from '../middlewares/authTaskMember.js';
import { task_adm, remove_task_adm, patch_task_adm } from '../controller/tasks/tasks-controller-admin.js';
import { create_task_user, get_task_user, get_daily_user_tasks, get_punctual_user_tasks, remove_task_user, update_verifier_days, update_status } from '../controller/tasks/tasks-controller-anyone.js';
import { get_daily_family_tasks } from '../controller/tasks/tasks-controller-admin.js';


const rotas_tasks = express();

rotas_tasks.post('/tasks/create/daily', authToken, authRole, (req, res) => {
    task_adm(req, res)
});

rotas_tasks.delete('/tasks/diaries/delete/:id', authToken, authRole, (req, res) => {
    remove_task_adm(req, res);
});

rotas_tasks.delete('/tasks/ponctual/delete/:id', authToken, authTaskMember, (req, res) => {
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

// rota para buscar tarefas diárias atribuídas ao usuário logado
rotas_tasks.get('/tasks/daily/user', authToken, (req, res) => {
    get_daily_user_tasks(req, res);
});

// rota p/ concluir tarefa
rotas_tasks.patch('/tasks/conclude/:id', authToken, authTaskMember, (req, res) => {
    update_status(req, res)
});

// rota para buscar tarefas diárias da família
rotas_tasks.get('/tasks/daily/family', authToken, (req, res) => {
    get_daily_family_tasks(req, res);
});

// rota para buscar tarefas pontuais criadas pelo usuário logado
rotas_tasks.get('/tasks/ponctual/user', authToken, (req, res) => {
    get_punctual_user_tasks(req, res);
});

rotas_tasks.patch('/tasks/automaticUpdate', authToken, (req, res) => [
    update_verifier_days(req, res)
]);


export default rotas_tasks;

