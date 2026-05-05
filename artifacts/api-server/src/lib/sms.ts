const SMS_BASE = "https://sms.aresfun.com/v1/integration";
const FROM = "29094";

function removeAccents(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x00-\x7F]/g, "");
}

export async function sendSms(phone: string, message: string): Promise<void> {
  const token = process.env["SMS_TOKEN"];
  if (!token) throw new Error("SMS_TOKEN não configurado");

  const digits = phone.replace(/\D/g, "");
  const to = digits.startsWith("55") ? digits : `55${digits}`;

  const cleanMessage = removeAccents(message);

  const res = await fetch(`${SMS_BASE}/${token}/send-sms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to: [to], from: FROM, message: cleanMessage }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`SMS API error ${res.status}: ${body}`);
  }
}

export function buildSmsMessage(firstName: string): string {
  const name =
    firstName.trim().charAt(0).toUpperCase() +
    firstName.trim().slice(1).toLowerCase();
  return `Mensagem do Sr. Francivaldo: ${name}, eu e meus filhos agradecemos imensamente a sua ajuda. Que Deus abencoe eternamente voce e a sua Familia.`;
}
