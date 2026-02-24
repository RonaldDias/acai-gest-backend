import { Preference } from "mercadopago";
import client, {
  paymentClient,
  subscriptionClient,
} from "../config/mercadopago.js";

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

export const createRecurringSubscription = async (
  email,
  planType,
  planValue,
) => {
  try {
    const body = {
      back_url: "https://cloacal-unprivitely-terence.ngrok-free.dev",
      reason: `Assinatura ${planType} - Açaí Gest`,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: planValue,
        currency_id: "BRL",
        start_date: new Date(Date.now() + 60000).toISOString(),
      },
      payer_email: email,
      status: "pending",
    };

    console.log("Body enviado ao Mercado Pago:", JSON.stringify(body, null, 2)); // ← ADICIONAR ESTA LINHA

    const subscription = await subscriptionClient.create({ body });

    return {
      id: subscription.id,
      status: subscription.status,
      init_point: subscription.init_point,
    };
  } catch (error) {
    console.error("Erro ao criar assinatura recorrente:", error);
    throw error;
  }
};

export const createCheckoutPreference = async (email, planType, planValue) => {
  const preference = new Preference(client);

  const body = {
    items: [
      {
        title: `Assinatura Anual ${planType} - Açaí Gest`,
        quantity: 1,
        currency_id: "BRL",
        unit_price: planValue,
      },
    ],
    payer: { email },
    payment_methods: {
      installments: 12,
    },
    back_urls: {
      success: "https://cloacal-unprivitely-terence.ngrok-free.dev",
      failure: "https://cloacal-unprivitely-terence.ngrok-free.dev",
    },
    auto_return: "approved",
  };

  const result = await preference.create({ body });
  return { id: result.id, init_point: result.init_point };
};
