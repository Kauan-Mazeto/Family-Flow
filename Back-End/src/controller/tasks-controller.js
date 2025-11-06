import { PrismaClient } from '@prisma/client';
import { family_id_task } from './functions/functions-controller-family.js';
import { usuario_atual_id, usuario_atual_nome } from './functions/functions-controller-user.js';

const prisma = new PrismaClient();

// |---------------------------------------------------------------|
// | as functions abaixo representam das tasks de Admin da familia.|
// |---------------------------------------------------------------|

export async function task_adm(req, res) {
    console.log('🔍 TASK_ADM: Dados recebidos:', JSON.stringify(req.body, null, 2));

    const { desc_task, name_task, member_task, priority_task, status_task, type_task } = req.body;
    // desc_task: descricao da tarefa
    // name_task: nome da tarefa
    // member_task: membro que ira realizar aquela tarefa
    // priority_task: prioridade da tarefa
    // status_task: status da tarefa
    // type_task: tipo da tarefa(diaria/pontual)

    if (!name_task || !member_task || !priority_task || !status_task || !type_task) {
        console.log('❌ TASK_ADM: Informações obrigatórias faltando');
        console.log('❌ TASK_ADM: name_task:', name_task);
        console.log('❌ TASK_ADM: member_task:', member_task);
        console.log('❌ TASK_ADM: priority_task:', priority_task);
        console.log('❌ TASK_ADM: status_task:', status_task);
        console.log('❌ TASK_ADM: type_task:', type_task);
        return res.status(400).json({ mensagem: "Informações obrigatórias." });
    };

    console.log('🔍 TASK_ADM: Buscando ID do membro:', member_task);
    let id_member = await usuario_atual_id(member_task);
    console.log('🔍 TASK_ADM: ID do membro encontrado:', id_member);

    // Se não encontrou o membro pelo nome, usar o usuário logado
    if (!id_member) {
        console.log('⚠️ TASK_ADM: Membro não encontrado, usando usuário logado:', req.usuario.id);
        id_member = req.usuario.id;
    };

    console.log('🔍 TASK_ADM: Buscando ID da família para o membro:', id_member);
    const id_family = await family_id_task(id_member);
    console.log('🔍 TASK_ADM: ID da família encontrado:', id_family);
    
    try {

        const task_info = await prisma.task.create({
            data: {
                description: desc_task,
                title: name_task,
                member_name: member_task,
                priority: priority_task,
                status: status_task,
                type_task: type_task,
                family_id: Number(id_family)
            }
        });

        console.log('✅ TASK_ADM: Tarefa criada com sucesso:', task_info);
        return res.status(201).json({
                mensagem: "Task criada.",  
                task: task_info
            }
        );

    } catch (err) {
        console.error('❌ TASK_ADM: Erro ao criar tarefa:', err);
        res.status(500).json({ mensagem: "Erro interno no servidor." });
    };
};

export async function task_users_create(req, res) {
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
                member_name: req.usuario.name || 'Usuário',
                priority: priority_upperCase,
                status: status_upperCase,
                type_task: type_task,
                family_id: Number(id_family)
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

export async function patch_task_adm(req, res) {
    const { type_task_att, member_name_att, title_att, description_att, status_att, priority_att } = req.body;
    const id_task = parseInt(req.params.id);

    if (!type_task_att && !member_name_att && !title_att && !description_att && !status_att && !priority_att) {
        return res.status(400).json({ mensagem: "Nenhum campo foi informado para atualização." });
    };

    if (!id_task) {
        return res.status(404).json({ mensagem: "Informação(id) obrigatório." });
    };

    // if (member_name_att) {
    //     const member_id_att = await prisma.user.findFirst({
    //         where: {
    //             name: member_name_att,

    //         },

    //         select: {

    //         }
    //     });
    // };

    try {

        const current_task = await prisma.task.findUnique({
            where: {
                id: Number(id_task)
            }
        });

        if (!current_task) {
            return res.status(404).json({mensagem: "Task não encontrada."})
        };
        
        let member_id_final = current_task.id;
        let member_name_final = current_task.name;

        const update_task = await prisma.task.update({
            where: {
                id: Number(id_task)
            },

            data: {
                type_task: type_task_att ?? current_task.type_task,
                member_name: member_name_att ?? current_task.member_name,
                title: title_att ?? current_task.title,
                description: description_att ?? current_task.description,
                status: status_att ?? current_task.status,
                priority: priority_att ?? current_task.priority
            }
        });


    } catch (err) {
        res.status(500).json({ mensagem: "Erro interno no servidor." });
        console.error(err);
    };
};


// |----------------------------------------------------------------------------------------|
// | as functions abaixo representam das tasks exclusivas do usuario que a criou da familia.|
// |----------------------------------------------------------------------------------------|



export async function create_task_user(req, res) {
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
    const name_active = await usuario_atual_nome(req.usuario.id);
    const priority_upperCase = priority_task.toUpperCase();
    const status_upperCase = status_task.toUpperCase();

    try {
        const task_info = await prisma.task.create({
            data: {
                description: desc_task,
                title: name_task,
                member_id: Number(req.usuario.id),
                member_name: name_active.name,
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

export async function get_task_user(req, res) {

    try {
        const task_info_private = await prisma.task.findMany({
            where: {
                member_id: Number(req.usuario.id),
                is_active: true
            },

            select: {
                id: true,
                type_task: true,
                member_name: true,
                member_id: true,
                family_id: true,
                title: true,
                description: true,
                status: true,
                priority: true,
            }
        });

        // IF de jeito diferente por que o findMany retorna um Array.
        if (task_info_private.length === 0) {
            return res.status(404).json({ mensagem: "Nenhuma task encontrada." });
        };

        return res.status(200).json({ mensagem: "Suas tarefas disponiveis: ", task_info_private });

    } catch (err) {
        res.status(500).json({ mensagem: "Erro interno no servidor." });
        console.error(err);
    };
};
