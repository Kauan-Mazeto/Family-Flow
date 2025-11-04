import { PrismaClient } from '@prisma/client';
import jwt from "jsonwebtoken";
import argon2 from "argon2";

const prisma = new PrismaClient();
const JWT_SECRET_KEY = process.env.PASS_HASH;
// pega o codigo no arquivo .env da "senha" do JWT 


if (!JWT_SECRET_KEY) {
    throw new Error("JWT_SECRET_KEY não foi definido, verifique o .env");
};

export async function cadastrar_usuario(req, res) {
    const {email_usuario, senha_usuario, nome_usuario} = req.body;

    if (!email_usuario || !senha_usuario || !nome_usuario) {
        return res.status(400).json({mensagem: "EMAIL, SENHA e NOME são necessários."});
    }

    try {
        
        const usuarioExistente = await prisma.user.findUnique({
            where: { email: email_usuario }
        });

        if (usuarioExistente) {
            return res.status(409).json({mensagem: "Email já cadastrado."});
        };

        const password_hash = await argon2.hash(senha_usuario);
        // CRIPTOGRAFA A SENHA NO PADRAO(METODO) argon2, isso sera guardado no banco
        // e nao exatamente a senha que foi escrita(guarda a senha criptografada)

        const usuario_temporario = await prisma.user.create({
            data: {
                name: nome_usuario,
                password_hash: password_hash,
                email: email_usuario
            }
        });

        return res.status(201).json({
            mensagem: "Usuário foi cadastrado com sucesso!",
            usuario: {
                id: usuario_temporario.id,
                name: usuario_temporario.name,
                email: usuario_temporario.email
            }
        });

    } catch (err) {
        res.status(500).json({ mensagem: "Erro interno no servidor." });
        console.error(err);
    };
};

export async function login_usuario(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({mensagem: "Email e senha necessários."});
    };

    try {
        const usuario_temporario_retornar = await prisma.user.findUnique({
            where: {
                email: email
            }, 
            select: {
                id: true,
                email: true,
                password_hash: true,
                is_active: true,
                name: true
            }
        });

        // ----------------------------------------------------
        // AQUI VOCE ESTA VERIFICANDO SE ELE ESTA LOGADO E SE ELE ESTA ATIVO, 
        // (PEGA DO BANCO)
        // ----------------------------------------------------

        if (!usuario_temporario_retornar || !usuario_temporario_retornar.is_active) {
            return res.status(401).json({mensagem: "Email ou Senha inválidos."});
        };

        const validar_senha = await argon2.verify(
            usuario_temporario_retornar.password_hash, 
            password
        );

        if (!validar_senha) {
            return res.status(401).json({mensagem: "Email ou Senha inválidos."});
        };

        const token_jwt = jwt.sign({
            id: usuario_temporario_retornar.id, 
            email: usuario_temporario_retornar.email
        }, JWT_SECRET_KEY, {expiresIn: "1h"});

        // ----------------------------------------------------
        // AQUI ESTAMOS CRIANDO UM TOKEN NO PADRAO jsonwebtoken(JWT),
        // PASSANDO O ID E EMAIL DO USUARIO, (PEGANDO DA VARIAVEL QUE ESTA DECLARADA AS INFORMACOES
        // DO BANCO), JUNTA COM A CHAVE JWT (DEFINIDA NO .ENV), COM EXPIRACAO DE 1 HORA.
        // ----------------------------------------------------


        res.cookie('tokenAuth', token_jwt, {
            httpOnly: true, // nao permitir alteracoes a partir de JS externo
            secure: process.env.NODE_ENV === 'development', // mudar qnd for testar para "development"
            maxAge: 60 * 60 * 3000, // tempo que ficara ativo (1hora)
            sameSite: 'lax' // melhor para compatibilidade com Angular 
            // 'strict' significa: o cookie só será enviado se a requisição vier do mesmo site que criou o cookie.
        });

        // ENVIAR POR JSON (O CERTO É POR COOKIE)
        return res.status(200).json({
            mensagem: "Login concluído",
            user: {
                id: usuario_temporario_retornar.id,
                email: usuario_temporario_retornar.email,
                name: usuario_temporario_retornar.name
            }
        });

    } catch (err) {
        res.status(500).json({ mensagem: "Erro interno no servidor." });
        console.error(err);
    };
}

export async function retornar_usuario_atual(req, res) {
    try {
        // req.usuario vem do middleware authToken
        const usuarioAtual = await prisma.user.findUnique({
            where: {
                id: req.usuario.id
            },

            select: {
                id: true,
                is_active: true,
                is_admin: true,
                avatar_url: true,
                created_at: true,
                email: true,
                name: true
            }
        });

        if (!usuarioAtual) {
            return res.status(404).json({mensagem: "Usuário não encontrado."});
        };

        return res.status(200).json({usuarioAtual});

    } catch (err) {
        res.status(500).json({ mensagem: "Erro interno no servidor." });
        console.error(err);
    };
};

export async function logout_usuario(req, res) {
    try {
        res.clearCookie('tokenAuth', {
            httpOnly: true,
            // secure: process.env.NODE_ENV === 'production',
            secure: false,
            sameSite: 'lax'
        });

        return res.status(200).json({mensagem: "Logout realizado com sucesso."});

    } catch (err) {
        res.status(500).json({ mensagem: "Erro interno no servidor." });
        console.error(err);
    };
};

export async function resetar_senha(req, res) {
    try {
        const { senha_atual, nova_senha } = req.body;

        if (!senha_atual || !nova_senha) {
            return res.status(400).json({mensagem: "Senha atual e nova senha são obrigatorias."})
        };

        if (nova_senha.length < 8) {
            return res.status(400).json({mensagem: "Nova senha deve conter 8 caracteres"})
        };

        if (!req.usuario || !req.usuario.id) {
            return res.status(401).json({ error: "Usuário não autenticado" });
        };

        const usuario = await prisma.user.findUnique({
            where: {
                id: req.usuario.id
            }
        });

        // comparando se o que foi digitado em "senha_atual" é igual ao que está armazenado no banco de dados(no banco esta criptografado)
        const senha_valida = await argon2.verify(usuario.password_hash, senha_atual);

        if (!senha_valida) {
            return res.status(401).json({mensagem: "Senha inválida."})
        };

        const password_hash = await argon2.hash(nova_senha);

        await prisma.user.update({
            where: {
                id: req.usuario.id
            },
            data: {
                password_hash: password_hash,
            }
        });

        return res.status(200).json({ mensagem: "Senha alterada com sucesso" });

    } catch (err) {
        res.status(500).json({ mensagem: "Erro interno no servidor." });
        console.error(err); 
    };
};

export default JWT_SECRET_KEY;