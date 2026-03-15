import express from "express";
import passport from "../../config/passport.js";
import { generateToken } from "../../utils/auth.js";

const router = express.Router();

function handleOAuthCallback(req, res, provider) {
  passport.authenticate(provider, { session: false }, (err, result) => {
    if (err || !result) {
      return res.send(`
            <script>
                window.opener.postMessage({ success: false, message: 'Erro na autenticação' }, '*');
                window.close()
                </script>
            `);
    }

    if (result.tipo === "cadastro") {
      return res.send(`
            <script>
                window.opener.postMessage({ success: true, tipo: 'cadastro', email: '${result.email}', nome: '${result.nome}' }, '*');
                window.close();
            </script>
        `);
    }

    const usuario = result.usuario;
    const token = generateToken({
      userId: usuario.id,
      email: usuario.email,
      role: usuario.role,
      empresaId: usuario.empresa_id,
      pontoId: usuario.ponto_id,
    });

    return res.send(`
        <script>
            window.opener.postMessage({
                success: true,
                tipo: 'login',
                token: '${token}',
                user: {
                    id: ${usuario.id},
                    nome: "${usuario.nome}",
                    email: "${usuario.email}",
                    role: "${usuario.role}",
                    empresaId: ${usuario.empresa_id},
                    pontoId: ${usuario.ponto_id},
                    empresa: { nome: "${usuario.empresa_nome}", plano: "${usuario.plano}" }
                }
            }, '*');
            window.close();
        </script>
    `);
  })(req, res);
}

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);

router.get("/google/callback", (req, res) =>
  handleOAuthCallback(req, res, "google"),
);

router.get(
  "/facebook",
  passport.authenticate("facebook", { scope: ["email"], session: false }),
);

router.get("/facebook/callback", (req, res) =>
  handleOAuthCallback(req, res, "facebook"),
);

export default router;
