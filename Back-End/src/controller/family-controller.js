import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function create_family(req, res) {
    const { nome_familia } = req.body;

    if (!req.usuario || !req.usuario.id) {
        return res.status(401).json({mensagem: "Usuário não autenticado."})
    }

    if (!nome_familia) {
        return res.status(400).json({mensagem: "A familia precisa ter um nome."})
    }

    try {
        // Gerar código único para a família
        const codigoFamilia = Math.random().toString(36).substring(2, 10).toUpperCase();
        
        // Criar família e adicionar usuário como admin em transação
        const result = await prisma.$transaction(async (tx) => {
            const familia = await tx.family.create({
                data: {
                    name: nome_familia,
                    family_code: codigoFamilia,
                    created_by: req.usuario.id,
                }
            });

            await tx.familyMember.create({
                data: {
                    family_id: familia.id,
                    user_id: req.usuario.id,
                    role: 'ADMIN'
                }
            });

            return familia;
        });

        return res.status(201).json({
            mensagem: "Família criada com sucesso!",
            familia: {
                id: result.id,
                nome: result.name,
                codigo: result.family_code
            }
        });

    } catch (err) {
        console.error('Erro ao criar família:', err.message);
        res.status(500).json({ 
            mensagem: "Erro interno no servidor."
        });
    };
};

export async function enter_family(req, res) {
    const { codigo_familia_input } = req.body;

    if (!req.usuario || !req.usuario.id) {
        return res.status(401).json({mensagem: "Usuário não autenticado."})
    }

    if (!codigo_familia_input) {
        return res.status(400).json({mensagem: "Insira o codigo familiar."})
    };

    try {
        const familia = await prisma.family.findUnique({
            where: {
               family_code: codigo_familia_input 
            }
        });

        if (!familia) {
            return res.status(400).json({mensagem: "Codigo familiar inválido ou inexistente."})
        };

        // Verificar se o usuário já é membro da família
        const membroExistente = await prisma.familyMember.findUnique({
            where: {
                family_id_user_id: {
                    family_id: familia.id,
                    user_id: req.usuario.id
                }
            }
        });

        if (membroExistente) {
            return res.status(400).json({mensagem: "Você já é membro desta família."})
        }

        // Adicionar usuário à família como membro
        await prisma.familyMember.create({
            data: {
                family_id: familia.id,
                user_id: req.usuario.id,
                role: 'MEMBER'
            }
        });

        return res.status(200).json({
            mensagem: "Você entrou na família com sucesso!",
            familia: {
                id: familia.id,
                nome: familia.name,
                codigo: familia.family_code
            }
        });

    } catch (err) {
        console.error('Erro ao entrar na família:', err.message);
        res.status(500).json({ mensagem: "Erro interno no servidor." });
    };
};