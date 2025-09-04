const express = require('express');
const db = require('../services/database');
const booking = require('../services/booking');
const payment = require('../services/payment');
const whatsapp = require('../services/whatsapp');
const ai = require('../services/ai');

const router = express.Router();

// Paystack webhook endpoint
router.post('/payments', async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'];
    const payload = req.body;

     // TEMPORARY: Skip signature verification for testing
     console.log('Paystack webhook received:', JSON.parse(payload.toString()));

    // Verify webhook signature
    // if (!payment.verifyWebhookSignature(payload, signature)) {
    //   console.log('Invalid webhook signature');
    //   return res.status(400).json({ error: 'Invalid signature' });
    // }

    const event = JSON.parse(payload.toString());
    console.log('Paystack webhook event:', event.event, event.data?.reference);

    // Handle charge.success event
    if (event.event === 'charge.success') {
      await handleSuccessfulPayment(event.data);
    }

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Payment webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function handleSuccessfulPayment(paymentData) {
  try {
    const reference = paymentData.reference;
    
    // Find payment record
    const paymentRecord = await db.findPaymentByProviderRef(reference);
    
    if (!paymentRecord) {
      console.error('Payment record not found for reference:', reference);
      return;
    }

    // Verify payment with Paystack
    const verification = await payment.verifyPayment(reference);
    
    if (!verification.success || verification.data.status !== 'success') {
      console.error('Payment verification failed:', verification);
      return;
    }

    console.log('Payment verified successfully:', reference);

    // Update payment status
    await db.updatePaymentStatus(paymentRecord.id, 'paid', reference);

    // Confirm booking
    const confirmedBooking = await booking.confirmBooking(paymentRecord.booking.id);
    
    // Get full booking details for confirmation message
    const fullBooking = await db.getBooking(confirmedBooking.id);
    const formattedTime = booking.formatBookingTime(fullBooking, fullBooking.salon.timezone);

    // Send confirmation message
    const confirmationMessage = ai.generateResponse('booking_confirmed', {
      service: fullBooking.service.name,
      date: formattedTime.date,
      time: formattedTime.time,
      depositAmount: fullBooking.salon.deposit_amount_cents
    });

    await whatsapp.sendMessage(
      fullBooking.customer.whatsapp_number,
      confirmationMessage
    );

    console.log('Booking confirmed and message sent:', fullBooking.id);

  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
}

module.exports = router;