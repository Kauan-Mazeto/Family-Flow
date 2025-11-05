import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function family_id_task(idUsuario) {
    
    try {
        const info_family = await prisma.FamilyMember.findFirst({
            where: {
                user_id: idUsuario
            },

            select: {
                family_id: true
            }
        });

        return info_family?.family_id || null;

    } catch (err) {
        console.error(err)
    };
};