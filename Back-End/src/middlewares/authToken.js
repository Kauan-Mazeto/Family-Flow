import jwt from "jsonwebtoken";

const JWT_SECRET_KEY = process.env.PASS_HASH;

export function authToken(req, res, next) {
    const token = req.cookies.tokenAuth;

    if (!token) {
        return res.status(401).json({ mensagem: "Token inválido ou inexistente" });
    }

    try {
        const decodedToken = jwt.verify(token, JWT_SECRET_KEY);
        req.usuario = decodedToken; // anexo de dados do usuário à requisição
        
        next();

    } catch (err) {
        return res.status(401).json({ mensagem: "Token inválido ou expirado" });
    }
}