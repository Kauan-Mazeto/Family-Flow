import { PrismaClient } from '@prisma/client';
import { family_id_task, usuario_atual_id } from './functions/functions-controller.js';

const prisma = new PrismaClient();

export async function task_adm(req, res) {

    const { desc_task, name_task, member_task, priority_task, status_task, type_task } = req.body;
    // desc_task: descricao da tarefa
    // name_task: nome da tarefa
    // member_task: membro que ira realizar aquela tarefa
    // priority_task: prioridade da tarefa
    // status_task: status da tarefa
    // type_task: tipo da tarefa(diaria/pontual)

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


export async function remove_task_adm(req, res) {
    const { task_remove } = req.body;
    // isso vem do Front como um checkbox, o que tiver selecionado vem para ca(precisa mandar o titulo da task para o back)

    if (!task_remove) {
        return res.status(400).json({mensagem: "Informe a tarefa que deseja remover."});
    };

    try {
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

        return res.status(200).json({mensagem: "Task removida com sucesso.", verify_task_db});

    } catch (err) {
        res.status(500).json({ mensagem: "Erro interno no servidor." });
        console.error(err);
    };

    
};

// export async function patch_task_adm(req, res) {
//     const { type_task_att, member_name_att, title_att, description_att, status_att, priority_att } = req.body;

//     if (!type_task_att && !member_name_att && !title_att && !description_att && !status_att && !priority_att) {
//         return res.status(400).json({ mensagem: "Nenhum campo foi informado para atualização." });
//     };

//     try {

//         const update_task = await prisma.task.patch({
            
//         });


//     } catch (err) {
//         res.status(500).json({ mensagem: "Erro interno no servidor." });
//         console.error(err);
//     };
// };

export async function task_user_create(req, res) {
    const { desc_task, name_task, priority_task, status_task, type_task } = req.body;
    // desc_task: descricao da tarefa
    // name_task: nome da tarefa
    // member_task: sempre vai ser o usuario que esta logado
    // priority_task: prioridade da tarefa
    // status_task: status da tarefa
    // type_task: tipo da tarefa(diaria/pontual)

    if (!desc_task || !name_task || !priority_task || !status_task || !type_task) {
        return res.status(404).json({ mensagem: "Informações obrigatórias." });
    };

    const id_family = await family_id_task(req.usuario.id);
    const priority_upperCase = priority_task.toUpperCase();
    const status_upperCase = status_task.toUpperCase();

    try {
        const task_info = await prisma.task.create({
            data: {
                description: desc_task,
                title: name_task,
                member_id: Number(req.usuario.id),
                priority: priority_upperCase,
                status: status_upperCase,
                type_task: type_task,
                family: {
                    connect: { 
                        id: Number(id_family) 
                    }
                }
            }
        });

        return res.status(200).json({
            message: "Task exclusiva criada.",
            task_info
        });

    } catch (err) {
        res.status(500).json({ mensagem: "Erro interno no servidor." });
        console.error(err);
    };
};

export async function get_task_user(params) {
    
};
