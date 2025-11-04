import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function usuario_atual(idUsuario) {

    try {

        const user_active = await prisma.FamilyMember.findFirst({
            where: {
                user_id: Number(idUsuario)
            },

            select: {
                family_id: true,
                id: true,
                role: true,
            }
        });

        if (!user_active) {
            return { mensagem: "Este usuário não está em nenhuma família." };
        };

        return user_active;


    } catch (err) {
        console.error(err); 
    };
};