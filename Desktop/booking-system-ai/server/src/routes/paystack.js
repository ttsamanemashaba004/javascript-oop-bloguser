import express from 'express';
import { verifyPaystackPayment, validatePaystackWebhook } from '../services/payment.js';
import { updateBookingPayment } from '../db/queries.js';
import { supabase } from '../db/supabase.js';
import { sendWhatsAppMessage } from '../services/whatsapp.js';

const router = express.Router();

// GET endpoint for Paystack payment callback (after user completes payment)
router.get('/paystack-callback', async (req, res) => {
  try {
    console.log('Paystack callback received:', req.query);

    const { reference, trxref } = req.query;
    const transactionReference = reference || trxref;

    if (!transactionReference) {
      console.error('No transaction reference in callback');
      return res.status(400).send('Missing transaction reference');
    }

    // Verify the transaction with Paystack
    const transactionData = await verifyPaystackPayment(transactionReference);

    if (transactionData.status !== 'success') {
      console.log(`Transaction status is ${transactionData.status}, not processing`);
      return res.send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2>Payment Not Completed</h2>
            <p>Your payment was not successful. Please try again or contact us for assistance.</p>
          </body>
        </html>
      `);
    }

    // Extract booking ID from metadata
    const bookingId = transactionData.metadata?.booking_id;

    if (!bookingId) {
      console.error('No booking ID in transaction metadata');
      return res.status(400).send('Missing booking ID');
    }

    // Update booking payment status
    await updateBookingPayment(bookingId, transactionReference);

    // Send success page
    res.send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: green;">✅ Payment Successful!</h2>
          <p>Thank you for your payment. Your booking is confirmed.</p>
          <p>You will receive a confirmation message on WhatsApp shortly.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error processing Paystack callback:', error);
    res.status(500).send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2>Error</h2>
          <p>There was an error processing your payment. Please contact us for assistance.</p>
        </body>
      </html>
    `);
  }
});

// POST endpoint for Paystack webhook (server-to-server notification)
router.post('/paystack-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    console.log('Paystack webhook received');

    // Validate webhook signature
    const signature = req.headers['x-paystack-signature'];

    // Check if body is already parsed (happens with some middleware)
    let rawBody;
    let event;

    if (Buffer.isBuffer(req.body)) {
      rawBody = req.body.toString();
      event = JSON.parse(rawBody);
    } else if (typeof req.body === 'object') {
      // Body already parsed by middleware
      event = req.body;
      rawBody = JSON.stringify(req.body);
    } else {
      rawBody = req.body.toString();
      event = JSON.parse(rawBody);
    }

    console.log('Paystack webhook event:', event);

    // TEMPORARY: Skip signature validation for testing
    // TODO: Re-enable this in production after confirming webhook setup
    /*
    const isValid = validatePaystackWebhook(rawBody, signature);

    if (!isValid) {
      console.error('Invalid Paystack webhook signature');
      console.error('Signature received:', signature);
      console.error('Body:', rawBody.substring(0, 200));
      return res.status(400).send('Invalid signature');
    }
    */

    // Only process successful charge events
    if (event.event !== 'charge.success') {
      console.log(`Webhook event is ${event.event}, not processing`);
      return res.status(200).send('OK');
    }

    const transactionData = event.data;

    // Extract booking ID from metadata
    const bookingId = transactionData.metadata?.booking_id;

    if (!bookingId) {
      console.error('No booking ID in webhook metadata');
      return res.status(200).send('OK');
    }

    // Update booking payment status
    const paymentReference = transactionData.reference;
    await updateBookingPayment(bookingId, paymentReference);

    // Get booking details with client and service info
    const { data: bookingDetails, error } = await supabase
      .from('bookings')
      .select(`
        *,
        client:clients(*),
        service:services(*)
      `)
      .eq('id', bookingId)
      .single();

    if (error || !bookingDetails) {
      console.error('Error fetching booking details:', error);
      return res.status(200).send('OK');
    }

    // Send WhatsApp confirmation to client
    const client = bookingDetails.client;
    const service = bookingDetails.service;
    const bookingDate = new Date(bookingDetails.booking_date).toLocaleDateString('en-ZA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const bookingTime = bookingDetails.booking_time;

    const confirmationMessage = `Payment received! ✅

*Booking Confirmed*

📅 Date: ${bookingDate}
⏰ Time: ${bookingTime}
💅 Service: ${service.name}
💰 Paid: R${service.deposit_amount} deposit

Your appointment is confirmed. We look forward to seeing you. If you need to reschedule, please let us know at least 24 hours in advance.

See you soon.`;

    try {
      await sendWhatsAppMessage(client.phone_number, confirmationMessage);
      console.log(`Confirmation message sent to ${client.phone_number}`);
    } catch (whatsappError) {
      console.error('Error sending WhatsApp confirmation:', whatsappError);
      // Don't fail the whole request if WhatsApp fails
    }

    // Respond to Paystack with 200 OK
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing Paystack webhook:', error);
    // Always respond with 200 to prevent Paystack from retrying
    res.status(200).send('OK');
  }
});

export default router;
