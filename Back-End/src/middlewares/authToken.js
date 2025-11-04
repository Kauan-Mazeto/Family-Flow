import jwt from "jsonwebtoken";

const JWT_SECRET_KEY = process.env.PASS_HASH;

export function authToken(req, res, next) {
    // console.log('MIDDLEWARE AUTH - Verificando token...');
    // console.log('Cookies recebidos:', req.cookies);
    // console.log('Token específico:', req.cookies.tokenAuth);
    
    const token = req.cookies.tokenAuth;

    if (!token) {
        console.error('AUTH: Token não encontrado nos cookies');
        return res.status(401).json({ mensagem: "Token inválido ou inexistente" });
    };

    try {
        // console.log('AUTH: Decodificando token...');
        const decodedToken = jwt.verify(token, JWT_SECRET_KEY);
        // console.log('AUTH: Token decodificado:', decodedToken);
        
        req.usuario = decodedToken; // anexo de dados do usuário à requisição;
        // console.log('AUTH: Usuário anexado à requisição:', req.usuario);
        
        next();

    } catch (err) {
        // console.error('AUTH: Erro ao verificar token:', err.message);
        return res.status(401).json({ mensagem: "Token inválido ou expirado" });
    };
};
