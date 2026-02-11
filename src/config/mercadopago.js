import { MercadoPagoConfig, Payment, PreApproval } from "mercadopago";
import dotenv from "dotenv";

dotenv.config();

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  options: {
    timeout: 5000,
  },
});

export const paymentClient = new Payment(client);
export const subscriptionClient = new PreApproval(client);

export async function testMercadoPagoConnection() {
  try {
    console.log(
      "Access Token configurado:",
      process.env.MERCADOPAGO_ACCESS_TOKEN ? "Sim" : "Não",
    );
    console.log(
      "Ambiente:",
      process.env.MERCADOPAGO_ACCESS_TOKEN?.startsWith("TEST")
        ? "TESTE"
        : "PRODUÇÃO",
    );
    return true;
  } catch (error) {
    console.error("Erro ao conectar no Mercado Pago:", error.message);
    return false;
  }
}

export default client;
