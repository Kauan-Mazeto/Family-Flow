import { usuario_atual } from "../controller/functions-controller.js";

export async function authRole(req, res, next) {
    
    try {
        const res_user_active = await usuario_atual(req.usuario.id);

        if (!res_user_active) {
            return res.status(400).json({ mensagem: "Usuário inválido/inexistente." });    
        };

        console.log(res_user_active.role)

        if (res_user_active.role === "ADMIN") {
            return next();
        };

        return res.status(403).json({ mensagem: "Este usuário não tem permissão para essa tarefa." });

    } catch (err) {
        console.error("Erro no middleware authRole:", err);
        return res.status(500).json({mensagem: "Erro interno ao verificar permissões.",});
    };
};
