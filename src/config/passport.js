import passport from "passport";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import pool from "./database.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://acaigest.com.br/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const nome = profile.displayName;

        const result = await pool.query(
          "SELECT u.id, u.nome, u.email, u.role, u.empresa_id, u.ponto_id, e.nome as empresa_nome, e.plano FROM usuarios u INNER JOIN empresas e ON u.empresa_id = e.id WHERE u.email = $1 AND u.ativo = true",
          [email],
        );

        if (result.rows.length > 0) {
          return done(null, { tipo: "login", usuario: result.rows[0] });
        }

        return done(null, { tipo: "cadastro", email, nome });
      } catch (error) {
        return done(done);
      }
    },
  ),
);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: "https://acaigest.com.br/api/auth/facebook/callback",
      profileFields: ["id", "emails", "name", "displayName"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const nome = profile.displayName;

        if (!email) {
          return done(null, false, {
            message: "Email não fornecido pelo Facebook",
          });
        }

        const result = await pool.query(
          "SELECT u.id, u.nome, u.email, u.role, u.empresa_id, u.ponto_id, e.nome as empresa_nome, e.plano FROM usuarios u INNER JOIN empresas e ON u.empresa_id = e.id WHERE u.email = $1 AND u.ativo = true",
          [email],
        );

        if (result.rows.length > 0) {
          return done(null, { tipo: "login", usuario: result.rows[0] });
        }

        return done(null, { tipo: "cadastro", email, nome });
      } catch (error) {
        return done(error);
      }
    },
  ),
);

export default passport;
