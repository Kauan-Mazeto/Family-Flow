import transporter from '../../config/email.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// códigos em memória: { userId: { codigo, expiraEm, timeoutId } }
export const codigosRecuperacao = new Map();

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
            where: { 
                email 
            }
        });

        if (!usuario) {
            return res.status(200).json({mensagem: "Se o email existir, um código foi enviado."});
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
                <div style="
                    font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    background-color: #121212;
                    padding: 40px 20px;
                    color: #e0e0e0;
                    text-align: center;
                    ">
                    <div style="
                        background-color: #1e1e1e;
                        max-width: 520px;
                        margin: auto;
                        border-radius: 12px;
                        padding: 36px 32px;
                        border: 1px solid #2e7d32;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.4);
                    ">
                        <h2 style="color: #66bb6a; font-size: 22px; margin-bottom: 6px;">Recuperação de Senha</h2>
                        <p style="color: #aaa; margin: 0 0 24px 0;">Family Flow</p>

                        <p style="font-size: 15px; color: #ccc; text-align: left;">
                        Olá, <strong>${usuario.name}</strong>,
                        </p>

                        <p style="font-size: 15px; color: #ccc; text-align: left; line-height: 1.6;">
                        Recebemos uma solicitação para redefinir sua senha.<br>
                        Utilize o código abaixo para continuar o processo:
                        </p>

                        <div style="
                        background-color: rgba(76, 175, 80, 0.08);
                        border: 1px solid #4caf50;
                        border-radius: 8px;
                        padding: 18px 0;
                        margin: 30px 0;
                        ">
                        <h1 style="
                            color: #4caf50;
                            font-size: 42px;
                            letter-spacing: 8px;
                            margin: 0;
                            font-weight: 600;
                        ">
                            ${codigo}
                        </h1>
                        </div>

                        <p style="color: #bbb; font-size: 14px;">
                        O código é válido por <strong>10 minutos</strong>.
                        </p>

                        <p style="color: #999; font-size: 13px; margin-top: 28px; line-height: 1.5;">
                        Caso você não tenha solicitado a redefinição, basta ignorar este e-mail.
                        </p>

                        <div style="height: 1px; background-color: #333; margin: 28px 0;"></div>
                            <p style="font-size: 12px; color: #666; margin: 0; line-height: 1.5;">
                            © ${new Date().getFullYear()} Family Flow.<br>
                            Todos os direitos reservados à equipe de desenvolvimento Family Flow.<br>
                            Este e-mail faz parte do sistema automático de recuperação de conta.
                            </p>

                            <div style="display:none!important;opacity:0;height:0;width:0;">
                            ref:familyflow-${Math.random().toString(36).substring(2, 8)}
                        </div>
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
