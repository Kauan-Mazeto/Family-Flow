import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function create_family(req, res) {
    const { nome_familia } = req.body;
    // pegando do body o NOME da familia.

    if (!req.usuario || !req.usuario.id) {
        return res.status(401).json({mensagem: "Usuário não autenticado."});
    };

    if (!nome_familia) {
        return res.status(400).json({mensagem: "A familia precisa ter um nome."});
    };

    const verify_family_member = await prisma.familyMember.findFirst({
        where: {
            user_id: req.usuario.id
        }
    });

    if (verify_family_member) {
        return res.status(409).json({mensagem: "Este Usuário já está cadastrado numa familia."})
    };


    try {
        const codigoFamilia = Math.random().toString(36).substring(2, 10).toUpperCase();
        
        // Criar família e adicionar usuário como admin em transação(estranho)
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
                name_family: result.name,
                code_family: result.family_code
            }
        });

    } catch (err) {
        console.error('Erro ao criar família:', err.message);
        res.status(500).json({ 
            mensagem: "Erro interno no servidor."
        });
    };
};

// export async function verify_family(req, res) {

//     try {
//         const { codigo_familia_input } = req.body;

//         if (!codigo_familia_input) {
//             return res.status(400).json({mensagem: "Insira o codigo familiar."})
//         };

//         const codigo_familia = await prisma.family.findUnique({
//             where: {
//                 family_code: codigo_familia_input 
//             }
//         });

//         if (!codigo_familia) {
//             return res.status(400).json({mensagem: "Codigo familiar inválido ou inexistente."})
//         };

//         return res.status(200).json({
//             mensagem: "Familia encontrada: ",
//             familia: {
//                 id: codigo_familia.id,
//                 name: codigo_familia.name,
//                 code_find: codigo_familia.family_code,
//                 created_user: codigo_familia.created_by
//             }
//         });
//     } catch(err) {
//         res.status(500).json({ mensagem: "Erro interno no servidor." });
//         console.error(err);
//     };
    
// };

export async function enter_family(req, res) {
    
    const { codigo_familia_input } = req.body;

    if (!req.usuario || !req.usuario.id) {
        return res.status(401).json({mensagem: "Usuário não autenticado."});
    };

    if (!codigo_familia_input) {
        return res.status(400).json({mensagem: "Insira o codigo familiar."});
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
        };

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

export async function get_user_family(req, res) {
    
    if (!req.usuario || !req.usuario.id) {
        return res.status(401).json({mensagem: "Usuário não autenticado."})
    };

    try {
        const membroFamilia = await prisma.familyMember.findFirst({
            where: {
                user_id: req.usuario.id
            },
            include: {
                family: true
            }
        });

        if (!membroFamilia) {
            return res.status(404).json({mensagem: "Usuário não está em nenhuma família."});
        };

        return res.status(200).json({
            familia: {
                id: membroFamilia.family.id,
                nome: membroFamilia.family.name,
                codigo: membroFamilia.family.family_code,
                role: membroFamilia.role
            }
        });

    } catch (err) {
        console.error('Erro ao buscar família do usuário:', err.message);
        res.status(500).json({ mensagem: "Erro interno no servidor." });
    };
};

export async function get_family_members(req, res) {
    
    if (!req.usuario || !req.usuario.id) {
        return res.status(401).json({mensagem: "Usuário não autenticado."})
    };

    try {
        // Primeiro, encontra a família do usuário
        const membroFamilia = await prisma.familyMember.findFirst({
            where: {
                user_id: req.usuario.id
            }
        });

        if (!membroFamilia) {
            return res.status(404).json({mensagem: "Usuário não está em nenhuma família."});
        };

        // Busca todos os membros da família
        const membros = await prisma.familyMember.findMany({
            where: {
                family_id: membroFamilia.family_id
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        is_admin: true
                    }
                }
            }
        });

        const membrosFormatados = membros.map(membro => ({
            id: membro.user.id,
            name: membro.user.name,
            email: membro.user.email,
            role: membro.role,
            is_admin: membro.user.is_admin
        }));

        return res.status(200).json({
            membros: membrosFormatados
        });

    } catch (err) {
        console.error('Erro ao buscar membros da família:', err.message);
        res.status(500).json({ mensagem: "Erro interno no servidor." });
    };
};

export async function leave_family(req, res) {
    if (!req.usuario || !req.usuario.id) {
        return res.status(401).json({mensagem: "Usuário não autenticado."});
    }

    try {
        // Verificar se o usuário está em uma família
        const familyMember = await prisma.familyMember.findFirst({
            where: {
                user_id: req.usuario.id
            },
            include: {
                family: true
            }
        });

        if (!familyMember) {
            return res.status(400).json({mensagem: "Você não está em nenhuma família."});
        }

        // Verificar se é admin e se há outros membros
        if (familyMember.role === 'ADMIN') {
            const otherMembers = await prisma.familyMember.count({
                where: {
                    family_id: familyMember.family_id,
                    user_id: { not: req.usuario.id }
                }
            });

            if (otherMembers > 0) {
                return res.status(400).json({
                    mensagem: "Como administrador, você deve transferir a administração ou excluir a família antes de sair."
                });
            }
        }

        // Remover o usuário da família
        await prisma.familyMember.delete({
            where: {
                id: familyMember.id
            }
        });

        // Se era o último membro (admin), deletar a família também
        if (familyMember.role === 'ADMIN') {
            await prisma.family.delete({
                where: {
                    id: familyMember.family_id
                }
            });
        }

        return res.status(200).json({mensagem: "Você saiu da família com sucesso."});

    } catch (err) {
        console.error('Erro ao sair da família:', err);
        return res.status(500).json({mensagem: "Erro interno no servidor."});
    }
}

export async function delete_family(req, res) {

    await prisma.family.delete({
        where: {
            family_code: code_family
        }
    });

    return res.status(200).json({mensagem: "Familia excluida."});

};