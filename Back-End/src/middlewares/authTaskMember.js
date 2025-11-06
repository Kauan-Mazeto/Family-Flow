import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function authTaskMember(req, res, next) {
    const id_task = parseInt(req.params.id);
    const id_user = parseInt(req.usuario.id);

    if (!id_task) {
        return res.status(400).json({mensagem: "ID da task não foi informado."})
    };

    if (!id_user) {
        return res.status(400).json({ mensagem: "ID do usuário não foi informado." })
    };

    try {

        const task_referent_id = await prisma.task.findUnique({
            where: {
                id: id_task
            }
        });

        if (!task_referent_id) {
            return res.status(404).json({ mensagem: "Task inexistente ou inválida." })
        };

        if (task_referent_id.member_id === id_user) {
            return next();
        };

        return res.status(403).json({ mensagem: "Somente o criador dessa task pode realizar essa ação." });

    } catch (err) {
        console.error("Erro no middleware authTaskMember:", err);
        return res.status(500).json({ mensagem: "Erro interno ao verificar permissões.", });
    };
};