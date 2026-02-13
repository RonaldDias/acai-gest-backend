import { paymentClient } from "../config/mercadopago.js";

export const generatePixPayment = async (valor, descricao, email) => {
  try {
    const body = {
      transaction_amount: valor,
      description: descricao,
      payment_method_id: "pix",
      payer: {
        email: email,
      },
    };

    const payment = await paymentClient.create({ body });

    return {
      id: payment.id,
      status: payment.status,
      qr_code: payment.point_of_interaction.transaction_data.qr_code,
      qr_code_base64:
        payment.point_of_interaction.transaction_data.qr_code_base64,
      ticket_url: payment.point_of_interaction.transaction_data.ticket_url,
    };
  } catch (error) {
    console.error("Erro ao gerar pagamento PIX:", error);
    throw error;
  }
};

export const searchStatusPayment = async (paymentId) => {
  try {
    const payment = await paymentClient.get({ id: paymentId });
    return {
      id: payment.id,
      status: payment.status,
      status_detail: payment.status_detail,
    };
  } catch (error) {
    console.error(("Erro ao buscar status do pagamento:", error));
    throw error;
  }
};
