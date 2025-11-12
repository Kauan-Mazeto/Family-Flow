import jwt from "jsonwebtoken";

const JWT_SECRET_KEY = process.env.PASS_HASH;

export function authToken(req, res, next) {
    const token = req.cookies.tokenAuth;

    if (!token) {
        console.error('AUTH: Token não encontrado nos cookies');
        return res.status(401).json({ mensagem: "Token inválido ou inexistente" });
    }

    try {
        const decodedToken = jwt.verify(token, JWT_SECRET_KEY);
        req.usuario = decodedToken;
        next();
    } catch (err) {
        return res.status(401).json({ mensagem: "Token inválido ou expirado" });
    }
}
