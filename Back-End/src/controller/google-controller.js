import express from "express";
import session from "express-session";
import passport from "passport";
import GoogleStrategy from "passport-google-oauth20";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const app = express();

app.use(session({
    secret: process.env.SECRET_PASS,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// Serializa o usuário para a sessão
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Desserializa o usuário da sessão
passport.deserializeUser(async (id, done) => {
    const user = await prisma.user.findUnique({
        where: { id: id }
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
                    is_active: true
                }
            });
        }

        return done(null, user);
    }
));

// Rota pra iniciar login
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Rota pra receber callback do Google
app.get("/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => {
        // Login bem-sucedido, usuário disponível em req.user
        res.redirect("/dashboard");
    }
);
