import express from 'express';
import { authRole } from '../middlewares/authRole.js';
import { authToken } from '../middlewares/authToken.js';
// import { authToken } from '../middlewares/authToken.js';

const rotas_tasks = express();

rotas_tasks.post('/tasks/daily', authToken, authRole, (req, res) => {
    
});

export default rotas_tasks;