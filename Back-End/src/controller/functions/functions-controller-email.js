import transporter from '../../config/email.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Armazena códigos em memória: { userId: { codigo, expiraEm, timeoutId } }
const codigosRecuperacao = new Map();

function gerarCodigoVerificacao() {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export async function enviar_codigo_recuperacao(req, res) {
    const email = req.usuario.email;

    if (!email) {
        return res.status(400).json({ mensagem: "Email é obrigatório." });
    };

    try {
        const usuario = await prisma.user.findUnique({
            where: { email }
        });

        if (!usuario) {
            return res.status(200).json({
                mensagem: "Se o email existir, um código foi enviado."
            });
        };

        if (codigosRecuperacao.has(usuario.id)) {
            const { timeoutId } = codigosRecuperacao.get(usuario.id);
            clearTimeout(timeoutId);
        };

        const codigo = gerarCodigoVerificacao();
        const expiraEm = Date.now() + 10 * 60 * 1000;

        const timeoutId = setTimeout(() => {
            codigosRecuperacao.delete(usuario.id);
        }, 10 * 60 * 1000);

        codigosRecuperacao.set(usuario.id, { codigo, expiraEm, timeoutId });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Recuperação de Senha - Family Flow',
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f8; padding: 40px; display: flex; justify-content: center;">
                    <div style="background-color: #ffffff; padding: 30px; border-radius: 12px; max-width: 500px; width: 100%; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                        <h2 style="color: #333333; text-align: center;">Recuperação de Senha</h2>
                        <p style="color: #555555; font-size: 16px;">Olá, <strong>${usuario.name}</strong>!</p>
                        <p style="color: #555555; font-size: 16px;">Você solicitou a recuperação de senha para sua conta no Family Flow.</p>
                        <p style="color: #555555; font-size: 16px; margin-top: 20px;">Use o código abaixo para redefinir sua senha:</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <span style="display: inline-block; padding: 15px 25px; font-size: 28px; font-weight: bold; color: #ffffff; background-color: #4CAF50; border-radius: 8px; letter-spacing: 5px;">
                                ${codigo}
                            </span>
                        </div>
                        
                        <p style="color: #777777; font-size: 14px;">Este código expira em <strong>10 minutos</strong>.</p>
                        <p style="color: #777777; font-size: 14px;">Se você não solicitou essa recuperação, apenas ignore este email.</p>
                        
                        <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;">
                        <p style="color: #aaaaaa; font-size: 12px; text-align: center;">Family Flow &copy; ${new Date().getFullYear()}. Todos os direitos reservados.</p>
                    </div>
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
