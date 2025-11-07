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

// |---------------------------------------------------------------|
// | Funções específicas para tarefas diárias da família          |
// |---------------------------------------------------------------|

export async function create_daily_task_admin(req, res) {
    const { desc_task, name_task, member_task, priority_task, status_task = 'PENDENTE', type_task = 'diaria' } = req.body;

    if (!name_task || !member_task || !priority_task) {
        return res.status(400).json({ mensagem: "Informações obrigatórias: name_task, member_task, priority_task." });
    }

    try {
        // Buscar a família do usuário logado (admin)
        const adminFamilyMember = await prisma.familyMember.findFirst({
            where: { user_id: req.usuario.id }
        });

        if (!adminFamilyMember) {
            return res.status(400).json({ mensagem: "Admin não está em nenhuma família." });
        }

        // Buscar o membro da família pelo nome
        const targetMember = await prisma.familyMember.findFirst({
            where: {
                family_id: adminFamilyMember.family_id,
                user: {
                    name: member_task
                }
            },
            include: {
                user: true
            }
        });

        if (!targetMember) {
            return res.status(400).json({ mensagem: `Membro '${member_task}' não encontrado na família.` });
        }

        const task_info = await prisma.task.create({
            data: {
                description: desc_task || 'Sem descrição',
                title: name_task,
                member_name: targetMember.user.name,
                member_id: targetMember.user_id,
                priority: priority_task.toUpperCase(),
                status: status_task.toUpperCase(),
                type_task: type_task,
                family_id: adminFamilyMember.family_id
            }
        });

        return res.status(201).json({
            mensagem: "Tarefa diária criada com sucesso!",
            task: {
                id: task_info.id,
                title: task_info.title,
                description: task_info.description,
                member_name: task_info.member_name,
                priority: task_info.priority,
                status: task_info.status,
                type_task: task_info.type_task
            }
        });

    } catch (err) {
        console.error('❌ Erro ao criar tarefa diária:', err);
        return res.status(500).json({ mensagem: "Erro interno no servidor." });
    }
}

export async function get_family_daily_tasks_controller(req, res) {
    try {
        // Buscar a família do usuário logado
        const familyMember = await prisma.familyMember.findFirst({
            where: { user_id: req.usuario.id }
        });

        if (!familyMember) {
            return res.status(400).json({ mensagem: "Usuário não está em nenhuma família." });
        }

        // Buscar todas as tarefas diárias da família
        const tasks = await prisma.task.findMany({
            where: {
                family_id: familyMember.family_id,
                type_task: 'diaria',
                is_active: true
            },
            orderBy: {
                id: 'desc'
            }
        });

        return res.status(200).json({
            mensagem: "Tarefas diárias carregadas com sucesso!",
            tasks: tasks
        });

    } catch (err) {
        console.error('❌ Erro ao carregar tarefas diárias:', err);
        return res.status(500).json({ mensagem: "Erro interno no servidor." });
    }
}

// Novos controllers para o sistema Kanban
export async function complete_task_controller(req, res) {
    try {
        const taskId = parseInt(req.params.id);
        
        if (!taskId) {
            return res.status(400).json({ mensagem: "ID da tarefa é obrigatório." });
        }

        // Verificar se a tarefa existe e se o usuário tem acesso a ela
        const familyMember = await prisma.familyMember.findFirst({
            where: { user_id: req.usuario.id }
        });

        if (!familyMember) {
            return res.status(400).json({ mensagem: "Usuário não está em nenhuma família." });
        }

        const task = await prisma.task.findFirst({
            where: {
                id: taskId,
                family_id: familyMember.family_id,
                is_active: true
            }
        });

        if (!task) {
            return res.status(404).json({ mensagem: "Tarefa não encontrada." });
        }

        // Verificar se o usuário é o responsável pela tarefa
        if (task.member_id !== req.usuario.id) {
            return res.status(403).json({ 
                mensagem: "Apenas a pessoa responsável pela tarefa pode marcá-la como concluída." 
            });
        }

        // Atualizar a tarefa como concluída
        const updatedTask = await prisma.task.update({
            where: { id: taskId },
            data: {
                status: 'CONCLUIDA'
            }
        });

        console.log('✅ Tarefa marcada como concluída:', updatedTask.title);

        return res.status(200).json({
            mensagem: "Tarefa marcada como concluída!",
            task: updatedTask
        });

    } catch (err) {
        console.error('❌ Erro ao completar tarefa:', err);
        return res.status(500).json({ mensagem: "Erro interno no servidor." });
    }
}

