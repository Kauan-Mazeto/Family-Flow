import { PrismaClient } from '@prisma/client';
import { family_id_task, usuario_atual_id } from './functions-controller.js';


const prisma = new PrismaClient();

export async function task_adm(req, res) {

    const { desc_task, name_task, member_task, priority_task, status_task, type_task } = req.body;

    if (!desc_task || !name_task || !member_task || !priority_task || !status_task || !type_task) {
        return res.status(404).json({ mensagem: "Informações obrigatórias." });
    };

    const id_member = await usuario_atual_id(member_task);

    if (!id_member) {
        return res.status(404).json({ mensagem: "Membro não encontrado." });
    };

    const id_family = await family_id_task(id_member);
    
    try {

        const task_info = await prisma.task.create({
            data: {
                description: desc_task,
                title: name_task,
                // family_id: Number(id_family),
                member_id: Number(id_member),
                member_name: member_task,
                priority: priority_task,
                status: status_task,
                type_task: type_task,
                family: {
                    connect: { 
                        id: Number(id_family) 
                    }
                }
            }
        });

        return res.status(201).json({
                mensagem: "Task criada.",  
                task_info
            }
        );

    } catch (err) {
        res.status(500).json({ mensagem: "Erro interno no servidor." });
        console.error(err);
    };
};


// export async function task_users(req, res) {
    


// };

export async function remove_task_adm(req, res) {
    const { task_remove } = req.body;

    if (!task_remove) {
        return res.status(400).json({mensagem: "Informe a tarefa que deseja remover."});
    };

    const verify_task_db = await prisma.task.findFirst({
        where: {
            title: task_remove
        },

        select: {
            id: true,
            title: true,
            member_name: true,
            description: true,
            status: true,
            priority: true,
        }
    });

    await prisma.task.delete({
        where: {
            id: Number(verify_task_db.id)
        },
    });

    return res.status(200).json({mensagem: "Task removida com sucesso.", verify_task_db})
};