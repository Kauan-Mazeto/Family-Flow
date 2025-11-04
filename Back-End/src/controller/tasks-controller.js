import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function task_adm(req, res) {
    const { desc_task, name_task, member_task, priority_task, status_task, type_task } = req.body;

    if (!desc_task || !name_task || !member_task || !priority_task || !status_task || !type_task) {
        return res.status(404).json({ mensagem: "Informações obrigatórias." });
    };

    try {

        const task_info = await prisma.task.create({
            data: {
                type_task: type_task,
                
            }
        });

    } catch (err) {
        res.status(500).json({ mensagem: "Erro interno no servidor." });
        console.error(err);
    };
};