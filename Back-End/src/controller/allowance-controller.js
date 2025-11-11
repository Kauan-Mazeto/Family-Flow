import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function values_allowance(req, res) {
    const id_task = parseInt(req.params.id);
    let reward_value = 0;
    
    if (!id_task) {
        return res.status(404).json({ mensagem: "Informação(id) obrigatório." });
    };

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
        reward_value = 
    };


};