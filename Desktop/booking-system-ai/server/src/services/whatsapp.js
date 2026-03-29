import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

if (!accountSid || !authToken || !whatsappNumber) {
  console.warn('Warning: Twilio credentials not fully configured. WhatsApp messaging will not work.');
}

const client = twilio(accountSid, authToken);

export async function sendWhatsAppMessage(to, body) {
  try {
    if (!accountSid || !authToken || !whatsappNumber) {
      throw new Error('Twilio credentials not configured');
    }

    // Ensure 'to' has the correct format (add whatsapp: prefix if not present)
    const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    const message = await client.messages.create({
      from: whatsappNumber, // Already has whatsapp: prefix in .env
      to: toNumber,
      body,
    });

    console.log(`WhatsApp message sent to ${to}: ${message.sid}`);
    return message;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
}
