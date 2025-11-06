import { usuario_atual } from "../controller/functions/functions-controller-user.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function authAdminFamily(req, res, next) {
    try {
        const { code_family } = req.body;
        const user_id = req.usuario.id;

        if (!code_family) {
            return res.status(400).json({ mensagem: "Código familiar é obrigatório." });
        };

        const family_verifier = await prisma.family.findUnique({
            where: {
                family_code: code_family
            },
        });

        if (!family_verifier) {
            return res.status(404).json({ mensagem: "Família não encontrada." });
        };

        const member_verifier = await prisma.familyMember.findFirst({
            where: {
                user_id: user_id,
                family_id: family_verifier.id
            }
        });

        if (!member_verifier) {
            return res.status(403).json({ mensagem: "Você não pertence a esta família." });
        };

        if (member_verifier.role === "ADMIN") {
            req.family = family_verifier;
            return next();
        };

        return res.status(403).json({ mensagem: "Somente o administrador da família pode realizar esta ação." });
    
    } catch (err) {
        console.error("Erro no middleware authAdminFamily:", err);
        return res.status(500).json({mensagem: "Erro interno ao verificar permissões.",});
    };
};

// pegar o id do usuario
// dar um select na tabela familyMember p verificar se é admin
// se for admin, next
// se nao, erro
