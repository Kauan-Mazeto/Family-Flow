import transporter from '../../config/email.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// códigos em memória: { userId: { codigo, expiraEm } }
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
                <div style="
                    font-family: Arial, sans-serif; 
                    max-width: 500px; 
                    margin: 0 auto; 
                    padding: 24px; 
                    border: 1px solid #e0e0e0; 
                    border-radius: 12px; 
                    background-color: #f9fafb;
                    color: #333;
                ">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #2e7d32; margin-bottom: 8px;">Recuperação de Senha</h2>
                    <p style="font-size: 14px; color: #666;">Family Flow</p>
                </div>

                <p>Olá, <strong>${usuario.name}</strong>,</p>
                <p>Recebemos uma solicitação para redefinir sua senha.</p>
                <p>Use o código abaixo para continuar o processo de recuperação:</p>

                <div style="
                    text-align: center; 
                    margin: 30px 0;
                    background-color: #e8f5e9; 
                    padding: 16px; 
                    border-radius: 8px; 
                    border: 1px dashed #4CAF50;
                ">
                    <h1 style="
                    color: #2e7d32; 
                    font-size: 36px; 
                    letter-spacing: 6px; 
                    margin: 0;
                    ">
                    ${codigo}
                    </h1>
                </div>

                <p style="text-align: center; color: #555;">
                    Este código expira em <strong>10 minutos</strong>.
                </p>

                <p style="font-size: 14px; color: #777; margin-top: 24px;">
                    Caso você <strong>não tenha solicitado</strong> a recuperação de senha, por favor ignore este e-mail. 
                </p>

                <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;">

                <p style="text-align: center; font-size: 12px; color: #aaa;">
                    © ${new Date().getFullYear()} Family Flow — Todos os direitos reservados.
                </p>
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