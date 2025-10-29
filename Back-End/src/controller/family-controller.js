import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function create_family(req, res) {
    const { nome_familia } = req.body;

    if (!req.usuario || !req.usuario.id) {
        return res.status(401).json({mensagem: "Usuário não autenticado."})
    }

    if (!nome_familia) {
        return res.status(400).json({mensagem: "A familia precisa ter um nome."})
    };

    try {
       const generateUniqueCode = async () => {
            let codigo;
            let exists = true;
            
            while (exists) {
                // código de 8 caracteres (A-Z => 0,9), completamente aleatorio
                codigo = Math.random().toString(36).substring(2, 10).toUpperCase();
                
                const familia_existente = await prisma.family.findUnique({
                    where: { family_code: codigo }
                });
                
                // inverte o valor
                exists = !!familia_existente;
            };

            return codigo;
        };

        const codigoFamilia = await generateUniqueCode();

        // criando a família e o membro admin em uma transação(estranho)
        const result = await prisma.$transaction(async (tx) => {
            const familia = await tx.family.create({
                data: {
                    name: nome_familia,
                    family_code: codigoFamilia,
                    created_by: req.usuario.id,
                }
            });

            // criador como admin (esse TX é alguma funcao do proprio prisma especifico para isso)
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
        res.status(500).json({ mensagem: "Erro interno no servidor." });
        console.error(err);
    };
};

export async function enter_family(req, res) {
    const { codigo_familia_input } = req.body;

    if (!codigo_familia_input) {
        return res.status(400).json({mensagem: "Insira o codigo familiar."})
    };

    const codigo_familia = await prisma.family.findUnique({
        where: {
           family_code: codigo_familia_input 
        }
    });

    if (!codigo_familia) {
        return res.status(400).json({mensagem: "Codigo familiar inválido ou inexistente."})
    };

    return res.json({codigo_familia});
};