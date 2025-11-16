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
    }
    if (task_info.status === "ATRASADO" || task_info.status === "ATRASADA") {
      return res.status(403).json({ mensagem: "Tarefa atrasada não gera mesada." });
    }

    if (task_info.priority === "ALTA") {
      reward_value = priority_high_value;
    } else if (task_info.priority === "MEDIA") {
      reward_value = priority_medium_value;
    } else {
      reward_value = priority_low_value;
    };

    const updatedTask = await prisma.task.update({
      where: {
        id: id_task,
      },
      data: {
        reward_value: {
          increment: reward_value
        }
      }
    });

    const updatedMesada = await prisma.mesada.upsert({
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
    return res.status(500).json({ mensagem: "Erro interno no servidor."});
  };
};

export async function getAllowanceSaldo(req, res) {
  try {
    const userId = req.usuario.id;
    const mesada = await prisma.mesada.findUnique({ where: { family_member: userId } });
    const lastTask = await prisma.task.findFirst({
      where: { 
        member_id: userId, 
        type_task: 'diaria', 
        status: 'CONCLUIDA' 
      },

      orderBy: { 
        completed_at: 
        'desc' 
      },

      select: { 
        title: true, 
        reward_value: true 
      }
    });
    res.json({ saldo: mesada?.balance || 0, ultima: lastTask ? { titulo: lastTask.title, valor: lastTask.reward_value } : null });
  } catch (err) {
    res.json({ saldo: 0, ultima: null });
  };
};

export async function getAllowanceHistorico(req, res) {
  try {
    const userId = req.usuario.id;
    const membro = await prisma.familyMember.findFirst({ 
      where: { 
        user_id: userId 
      } 
    });

    const familyId = membro ? membro.family_id : null;
    if (!familyId) {
      return res.json({ historico: [] });
    };

    const filtro = {
      family_id: familyId,
      member_id: membro.id,
      status: 'CONCLUIDA'
    };

    const historico = await prisma.task.findMany({
      where: filtro,

      orderBy: { 
        date_end: 'desc' 
      },

      select: { 
        title: true, 
        reward_value: true, 
        date_end: true 
      }
    });

  return res.json({ historico: historico || [] });

  } catch (err) {
    res.json({ historico: [] });
  };

  try {

    const userId = req.usuario.id;
    const membro = await prisma.familyMember.findFirst({ where: { user_id: userId } });
    const familyId = membro ? membro.family_id : null;

    if (!familyId) {
      return res.json({ historico: [] });
    };

    const filtro = {
      family_id: familyId,
      type_task: { in: 
        ['diaria', 'diária', 'DAILY', 'Diaria', 'Diária'] 
      },
      status: { in: ['CONCLUIDA', 'CONCLUÍDA', 'CONCLUIDO', 'COMPLETED', 'Concluida', 'Concluído'] }
    };

    const historico = await prisma.task.findMany({
      where: filtro,
      orderBy: { date_end: 'desc' },
      select: { title: true, reward_value: true, date_end: true }
    });

    res.json({ historico: historico || [] });

  } catch (err) {
    res.json({ historico: [] });
  };
};

export async function getAllowancePrioridades(req, res) {
  try {
    // Buscar family_id do usuário no banco
    const userId = req.usuario.id;
    const membro = await prisma.familyMember.findFirst({ where: { user_id: userId } });
    const familyId = membro ? membro.family_id : null;

    if (!familyId) {
      return res.status(400).json({ mensagem: 'Família não encontrada para o usuário.' });
    };

    let familia;

    try {
      familia = await prisma.family.findUnique({ 
        where: { 
          id: familyId 
        } 
      });

    } catch (err) {
      return res.status(500).json({ mensagem: 'Erro ao consultar modelo family.', erro: err.message });
    };

    if (!familia) {
      return res.status(404).json({ mensagem: 'Família não existe no banco.' });
    };

    let tabela = await prisma.mesadaConfig.findUnique({ 
      where: { 
        family_id: familyId 
      } 
    });

    if (!tabela) {
      tabela = await prisma.mesadaConfig.create({
        data: {
          family_id: familyId,
          valor_baixa: 1,
          valor_media: 2,
          valor_alta: 3
        }
      });
    };

    // buscando o saldo do membro
    let saldo = 0;
    
    try {
      const mesada = await prisma.mesada.findUnique({ 
        where: { 
          family_member: membro.id 
        } 
      });
      
      saldo = mesada ? mesada.balance : 0;
    } catch (err) {
        return console.log(err)
    };

    res.json({ prioridades: tabela, saldo });

  } catch (err) {
    res.status(500).json({ mensagem: 'Erro ao consultar prioridades.', erro: err.message });
  };
};

export async function getAllowanceMembros(req, res) {
  try {
    const familyId = req.usuario.family_id;
    const membros = await prisma.familyMember.findMany({ 
      where: { 
        amily_id: familyId 
      }, 
      
      select: { 
        id: true, 
        nome: true, 
        role: true 
      } 

    });

    res.json({ membros: membros || [] });
  } catch (err) {
    res.json({ membros: [] });
  };
};

export async function updateAllowancePrioridades(req, res) {
  try {
    const userId = req.usuario.id;
    const membro = await prisma.familyMember.findFirst({
      where: {
        user_id: userId
      }
    });

    const familyId = membro ? membro.family_id : null;

    if (!familyId) {
      return res.status(400).json({ mensagem: 'Família não encontrada para o usuário.' });
    };

    const { prioridades } = req.body;

    if (!prioridades || !Array.isArray(prioridades) || prioridades.length !== 3) {
      return res.status(400).json({ mensagem: 'Prioridades inválidas.' });
    };

    const [baixa, media, alta] = prioridades;
    const tabela = await prisma.mesadaConfig.upsert({
      where: {
        family_id: familyId
      },

      update: {
        valor_baixa: baixa.valor,
        valor_media: media.valor,
        valor_alta: alta.valor
      },

      create: {
        family_id: familyId,
        valor_baixa: baixa.valor,
        valor_media: media.valor,
        valor_alta: alta.valor
      }
    });

    return res.status(200).json({ prioridades: tabela });

  } catch (err) {
    return res.status(500).json({ mensagem: 'Erro ao atualizar prioridades.', erro: err.message });
  };
};