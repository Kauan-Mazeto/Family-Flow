export async function authRole(req, res, next) {
    const res_user_active = await usuario_atual(idUsuario);

    if (!res_user_active) {
        return { mensagem: "Usuário inválido." };
    };

    console.log(res_user_active);
};