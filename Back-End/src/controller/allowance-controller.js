import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function values_allowance(req, res) {
    const id_task = parseInt(req.params.id);
    const { priority_low_value, priority_medium_value, priority_high_value } = req.body;
    let reward_value = 0;
    
    if (!id_task) {
        return res.status(404).json({ mensagem: "Informação(id) obrigatório." });
    };

    if (!priority_low_value || !priority_medium_value || !priority_high_value) {
        return res.status(404).json({ mensagem: "Informações dos valores é obrigatório." });
    };

    try {
        const task_info = await prisma.task.findUnique({
            where: {
                id: id_task,
                is_active: true
            }
        });

        if (!task_info) {
            return res.status(400).json({ mensagem: "Task inexistente ou inválida." });
        };

        if (task_info.status !== "CONCLUIDA") {
            return res.status(403).json({ mensagem: "A tarefa não está concluída." });
        };

        if (task_info.priority === "ALTA") {
            reward_value = priority_high_value;
        } else if (task_info.priority === "MEDIA") {
            reward_value = priority_medium_value;
        } else {
            reward_value = priority_low_value;
        };


        await prisma.task.update({
            where: {
                id: id_task,
            },

            data: {
                reward_value: {
                    increment: reward_value
                }
            }
        });

        await prisma.mesada.upsert({
            where: { 
                family_member: task_info.member_id 
            },

            update: { 
                balance: { 
                    increment: reward_value 
                } 
            },

            create: { 
                family_member: task_info.member_id, balance: reward_value 
            }
        });
        
        return res.status(200).json({
            mensagem: "Task concluída e recompensa adicionada!",
            recompensa: reward_value
        });

    } catch (err) {
        console.error('Erro na mesada:', err.message);
        return res.status(500).json({ mensagem: "Erro interno no servidor."});
    };
};