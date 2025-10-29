import express from 'express';
import 'dotenv/config';
import rotas_usuario from '../src/routes/login-routes.js';
import cookieParser from 'cookie-parser';
// import { dbMiddleware } from '../middlewares/pool-gb-middleware.js';

const api_gestao_familiar = express();
const porta_api_gestao_familiar = 8080;
api_gestao_familiar.use(express.json());
api_gestao_familiar.use(cookieParser()); // enviar por COOKIES
// api_gestao_familiar.use(cors({
//     origin: 'http://localhost:4200/',
//     credentials: true
// }));

api_gestao_familiar.use('/', rotas_usuario)

api_gestao_familiar.listen(porta_api_gestao_familiar, () => {
    console.log(`Servidor rodando na porta ${porta_api_gestao_familiar}`);
});

export default api_gestao_familiar;