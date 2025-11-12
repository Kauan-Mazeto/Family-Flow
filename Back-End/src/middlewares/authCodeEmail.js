import { codigosRecuperacao } from '../controller/functions/functions-controller-email.js';

export function authCodeEmail(req, res, next) {
    const { codigoDigitado } = req.body;
    const userId = req.usuario.id;  

    if (!userId || !codigoDigitado) {
        return res.status(400).json({ mensagem: "ID do usuário e código são obrigatórios." });
    };

    const dadosCodigo = codigosRecuperacao.get(userId);

    if (!dadosCodigo) {
        return res.status(403).json({ mensagem: "Código inválido ou expirado." });
    };

    const { codigo, expiraEm } = dadosCodigo;

    if (Date.now() > expiraEm) {
        codigosRecuperacao.delete(userId);
        return res.status(403).json({ mensagem: "O código expirou. Solicite um novo." });
    };

    if (codigo !== codigoDigitado) {
        return res.status(403).json({ mensagem: "Código incorreto." });
    };

    next();
};
