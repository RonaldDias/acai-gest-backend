import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendWelcomeEmail = async (nome, email, pin) => {
  const mailOptions = {
    from: `'Açaí Gest' <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Bem vindo ao Açaí Gest!",
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8B4513;">Olá, ${nome}!</h2>
        <p>Seja bem-vindo ao <strong>Açaí Gest</strong>, seu sistema completo de gestão para pontos de venda de açaí.</p>
        
        <h3 style="color: #8B4513;">Primeiros Passos:</h3>
        <ol>
          <li>Acesse o sistema com seu email e senha</li>
          <li>Configure seu primeiro produto</li>
          <li>Cadastre seus vendedores</li>
          <li>Comece a registrar suas vendas</li>
        </ol>

        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #666;">Seu PIN de acesso é:</p>
          <h1 style="margin: 10px 0; color: #8B4513; letter-spacing: 5px;">${pin}</h1>
          <p style="margin: 0; font-size: 12px; color: #999;">Use este PIN para acessar relatórios e fluxo de caixa. Você pode alterá-lo no seu perfil.</p>
        </div>
        
        <h3 style="color: #8B4513;">Recursos Disponíveis:</h3>
        <ul>
          <li>✅ Controle de estoque automático</li>
          <li>✅ Gestão de vendas e vendedores</li>
          <li>✅ Relatórios de fluxo de caixa</li>
          <li>✅ Gestão de múltiplos pontos (plano TOP)</li>
        </ul>
        
        <p>Se precisar de ajuda, estamos aqui para auxiliar!</p>
        
        <p style="margin-top: 30px;">
          Atenciosamente,<br>
          <strong>Equipe Açaí Gest</strong>
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email de boas vindas enviado para ${email}`);
  } catch (error) {
    console.error("Erro ao enviar email de boas-vindas:", error);
    throw error;
  }
};

export const sendPasswordResetEmail = async (nome, email, token) => {
  const mailOptions = {
    from: `"Açaí Gest" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Recuperação de Senha - Açaí Gest",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8B4513;">Olá, ${nome}!</h2>
        <p>Recebemos uma solicitação para redefinir sua senha no <strong>Açaí Gest</strong>.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #666;">Seu código de verificação é:</p>
          <h1 style="margin: 10px 0; color: #8B4513; letter-spacing: 5px;">${token}</h1>
          <p style="margin: 0; font-size: 12px; color: #999;">Este código expira em 15 minutos</p>
        </div>
        
        <p><strong>⚠️ Importante:</strong></p>
        <ul>
          <li>Não compartilhe este código com ninguém</li>
          <li>Se você não solicitou esta alteração, ignore este email</li>
          <li>Sua senha atual permanecerá válida até que você complete o processo</li>
        </ul>
        
        <p style="margin-top: 30px;">
          Atenciosamente,<br>
          <strong>Equipe Açaí Gest</strong>
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email de recuperação enviado para ${email}`);
  } catch (error) {
    console.error("Erro ao enviar email de recuperação:", error);
    throw error;
  }
};

export const sendPasswordChangedEmail = async (nome, email) => {
  const mailOptions = {
    from: `"Açaí Gest" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Senha Alterada com Sucesso - Açaí Gest",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8B4513;">Olá, ${nome}!</h2>
        <p>Sua senha foi alterada com sucesso no <strong>Açaí Gest</strong>.</p>
        
        <div style="background-color: #e8f5e9; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #2e7d32;">✅ Sua senha foi redefinida</p>
          <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">Data: ${new Date().toLocaleString("pt-BR")}</p>
        </div>
        
        <p><strong>⚠️ Você não fez esta alteração?</strong></p>
        <p>Se você não solicitou esta mudança de senha, entre em contato conosco imediatamente.</p>
        
        <p style="margin-top: 30px;">
          Atenciosamente,<br>
          <strong>Equipe Açaí Gest</strong>
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email de confirmação de alteração enviado para ${email}`);
  } catch (error) {
    console.error("Erro ao enviar email de confirmação:", error);
    throw error;
  }
};

export const sendExpirationReminderEmail = async (nome, email, dueDate, qrCode, qrCodeBase64) => {
  const data = new Date(dueDate).toLocaleDateString("pt-BR");

  const mailOptions = {
    from: `"Açaí Gest" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Sua assinatura vence em 3 dias - Açaí Gest",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8B4513;">Olá, ${nome}!</h2>
        <p>Sua assinatura do <strong>Açaí Gest</strong> vence em <strong>3 dias</strong>, no dia <strong>${data}</strong>.</p>
        
        <div style="background-color: #fff3e0; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #e65100;">⚠️ Renove sua assinatura para não perder o acesso ao sistema.</p>
        </div>

        <div style="text-align: center; margin: 20px 0;">
          <p style="font-size: 14px; color: #333; margin-bottom: 10px;">Escaneie o QR Code abaixo para renovar:</p>
          <img src="data:image/png;base64,${qrCodeBase64}" width="200" height="200" alt="QR Code PIX" style="border: 1px solid #ddd; border-radius: 5px;" />
          <p style="font-size: 11px; color: #666; margin-top: 10px; word-break: break-all; max-width: 400px; margin-left: auto; margin-right: auto;">${qrCode}</p>
        </div>
        
        <p>Se já realizou o pagamento, desconsidere este aviso.</p>
        
        <p style="margin-top: 30px;">
          Atenciosamente,<br>
          <strong>Equipe Açaí Gest</strong>
        </p>
      </div>
      `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email de vencimento enviado para ${email}`);
  } catch (error) {
    console.error("Erro ao enviar email de vencimento:", error);
    throw error;
  }
};
