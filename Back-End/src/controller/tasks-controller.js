import { PrismaClient } from '@prisma/client';
import { family_id_task, usuario_atual_id } from './functions-controller';

const prisma = new PrismaClient();
const id_member = usuario_atual_id(req.usuario.id);
const id_family = family_id_task(req.usuario.id);

export async function task_adm(req, res) {
    const { desc_task, name_task, member_task, priority_task, status_task, type_task } = req.body;

    if (!desc_task || !name_task || !member_task || !priority_task || !status_task || !type_task) {
        return res.status(404).json({ mensagem: "Informações obrigatórias." });
    };

    try {

        const task_info = await prisma.task.create({
            data: {
                description: desc_task,
                title: name_task,
                family_id: id_family,
                member_id: id_member,
                member_name: member_task,
                priority: priority_task,
                status: status_task,
                type_task: type_task
            }
        });

    } catch (err) {
        res.status(500).json({ mensagem: "Erro interno no servidor." });
        console.error(err);
    };
};

export default member_task;
