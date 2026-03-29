import express from 'express';
import { handleBookingFlow } from '../services/booking.js';

const router = express.Router();

// Helper function to escape XML special characters
function escapeXml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// POST endpoint for receiving WhatsApp messages from Twilio
router.post('/whatsapp', async (req, res) => {
  console.log('Webhook hit:', req.body);
  try {
    const { From, Body, ProfileName } = req.body;

    // Extract phone number (remove 'whatsapp:' prefix)
    const phoneNumber = From.replace('whatsapp:', '');
    const messageBody = Body;
    const profileName = ProfileName || null;

    console.log(`Received message from ${phoneNumber} (${profileName}): ${messageBody}`);

    // Process the message through the booking flow
    const responseMessage = await handleBookingFlow(phoneNumber, messageBody, profileName);

    // Respond to Twilio with TwiML
    const escapedMessage = escapeXml(responseMessage);
    res.set('Content-Type', 'text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapedMessage}</Message></Response>`);
  } catch (error) {
    console.error('Error in WhatsApp webhook:', error);

    // Send error message via TwiML
    const errorMessage = escapeXml("Sorry, I'm having trouble right now. Please try again in a moment.");
    res.set('Content-Type', 'text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${errorMessage}</Message></Response>`);
  }
});

// GET endpoint for Twilio webhook verification
router.get('/whatsapp', (req, res) => {
  console.log('Twilio webhook verification request received');
  res.status(200).send('Webhook is active');
});

export default router;
