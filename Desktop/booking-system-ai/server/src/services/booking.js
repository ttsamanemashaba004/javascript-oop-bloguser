import { findOrCreateClient, saveMessage, getConversationHistory, createBooking, getBookingsByDate, getServices, updateClientName, clearConversationHistory, getClientPendingBookings } from '../db/queries.js';
import { processMessage, continueWithToolResult } from './ai.js';
import { generatePaymentLink } from './payment.js';

async function handleToolCall(tool, input, client) {
  // Handle resend_payment_link tool
  if (tool === 'resend_payment_link') {
    const { booking_id } = input;

    // Get the booking details
    const { supabase } = await import('../db/supabase.js');
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        service:services(*)
      `)
      .eq('id', booking_id)
      .eq('client_id', client.id) // Security: ensure booking belongs to this client
      .single();

    if (bookingError || !booking) {
      return {
        success: false,
        error: 'Booking not found or does not belong to you',
      };
    }

    // Check if booking is still pending and within timeout
    const minutesSinceCreation = (new Date() - new Date(booking.created_at)) / (1000 * 60);
    if (minutesSinceCreation >= 15) {
      return {
        success: false,
        error: 'This booking has expired. Please create a new booking.',
      };
    }

    if (booking.deposit_paid) {
      return {
        success: false,
        error: 'This booking has already been paid for',
      };
    }

    // Generate new payment link
    const paymentLink = await generatePaymentLink(booking, client, booking.service);

    return {
      success: true,
      booking_id: booking.id,
      service: booking.service.name,
      date: booking.booking_date,
      time: booking.booking_time,
      deposit_amount: booking.service.deposit_amount,
      payment_link: paymentLink,
      minutes_remaining: Math.max(0, 15 - Math.floor(minutesSinceCreation)),
    };
  }

  // Handle get_my_pending_bookings tool
  if (tool === 'get_my_pending_bookings') {
    const pendingBookings = await getClientPendingBookings(client.id);

    return {
      success: true,
      pending_bookings: pendingBookings.map(b => ({
        booking_id: b.id,
        service_name: b.service.name,
        booking_date: b.booking_date,
        booking_time: b.booking_time,
        created_at: b.created_at,
        minutes_remaining: Math.max(0, 15 - Math.floor((new Date() - new Date(b.created_at)) / (1000 * 60))),
      })),
    };
  }

  // Handle check_availability tool
  if (tool === 'check_availability') {
    const { booking_date } = input;
    const bookingsOnDate = await getBookingsByDate(booking_date);

    // Get operating hours (8 AM to 5 PM)
    const operatingHours = [];
    for (let hour = 8; hour < 17; hour++) {
      operatingHours.push(`${String(hour).padStart(2, '0')}:00`);
      if (hour < 16) {
        operatingHours.push(`${String(hour).padStart(2, '0')}:30`);
      }
    }

    // Filter out booked times
    const bookedTimes = bookingsOnDate.map((b) => b.booking_time);
    const availableTimes = operatingHours.filter((time) => !bookedTimes.includes(time));

    return {
      success: true,
      date: booking_date,
      available_times: availableTimes,
      booked_times: bookedTimes,
    };
  }

  // Handle create_booking tool
  if (tool === 'create_booking') {
    const { service_name, booking_date, booking_time, client_name } = input;

    // Get all services to find the matching one
    const services = await getServices();
    const service = services.find(
      (s) => s.name.toLowerCase() === service_name.toLowerCase()
    );

    if (!service) {
      return {
        success: false,
        error: `Service "${service_name}" not found`,
      };
    }

    // Check if the time slot is available
    const bookingsOnDate = await getBookingsByDate(booking_date);
    const isSlotTaken = bookingsOnDate.some((b) => b.booking_time === booking_time);

    if (isSlotTaken) {
      return {
        success: false,
        error: 'This time slot is already booked',
      };
    }

    // Update client name if provided
    if (client_name && !client.name) {
      const { supabase } = await import('../db/supabase.js');
      await supabase
        .from('clients')
        .update({ name: client_name })
        .eq('id', client.id);
    }

    // Check if there's an expired booking for this slot that we can delete first
    const { supabase } = await import('../db/supabase.js');
    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_date', booking_date)
      .eq('booking_time', booking_time)
      .eq('status', 'pending')
      .eq('deposit_paid', false);

    // Delete expired bookings (older than 15 minutes)
    if (existingBookings && existingBookings.length > 0) {
      const now = new Date();
      for (const expiredBooking of existingBookings) {
        const bookingCreatedAt = new Date(expiredBooking.created_at);
        const minutesSinceCreation = (now - bookingCreatedAt) / (1000 * 60);

        if (minutesSinceCreation >= 15) {
          console.log(`Deleting expired booking: ${expiredBooking.id}`);
          await supabase
            .from('bookings')
            .delete()
            .eq('id', expiredBooking.id);
        }
      }
    }

    // Create the booking
    const booking = await createBooking(
      client.id,
      service.id,
      booking_date,
      booking_time
    );

    // Generate payment link
    const paymentLink = await generatePaymentLink(booking, client, service);

    return {
      success: true,
      booking_id: booking.id,
      service: service.name,
      date: booking_date,
      time: booking_time,
      price: service.price,
      deposit_amount: service.deposit_amount,
      payment_link: paymentLink,
    };
  }

  return {
    success: false,
    error: `Unknown tool: ${tool}`,
  };
}

export async function handleBookingFlow(clientPhone, incomingMessage, profileName = null) {
  console.log('Processing message from:', clientPhone, 'Message:', incomingMessage, 'Profile:', profileName);
  try {
    // Step 1: Find or create the client
    let client = await findOrCreateClient(clientPhone);

    // Step 2: Update client name with profile name if not set
    if (profileName && !client.name) {
      client = await updateClientName(client.id, profileName);
      console.log(`Updated client name to: ${profileName}`);
    }

    // Step 3: Check for restart/cancel keywords
    const restartKeywords = ['restart', 'cancel', 'start over', 'new booking', 'cancel booking', 'reset'];
    const messageLower = incomingMessage.toLowerCase().trim();

    if (restartKeywords.some(keyword => messageLower.includes(keyword))) {
      console.log('Restart keyword detected - clearing conversation history');
      await clearConversationHistory(client.id);

      // Save the restart message
      await saveMessage(client.id, 'user', incomingMessage);

      // Return a fresh start message
      const freshStartMessage = "No problem! I've cleared our conversation. Let's start fresh.\n\nHow can I help you today? Would you like to book a nail appointment?";
      await saveMessage(client.id, 'assistant', freshStartMessage);
      return freshStartMessage;
    }

    // Step 4: Save the incoming message
    await saveMessage(client.id, 'user', incomingMessage);

    // Step 5: Get conversation history (only last 24 hours)
    const history = await getConversationHistory(client.id, 20);

    // Step 5: Process with Claude AI
    let aiResponse = await processMessage(history, profileName || client.name);

    // Step 6: Handle tool use loop
    // Claude might call multiple tools in sequence (e.g., check_availability then create_booking)
    let maxToolCalls = 5; // Prevent infinite loops
    let toolCallCount = 0;

    while (aiResponse.type === 'tool_use' && toolCallCount < maxToolCalls) {
      toolCallCount++;
      console.log(`Tool call ${toolCallCount}: ${aiResponse.tool}`);

      // Execute the tool
      const toolResult = await handleToolCall(aiResponse.tool, aiResponse.input, client);

      // Send the tool result back to Claude
      aiResponse = await continueWithToolResult(
        history,
        aiResponse.fullContent, // Pass the full content array
        aiResponse.toolUseId,
        toolResult,
        profileName || client.name
      );
    }

    if (toolCallCount >= maxToolCalls) {
      console.error('Max tool calls reached - possible infinite loop');
      return "Sorry, I'm having trouble processing your request. Please try again.";
    }

    // Step 7: Save and return the final text response
    if (aiResponse.type === 'text') {
      await saveMessage(client.id, 'assistant', aiResponse.content);
      return aiResponse.content;
    }

    throw new Error('Unexpected AI response type after tool loop');
  } catch (error) {
    console.error('Error in handleBookingFlow:', {
      phone: clientPhone,
      message: incomingMessage,
      error: error.message,
      stack: error.stack,
    });

    // Return a friendly error message
    return "Sorry, I'm having trouble right now. Please try again in a moment.";
  }
}
