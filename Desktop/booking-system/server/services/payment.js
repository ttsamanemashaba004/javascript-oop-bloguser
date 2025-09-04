const axios = require('axios');
const crypto = require('crypto');

class PaymentService {
  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY;
    this.webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET;
    this.baseURL = 'https://api.paystack.co';
  }

  async initializePayment(amount, email, metadata = {}) {
    try {
      const callbackBase = process.env.FRONTEND_URL || process.env.APP_BASE_URL
      const response = await axios.post(`${this.baseURL}/transaction/initialize`, {
        amount: amount * 100, // Paystack expects amount in kobo
        email: email,
        currency: 'ZAR',
        metadata: metadata,
        callback_url: callbackBase ? `${callbackBase}/payment/callback` : undefined
      }, {
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Paystack initialization error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Payment initialization failed'
      };
    }
  }

  async verifyPayment(reference) {
    try {
      const response = await axios.get(`${this.baseURL}/transaction/verify/${reference}`, {
        headers: {
          'Authorization': `Bearer ${this.secretKey}`
        }
      });

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Paystack verification error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Payment verification failed'
      };
    }
  }

  verifyWebhookSignature(payload, signature) {
    const hash = crypto
      .createHmac('sha512', this.webhookSecret)
      .update(payload, 'utf8')
      .digest('hex');
    
    return hash === signature;
  }

  async createPaymentLink(bookingId, amount, customerEmail, customerName, serviceName) {
    const metadata = {
      booking_id: bookingId,
      customer_name: customerName,
      service_name: serviceName,
      type: 'booking_deposit'
    };

    const result = await this.initializePayment(amount, customerEmail, metadata);
    
    if (result.success) {
      return {
        success: true,
        paymentUrl: result.data.authorization_url,
        reference: result.data.reference
      };
    }

    return result;
  }

  formatAmount(amountInCents) {
    return `R${(amountInCents / 100).toFixed(2)}`;
  }
}

module.exports = new PaymentService();