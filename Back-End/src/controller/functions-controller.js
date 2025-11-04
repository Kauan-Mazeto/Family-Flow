import { PrismaClient } from "@prisma/client";
import member_task from "./tasks-controller.js";

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

export async function usuario_atual_id(idUsuario) {

    try {
        const info_member = await prisma.user.findFirst({
            where: {
                name: member_task
            },

            select: {
                id: true
            }
        });
    } catch (err) {
        console.error(err);
    };
};

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
    } catch (err) {
        console.error(err)
    };
};