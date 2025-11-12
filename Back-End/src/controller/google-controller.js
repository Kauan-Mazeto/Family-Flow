import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

// Configuração da sessão (necessária pro Passport)
router.use(session({
    secret: process.env.SECRET_PASS,
    resave: false,
    saveUninitialized: false
}));

router.use(passport.initialize());
router.use(passport.session());

// Serializa o usuário para a sessão
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Desserializa o usuário da sessão
passport.deserializeUser(async (id, done) => {
    const user = await prisma.user.findUnique({
        where: { 
            id: id 
        }
    });
    done(null, user);
});

// Configuração da estratégia Google
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL // nao precisava estar no .env
},
    async (accessToken, refreshToken, profile, done) => {

        // Procura usuário no banco pelo email
        let user = await prisma.user.findUnique({
            where: { email: profile.emails[0].value }
        });

        // Se não existir, cria
        if (!user) {
            user = await prisma.user.create({
                data: {
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    avatar_url: profile.photos[0].value,
                    is_active: true,
                    password_hash: "google_oauth_user"
                }
            });
        }

        return done(null, user);
    }
));

// Rota pra iniciar login
router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Rota pra receber callback do Google
router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    const user = req.user;

    const redirectUrl = `http://localhost:4200/family/option?name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}&avatar=${encodeURIComponent(user.avatar_url)}`;

    res.redirect(redirectUrl);
  }
);



// Rota protegida para testar login
router.get("/dashboard", (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ mensagem: "Usuário não autenticado!" });
    };

    res.json({
        mensagem: "Login bem-sucedido com Google!",
        usuario: req.user
    });
});

// Rota de logout
router.get("/logout", (req, res, next) => {
    req.logout(err => {
        if (err) return next(err);
        res.redirect("/");
    });
});

export default router;
// development: http://localhost:8080/auth/google