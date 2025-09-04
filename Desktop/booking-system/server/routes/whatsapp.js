const express = require('express');
const moment = require('moment-timezone');
const db = require('../services/database');
const ai = require('../services/ai');
const booking = require('../services/booking');
const payment = require('../services/payment');
const whatsapp = require('../services/whatsapp');

const router = express.Router();

// WhatsApp webhook endpoint
router.post('/whatsapp', async (req, res) => {
  try {
    // Parse incoming message
    const messageData = whatsapp.parseIncomingMessage(req.body);
    
    if (!messageData) {
      console.log('Invalid message format');
      return res.status(400).json({ error: 'Invalid message format' });
    }

    console.log('Received WhatsApp message:', messageData);

    // Get salon info (MVP: use default salon)
    const salonId = process.env.DEFAULT_SALON_ID;
    const salon = await db.getSalon(salonId);
    
    if (!salon) {
      console.error('Salon not found');
      return res.status(404).json({ error: 'Salon not found' });
    }

    // Find or create customer
    const customer = await db.findOrCreateCustomer(
      salonId, 
      messageData.from
    );

    // Get available services
    const services = await db.getServices(salonId);

    // Process message with AI
    const aiResult = await ai.processMessage(messageData.message, salon, services);
    console.log('AI result:', aiResult);

    // Handle different intents
    let response;
    
    switch (aiResult.intent) {
      case 'greeting':
        response = ai.generateResponse('greeting', { salonName: salon.name });
        break;

      case 'service_list':
        response = ai.generateResponse('service_list', { services });
        break;

      case 'price_query':
        response = ai.generateResponse('price_query', { 
          services, 
          depositAmount: salon.deposit_amount_cents 
        });
        break;

      case 'hours_query':
        response = ai.generateResponse('hours_query');
        break;

      case 'book_new':
        response = await handleBookingRequest(aiResult, salon, customer, services);
        break;

      case 'choice_selection':
        response = await handleChoiceSelection(aiResult, salon, customer, services);
        break;

      case 'cancel':
        response = "I understand you want to cancel. Please call us directly or provide your booking details so I can help you.";
        break;

      case 'reschedule':
        response = "I understand you want to reschedule. Please call us directly or let me know your current booking details and preferred new time.";
        break;

      default:
        response = ai.generateResponse('other');
        break;
    }

    // Send response via WhatsApp
    await whatsapp.sendMessage(messageData.from, response);

    res.status(200).json({ 
      success: true, 
      intent: aiResult.intent,
      response: response.substring(0, 100) + '...'
    });

  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function handleBookingRequest(aiResult, salon, customer, services) {
  try {
    const entities = aiResult.entities;

    // Validate required fields
    if (!entities.service || !entities.date || !entities.time) {
      return "To book an appointment, I need the service, date, and time. For example: 'Book gel nails tomorrow at 3pm'";
    }

    // Find the service
    const service = await db.findServiceByName(salon.id, entities.service);
    if (!service) {
      const serviceNames = services.map(s => s.name).join(', ');
      return `Sorry, I couldn't find "${entities.service}". Available services: ${serviceNames}`;
    }

    // Parse date and time
    const requestedDateTime = moment.tz(`${entities.date} ${entities.time}`, 'YYYY-MM-DD HH:mm', salon.timezone);
    const startTs = requestedDateTime.toISOString();
    const endTs = requestedDateTime.add(service.duration_min, 'minutes').toISOString();

    // Check availability
    const availability = await booking.checkAvailability(salon.id, service.id, startTs, endTs);
    
    if (!availability.available) {
      // Find alternatives
      const alternatives = await booking.findAlternatives(
        salon.id, 
        service.id, 
        entities.date, 
        entities.time, 
        service.duration_min
      );

      return ai.generateResponse('booking_unavailable', {
        requestedTime: `${entities.date} at ${entities.time}`,
        alternatives
      });
    }

    // Create booking hold
    const bookingHold = await booking.createHold(
      salon.id,
      customer.id,
      service.id,
      startTs,
      endTs
    );

    // Create payment record
    const customerEmail = whatsapp.extractCustomerEmail(customer.whatsapp_number, customer.name);
    const paymentResult = await payment.createPaymentLink(
      bookingHold.id,
      salon.deposit_amount_cents / 100, // Convert to rands
      customerEmail,
      customer.name || 'Customer',
      service.name
    );

    if (!paymentResult.success) {
      return "Sorry, there was an issue creating your payment link. Please try again.";
    }

    // Store payment record
    await db.createPayment({
      salon_id: salon.id,
      booking_id: bookingHold.id,
      provider: 'paystack',
      provider_ref: paymentResult.reference,
      amount_cents: salon.deposit_amount_cents,
      currency: 'ZAR',
      status: 'created'
    });

    // Format response
    const formattedTime = booking.formatBookingTime(bookingHold, salon.timezone);
    
    return ai.generateResponse('booking_hold', {
      service: service.name,
      date: formattedTime.date,
      time: formattedTime.time,
      depositAmount: salon.deposit_amount_cents,
      paymentUrl: paymentResult.paymentUrl
    });

  } catch (error) {
    console.error('Booking request error:', error);
    return "Sorry, there was an issue processing your booking. Please try again.";
  }
}

async function handleChoiceSelection(aiResult, salon, customer, services) {
  try {
    const choiceNumber = parseInt(aiResult.entities.choice_number);
    
    if (!choiceNumber || ![1, 2, 3].includes(choiceNumber)) {
      return "Please reply with 1, 2, or 3 to select your preferred time slot.";
    }

    // TODO: In a production system, you'd store alternatives in a database or session
    // For now, we'll simulate getting the alternative based on common booking patterns
    
    // This is a simplified approach - we'll assume the user is booking gel nails
    // and offer standard alternatives based on their choice
    const commonService = services.find(s => s.name.toLowerCase().includes('gel'));
    if (!commonService) {
      return "Sorry, I couldn't find the service. Please send a new booking request with your preferred service, date, and time.";
    }

    // Generate next available slots (this is a simplified version)
    const tomorrow = moment().add(1, 'day');
    const baseTime = moment().set({ hour: 10, minute: 30 }); // Default to 10:30 AM
    
    // Calculate the selected time based on choice (spaced 30 minutes apart)
    const selectedTime = baseTime.clone().add((choiceNumber - 1) * 30, 'minutes');
    const selectedDate = tomorrow.format('YYYY-MM-DD');
    const selectedTimeStr = selectedTime.format('HH:mm');
    
    const startTs = moment(`${selectedDate} ${selectedTimeStr}`, 'YYYY-MM-DD HH:mm').toISOString();
    const endTs = moment(startTs).add(commonService.duration_min, 'minutes').toISOString();

    console.log(`Processing choice ${choiceNumber}: ${selectedDate} at ${selectedTimeStr}`);

    // Check availability for the selected slot
    const availability = await booking.checkAvailability(salon.id, commonService.id, startTs, endTs);
    
    if (!availability.available) {
      return `Sorry, option ${choiceNumber} is no longer available. Please send a new booking request or try: "Book ${commonService.name} ${selectedDate} ${selectedTimeStr}"`;
    }

    // Create booking hold
    const bookingHold = await booking.createHold(
      salon.id,
      customer.id,
      commonService.id,
      startTs,
      endTs
    );

    // Create payment record
    const customerEmail = whatsapp.extractCustomerEmail(customer.whatsapp_number, customer.name);
    const paymentResult = await payment.createPaymentLink(
      bookingHold.id,
      salon.deposit_amount_cents / 100,
      customerEmail,
      customer.name || 'Customer',
      commonService.name
    );

    if (!paymentResult.success) {
      return "Sorry, there was an issue creating your payment link. Please try again.";
    }

    // Store payment record
    await db.createPayment({
      salon_id: salon.id,
      booking_id: bookingHold.id,
      provider: 'paystack',
      provider_ref: paymentResult.reference,
      amount_cents: salon.deposit_amount_cents,
      currency: 'ZAR',
      status: 'created'
    });

    // Format response
    const formattedTime = booking.formatBookingTime(bookingHold, salon.timezone);
    
    return ai.generateResponse('booking_hold', {
      service: commonService.name,
      date: formattedTime.date,
      time: formattedTime.time,
      depositAmount: salon.deposit_amount_cents,
      paymentUrl: paymentResult.paymentUrl
    });

  } catch (error) {
    console.error('Choice selection error:', error);
    return "Sorry, there was an issue processing your selection. Please try booking again with your preferred service, date, and time.";
  }
}

module.exports = router;