import transporter from '../config/email.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Armazena códigos em memória: { userId: { codigo, expiraEm } }
const codigosRecuperacao = new Map();

function gerarCodigoVerificacao() {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// ENVIAR CÓDIGO POR EMAIL
export async function enviar_codigo_recuperacao(req, res) {
    const email = req.usuario.email;

    if (!email) {
        return res.status(400).json({ mensagem: "Email é obrigatório." });
    };

    try {
        const usuario = await prisma.user.findUnique({
            where: { 
                email 
            }
        });

        if (!usuario) {
            return res.status(200).json({ 
                mensagem: "Se o email existir, um código foi enviado." 
            });
        };

        const codigo = gerarCodigoVerificacao();
        
        // salvando em memória com expiração de 10 min
        const expiraEm = Date.now() + 10 * 60 * 1000;
        codigosRecuperacao.set(usuario.id, { codigo, expiraEm });

        // remocao automatica após 10 min
        setTimeout(() => {
            codigosRecuperacao.delete(usuario.id);
        }, 10 * 60 * 1000);

        // Enviando email via transporter e sendMail
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Recuperação de Senha - Family Flow',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Recuperação de Senha</h2>
                    <p>Olá, ${usuario.name}!</p>
                    <p>Você solicitou a recuperação de senha.</p>
                    <p>Seu código de verificação é:</p>
                    <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 5px;">${codigo}</h1>
                    <p>Este código expira em 10 minutos.</p>
                    <p><strong>Se você não solicitou, ignore este email.</strong></p>
                </div>
            `
        });

        return res.status(200).json({ 
            mensagem: "Código de recuperação enviado para o email.",
            userId: usuario.id
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ mensagem: "Erro ao enviar código." });
    };
};