const axios = require('axios');

class WhatsAppService {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    this.baseURL = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}`;
  }

  async sendMessage(to, message) {
    try {
      // Ensure the 'to' number is in WhatsApp format
      const toWhatsApp = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
      
      const response = await axios.post(`${this.baseURL}/Messages.json`, new URLSearchParams({
        From: this.fromNumber,
        To: toWhatsApp,
        Body: message
      }), {
        auth: {
          username: this.accountSid,
          password: this.authToken
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      console.log(`WhatsApp message sent to ${to}:`, message.substring(0, 100));
      return {
        success: true,
        messageId: response.data.sid
      };
    } catch (error) {
      console.error('WhatsApp send error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to send WhatsApp message'
      };
    }
  }

  parseIncomingMessage(body) {
    try {
      console.log('Raw webhook body:', body); // Debug log
      
      // Handle Twilio webhook format (form data)
      if (body.From && body.Body) {
        return {
          from: body.From.replace('whatsapp:', ''),
          message: body.Body.trim(),
          messageId: body.MessageSid || body.SmsMessageSid,
          timestamp: new Date().toISOString()
        };
      }
  
      // Handle other formats (Meta Cloud API, etc.)
      console.log('Unrecognized message format:', body);
      return null;
    } catch (error) {
      console.error('Error parsing WhatsApp message:', error);
      return null;
    }
  }

  formatPhoneNumber(number) {
    // Remove whatsapp: prefix if present
    let cleaned = number.replace('whatsapp:', '');
    
    // Ensure it starts with +
   if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
}

extractCustomerEmail(phoneNumber, customerName = null) {
    // Clean the phone number
    const cleanNumber = phoneNumber.replace(/[^\d]/g, '');
    
    // Create a valid email format
    if (customerName) {
      const safeName = customerName.toLowerCase()
        .replace(/[^a-z0-9]/g, '') // Remove special characters
        .substring(0, 10); // Limit length
      return `${safeName}.${cleanNumber}@bookingtest.com`;
    }
    
    // Default format with phone number
    return `customer.${cleanNumber}@bookingtest.com`;
  }
}

module.exports = new WhatsAppService();