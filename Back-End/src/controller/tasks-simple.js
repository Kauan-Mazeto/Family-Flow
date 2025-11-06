import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function create_daily_task_simple(req, res) {
    console.log('🔍 CREATE_DAILY_TASK: Dados recebidos:', JSON.stringify(req.body, null, 2));
    console.log('🔍 CREATE_DAILY_TASK: Usuário logado:', req.usuario);

    const { desc_task, name_task, member_task, priority_task, status_task, type_task } = req.body;

    // Validação simplificada
    if (!name_task || !priority_task) {
        console.log('❌ CREATE_DAILY_TASK: Campos obrigatórios faltando');
        return res.status(400).json({ mensagem: "Nome e prioridade são obrigatórios." });
    }

    try {
        // Buscar a família do usuário logado
        console.log('🔍 CREATE_DAILY_TASK: Buscando família do usuário:', req.usuario.id);
        const familyMember = await prisma.familyMember.findFirst({
            where: { user_id: req.usuario.id }
        });
        console.log('🔍 CREATE_DAILY_TASK: Família encontrada:', familyMember);

        if (!familyMember) {
            console.log('❌ CREATE_DAILY_TASK: Usuário não está em família');
            return res.status(400).json({ mensagem: "Usuário não está em nenhuma família." });
        }

        // Preparar dados da tarefa
        const taskData = {
            title: name_task,
            description: desc_task || 'Sem descrição',
            member_name: member_task || req.usuario.name || 'Usuário',
            member_id: req.usuario.id,
            priority: priority_task || 'MEDIA',
            status: status_task || 'PENDENTE',
            type_task: type_task || 'diaria',
            family_id: familyMember.family_id
        };
        console.log('🔍 CREATE_DAILY_TASK: Dados preparados para criação:', taskData);

        // Criar a tarefa
        const task_info = await prisma.task.create({
            data: taskData
        });

        console.log('✅ CREATE_DAILY_TASK: Tarefa criada:', task_info);
        console.log('🔍 CREATE_DAILY_TASK: Enviando resposta para frontend...');
        return res.status(201).json({
            mensagem: "Tarefa criada com sucesso!",
            task: task_info
        });

    } catch (err) {
        console.error('❌ CREATE_DAILY_TASK: Erro:', err);
        return res.status(500).json({ mensagem: "Erro interno no servidor." });
    }
}

export async function get_family_daily_tasks(req, res) {


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
        console.error('❌ GET_FAMILY_DAILY_TASKS: Erro:', err);
        return res.status(500).json({ mensagem: "Erro interno no servidor." });
    }
}