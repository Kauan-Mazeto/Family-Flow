import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function verifierDateExpired(id_task) {
  if (!id_task) {
    return { mensagem: "ID da task não enviado." };
  };

  const task = await prisma.task.findUnique({
    where: { 
        id: Number(id_task) 
    },
  });

  if (!task) {
    return { mensagem: "Task não encontrada." };
  };

  if (task.type_task !== "diaria") {
    return { mensagem: "Task não é do tipo diária, nenhuma verificação necessária." };
  };

  const agora = new Date();
  const dataCriacao = new Date(task.date_start);

  const mudouDia =
    agora.getFullYear() !== dataCriacao.getFullYear() ||
    agora.getMonth() !== dataCriacao.getMonth() ||
    agora.getDate() !== dataCriacao.getDate();

  if (mudouDia) {
    await prisma.task.update({
      where: { 
        id: task.id 
    },
      data: { 
        status: "ATRASADO" 
    },
    });

    return { mensagem: "Task diária atrasada e atualizada." };
  };

  return { mensagem: "Task ainda é válida (mesmo dia)." };
};
