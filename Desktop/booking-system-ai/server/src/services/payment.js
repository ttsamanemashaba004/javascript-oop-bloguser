import axios from 'axios';
import crypto from 'crypto';

const secretKey = process.env.PAYSTACK_SECRET_KEY;

/**
 * Initializes a Paystack payment transaction
 * @param {Object} booking - The booking object
 * @param {Object} client - The client object
 * @param {Object} service - The service object
 * @returns {Promise<string>} The payment authorization URL
 */
export async function generatePaymentLink(booking, client, service) {
  try {
    if (!secretKey) {
      throw new Error('Paystack secret key not configured');
    }

    const baseUrl = process.env.SERVER_URL || 'https://yourdomain.com';

    // Convert deposit amount to kobo (Paystack uses kobo for ZAR)
    const amountInKobo = Math.round(service.deposit_amount * 100);

    const paymentData = {
      email: client.email || `${client.phone_number.replace(/\+/g, '')}@temp.com`,
      amount: amountInKobo,
      currency: 'ZAR',
      reference: `BK-${booking.id}-${Date.now()}`,
      callback_url: `${baseUrl}/webhook/paystack-callback`,
      metadata: {
        booking_id: booking.id,
        client_id: client.id,
        service_name: service.name,
        client_name: client.name || 'Client',
        client_phone: client.phone_number,
      },
    };

    console.log('Initializing Paystack transaction:', paymentData);

    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      paymentData,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.status === true) {
      console.log('Paystack payment link generated:', response.data.data.authorization_url);
      return response.data.data.authorization_url;
    } else {
      throw new Error('Failed to initialize Paystack transaction');
    }
  } catch (error) {
    console.error('Error generating Paystack payment link:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Verifies a Paystack transaction
 * @param {string} reference - The transaction reference
 * @returns {Promise<Object>} The transaction data
 */
export async function verifyPaystackPayment(reference) {
  try {
    if (!secretKey) {
      throw new Error('Paystack secret key not configured');
    }

    console.log('Verifying Paystack payment:', reference);

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      }
    );

    if (response.data.status === true) {
      console.log('Payment verified successfully:', response.data.data);
      return response.data.data;
    } else {
      throw new Error('Payment verification failed');
    }
  } catch (error) {
    console.error('Error verifying Paystack payment:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Validates Paystack webhook signature
 * @param {string} requestBody - The raw request body
 * @param {string} signature - The signature from request headers
 * @returns {boolean} Whether the signature is valid
 */
export function validatePaystackWebhook(requestBody, signature) {
  try {
    if (!secretKey) {
      throw new Error('Paystack secret key not configured');
    }

    const hash = crypto
      .createHmac('sha512', secretKey)
      .update(requestBody)
      .digest('hex');

    return hash === signature;
  } catch (error) {
    console.error('Error validating Paystack webhook:', error);
    return false;
  }
}