export async function uncomplete_task_controller(req, res) {
    try {
        const taskId = parseInt(req.params.id);
        
        if (!taskId) {
            return res.status(400).json({ mensagem: "ID da tarefa é obrigatório." });
        }

        // Verificar se a tarefa existe e se o usuário tem acesso a ela
        const familyMember = await prisma.familyMember.findFirst({
            where: { user_id: req.usuario.id }
        });

        if (!familyMember) {
            return res.status(400).json({ mensagem: "Usuário não está em nenhuma família." });
        }

        const task = await prisma.task.findFirst({
            where: {
                id: taskId,
                family_id: familyMember.family_id,
                is_active: true
            }
        });

        if (!task) {
            return res.status(404).json({ mensagem: "Tarefa não encontrada." });
        }

        // Verificar se o usuário é o responsável pela tarefa
        if (task.member_id !== req.usuario.id) {
            return res.status(403).json({ 
                mensagem: "Apenas a pessoa responsável pela tarefa pode desmarcá-la." 
            });
        }

        // Atualizar a tarefa como pendente
        const updatedTask = await prisma.task.update({
            where: { id: taskId },
            data: {
                status: 'PENDENTE'
            }
        });

        console.log('🔄 Tarefa desmarcada como concluída:', updatedTask.title);

        return res.status(200).json({
            mensagem: "Tarefa desmarcada como concluída!",
            task: updatedTask
        });

    } catch (err) {
        console.error('❌ Erro ao desmarcar tarefa:', err);
        return res.status(500).json({ mensagem: "Erro interno no servidor." });
    }
}

export async function delete_task_controller(req, res) {
    try {
        const taskId = parseInt(req.params.id);
        
        if (!taskId) {
            return res.status(400).json({ mensagem: "ID da tarefa é obrigatório." });
        }

        // Verificar se o usuário é admin da família
        const familyMember = await prisma.familyMember.findFirst({
            where: { 
                user_id: req.usuario.id,
                role: 'ADMIN'
            }
        });

        if (!familyMember) {
            return res.status(403).json({ mensagem: "Apenas administradores podem deletar tarefas." });
        }

        const task = await prisma.task.findFirst({
            where: {
                id: taskId,
                family_id: familyMember.family_id,
                is_active: true
            }
        });

        if (!task) {
            return res.status(404).json({ mensagem: "Tarefa não encontrada." });
        }

        // Soft delete - marcar como inativo
        const deletedTask = await prisma.task.update({
            where: { id: taskId },
            data: {
                is_active: false
            }
        });

        console.log('🗑️ Tarefa deletada (soft delete):', deletedTask.title);

        return res.status(200).json({
            mensagem: "Tarefa deletada com sucesso!",
            task: deletedTask
        });

    } catch (err) {
        console.error('❌ Erro ao deletar tarefa:', err);
        return res.status(500).json({ mensagem: "Erro interno no servidor." });
    }
}

// Controllers para tarefas pontuais
export async function create_punctual_task_controller(req, res) {
    try {
        const { desc_task, name_task, priority_task, scheduled_date } = req.body;

        if (!name_task || !scheduled_date) {
            return res.status(400).json({ mensagem: "Nome da tarefa e data de agendamento são obrigatórios." });
        }

        // Verificar se o usuário está em uma família
        const familyMember = await prisma.familyMember.findFirst({
            where: { user_id: req.usuario.id }
        });

        if (!familyMember) {
            return res.status(400).json({ mensagem: "Usuário não está em nenhuma família." });
        }

        // Obter dados do usuário
        const user = await prisma.user.findUnique({
            where: { id: req.usuario.id }
        });

        // Criar a tarefa pontual
        const newTask = await prisma.task.create({
            data: {
                type_task: 'PONTUAL',
                title: name_task,
                description: desc_task || null,
                member_id: req.usuario.id,
                member_name: user.name,
                family_id: familyMember.family_id,
                priority: priority_task || 'MEDIA',
                status: 'PENDENTE',
                scheduled_date: new Date(scheduled_date)
            }
        });

        console.log('✅ Tarefa pontual criada:', newTask.title);

        return res.status(201).json({
            mensagem: "Tarefa pontual criada com sucesso!",
            task: newTask
        });

    } catch (err) {
        console.error('❌ Erro ao criar tarefa pontual:', err);
        return res.status(500).json({ mensagem: "Erro interno no servidor." });
    }
}

export async function get_user_punctual_tasks_controller(req, res) {
    try {
        // Verificar se o usuário está em uma família
        const familyMember = await prisma.familyMember.findFirst({
            where: { user_id: req.usuario.id }
        });

        if (!familyMember) {
            return res.status(400).json({ mensagem: "Usuário não está em nenhuma família." });
        }

        // Buscar apenas as tarefas pontuais do próprio usuário
        const tasks = await prisma.task.findMany({
            where: {
                family_id: familyMember.family_id,
                member_id: req.usuario.id, // Apenas tarefas do usuário atual
                type_task: 'PONTUAL',
                is_active: true
            },
            orderBy: [
                { scheduled_date: 'asc' },
                { priority: 'desc' }
            ]
        });

        console.log(`📋 Carregadas ${tasks.length} tarefas pontuais para usuário ${req.usuario.id}`);

        return res.status(200).json({
            mensagem: "Tarefas pontuais carregadas com sucesso!",
            tasks: tasks
        });

    } catch (err) {
        console.error('❌ Erro ao carregar tarefas pontuais:', err);
        return res.status(500).json({ mensagem: "Erro interno no servidor." });
    }
}
