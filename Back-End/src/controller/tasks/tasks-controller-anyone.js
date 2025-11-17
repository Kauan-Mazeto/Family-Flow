import { PrismaClient } from '@prisma/client';
import { family_id_task } from '../functions/functions-controller-family.js';
import { usuario_atual_nome } from '../functions/functions-controller-user.js';
import { verifier_date } from '../functions/functions-controller-date.js';

const prisma = new PrismaClient();

export async function update_status(req, res) {
  const id_task = parseInt(req.params.id);
  const { status_task } = req.body;

  if (!id_task || !status_task) {
    return res.status(400).json({ mensagem: "ID da tarefa ou status não informado." });
  };

  try {
    // Busca a tarefa para verificar se é for_all
    const task = await prisma.task.findUnique({ where: { id: id_task } });
    let updateData = { status: status_task.toUpperCase() };
    if (status_task.toUpperCase() === 'CONCLUIDA') {
      updateData['completed_at'] = new Date();
      if (task.for_all) {
        updateData['member_id'] = req.usuario.id;
        updateData['member_name'] = req.usuario.name;
        updateData['for_all'] = false;
      };
    } else if (status_task.toUpperCase() === 'PENDENTE') {
      updateData['completed_at'] = null;
    };
    const updatedTask = await prisma.task.update({
      where: { 
        id: id_task 
    },
      data: updateData
    });

    return res.status(200).json({ mensagem: "Status atualizado com sucesso.", task: updatedTask });

  } catch (err) {
    return res.status(500).json({ mensagem: "Erro ao atualizar status da tarefa.", erro: err.message });
  };
};

// |----------------------------------------------------------------------------------------|
// | as functions abaixo representam das tasks exclusivas do usuario que a criou da familia.|
// |----------------------------------------------------------------------------------------|

export async function create_task_user(req, res) {
    const { desc_task, name_task, priority_task, type_task, date_start, date_end } = req.body;
    // desc_task: descricao da tarefa
    // name_task: nome da tarefa
    // member_task: sempre vai ser o usuario que esta logado
    // priority_task: prioridade da tarefa
    // status_task: status da tarefa
    // type_task: tipo da tarefa(diaria/pontual)

    if (!name_task || !priority_task || !type_task || !date_start || !date_end) {
        return res.status(404).json({ mensagem: "Informações obrigatórias." });
    };

    const id_family = await family_id_task(req.usuario.id);
    const name_active = await usuario_atual_nome(req.usuario.id);
    // Ajusta date_end para o dia seguinte
    const startDate = new Date(date_start);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 1);
    const remaining_days = await verifier_date(date_start, endDate.toISOString().split('T')[0]);
    const priority_upperCase = priority_task.toUpperCase();
    
    try {
        const task_info = await prisma.task.create({
            data: {
                description: desc_task,
                title: name_task,
                member_id: Number(req.usuario.id),
                member_name: name_active.name,
                priority: priority_upperCase,
                status: "PENDENTE",
                type_task: type_task,
                date_start: startDate,
                date_end: endDate,
                days: remaining_days,
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
        return console.error(err);
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
                date_end: true,
                date_start: true,
                days: true
            }
        });

        // IF de jeito diferente por que o findMany retorna um Array.
        if (task_info_private.length === 0) {
            return res.status(404).json({ mensagem: "Nenhuma task encontrada." });
        };

        return res.status(200).json({ mensagem: "Suas tarefas disponiveis: ", task_info_private });

    } catch (err) {
        res.status(500).json({ mensagem: "Erro interno no servidor." });
        return console.error(err);
    };
};

export async function get_daily_user_tasks(req, res) {
    try {
        const userId = Number(req.usuario.id);
        const tasks = await prisma.task.findMany({
            where: {
                type_task: 'diaria',
                is_active: true,
                OR: [
                  { member_id: userId },
                  { for_all: true }
                ]
            },
            select: {
                id: true,
                title: true,
                description: true,
                member_name: true,
                member_id: true,
                priority: true,
                status: true,
                type_task: true,
                date_start: true,
                date_end: true
            }
        });

        return res.status(200).json({ tasks });
    } catch (err) {
        console.error('Erro ao buscar tarefas diárias do usuário:', err);
        return res.status(500).json({ mensagem: 'Erro interno ao buscar tarefas diárias do usuário.' });
    }
}


export async function remove_task_user(req, res) {

    const id_task = parseInt(req.params.id);

    if (!id_task) {
        return res.status(400).json({ mensagem: "ID da task não foi informado." })
    };

    try {
        await prisma.task.delete({
            where: {
                id: id_task
            }
        });

        return res.status(200).json({mensagem: "Task removida.", id_task})

    } catch (err) {
        res.status(500).json({ mensagem: "Erro interno no servidor." });
        return console.error(err);
    }
};

// Retorna tarefas pontuais criadas pelo usuário logado
export async function get_punctual_user_tasks(req, res) {
    try {
        const userId = Number(req.usuario.id);
        const tasks = await prisma.task.findMany({
            where: {
                member_id: userId,
                type_task: 'pontual',
                is_active: true
            },
            
            select: {
                id: true,
                title: true,
                description: true,
                member_name: true,
                member_id: true,
                priority: true,
                status: true,
                type_task: true,
                date_start: true,
                date_end: true
            }
        });
        return res.status(200).json({ tasks });
    } catch (err) {
        console.error('Erro ao buscar tarefas pontuais do usuário:', err);
        return res.status(500).json({ mensagem: 'Erro interno ao buscar tarefas pontuais do usuário.' });
    };
};

export async function update_verifier_days(req, res) {
    try {
        let count = 0;
        const tasks = await prisma.task.findMany({
            where: {
                type_task: 'diaria',
                status: { in: ['PENDENTE', 'PROGRESSO'] },
                is_active: true
            }
        });
        for (const task of tasks) {
            if (!task.date_end) {
                console.warn(`Tarefa ignorada (id: ${task.id}) - date_end ausente.`);
                continue;
            };

            const now = new Date();
            const end = new Date(task.date_end);

            if (isNaN(end)) {
                console.warn(`Tarefa ignorada (id: ${task.id}) - date_end inválida.`);
                continue;
            };

            // Comparar apenas a data (ignorando hora)
            const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
            if (endDate < nowDate) {
                await prisma.task.update({
                    where: { id: task.id },
                    data: { status: 'ATRASADO' }
                });
                count++;
            };
        };
        return res.status(200).json({ mensagem: `Atualização concluída. ${count} tarefas marcadas como atrasadas.` });
    } catch (err) {
        console.error('Erro em update_verifier_days:', err);
        return res.status(500).json({ mensagem: "Erro ao atualizar status das tarefas diárias.", erro: err.message });
    };
};

