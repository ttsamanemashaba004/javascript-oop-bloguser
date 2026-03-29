import { supabase } from './supabase.js';

export async function findOrCreateClient(phoneNumber) {
  try {
    // Try to find existing client
    const { data: existingClient, error: findError } = await supabase
      .from('clients')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();

    if (existingClient) {
      return existingClient;
    }

    // Create new client if not found
    const { data: newClient, error: createError } = await supabase
      .from('clients')
      .insert([{ phone_number: phoneNumber }])
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create client: ${createError.message}`);
    }

    return newClient;
  } catch (error) {
    console.error('Error in findOrCreateClient:', error);
    throw error;
  }
}

export async function saveMessage(clientId, role, message) {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .insert([
        {
          client_id: clientId,
          role,
          message
        }
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save message: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error in saveMessage:', error);
    throw error;
  }
}

export async function getConversationHistory(clientId, limit = 20, hoursBack = 24) {
  try {
    // Calculate the cutoff time (24 hours ago by default)
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hoursBack);

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('client_id', clientId)
      .gte('created_at', cutoffTime.toISOString()) // Only get messages from last 24 hours
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get conversation history: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error in getConversationHistory:', error);
    throw error;
  }
}

export async function createBooking(clientId, serviceId, date, time) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .insert([
        {
          client_id: clientId,
          service_id: serviceId,
          booking_date: date,
          booking_time: time,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create booking: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error in createBooking:', error);
    throw error;
  }
}

export async function getBookingsByDate(date) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        client:clients(*),
        service:services(*)
      `)
      .eq('booking_date', date)
      .neq('status', 'cancelled')
      .order('booking_time', { ascending: true });

    if (error) {
      throw new Error(`Failed to get bookings by date: ${error.message}`);
    }

    // Filter out expired pending bookings (older than 15 minutes without payment)
    const PAYMENT_TIMEOUT_MINUTES = 15;
    const now = new Date();

    const validBookings = (data || []).filter(booking => {
      // If payment is confirmed, always include it
      if (booking.deposit_paid || booking.status === 'deposit_paid' || booking.status === 'confirmed') {
        return true;
      }

      // If pending, check if it's within the timeout window
      if (booking.status === 'pending') {
        const bookingCreatedAt = new Date(booking.created_at);
        const minutesSinceCreation = (now - bookingCreatedAt) / (1000 * 60);

        // Only include pending bookings that are less than 15 minutes old
        return minutesSinceCreation < PAYMENT_TIMEOUT_MINUTES;
      }

      // Include all other statuses
      return true;
    });

    return validBookings;
  } catch (error) {
    console.error('Error in getBookingsByDate:', error);
    throw error;
  }
}

export async function updateBookingPayment(bookingId, paymentReference) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .update({
        deposit_paid: true,
        payment_reference: paymentReference,
        status: 'deposit_paid'
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update booking payment: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error in updateBookingPayment:', error);
    throw error;
  }
}

export async function getServices() {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to get services: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error in getServices:', error);
    throw error;
  }
}

export async function clearConversationHistory(clientId) {
  try {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('client_id', clientId);

    if (error) {
      throw new Error(`Failed to clear conversation history: ${error.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error in clearConversationHistory:', error);
    throw error;
  }
}

export async function clearAllConversations() {
  try {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

    if (error) {
      throw new Error(`Failed to clear all conversations: ${error.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error in clearAllConversations:', error);
    throw error;
  }
}

export async function updateClientName(clientId, name) {
  try {
    const { data, error } = await supabase
      .from('clients')
      .update({ name })
      .eq('id', clientId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update client name: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error in updateClientName:', error);
    throw error;
  }
}

export async function getClientPendingBookings(clientId) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        service:services(*)
      `)
      .eq('client_id', clientId)
      .eq('status', 'pending')
      .eq('deposit_paid', false)
      .order('created_at', { descending: true });

    if (error) {
      throw new Error(`Failed to get client pending bookings: ${error.message}`);
    }

    // Filter out expired ones (older than 15 minutes)
    const PAYMENT_TIMEOUT_MINUTES = 15;
    const now = new Date();

    const validPendingBookings = (data || []).filter(booking => {
      const bookingCreatedAt = new Date(booking.created_at);
      const minutesSinceCreation = (now - bookingCreatedAt) / (1000 * 60);
      return minutesSinceCreation < PAYMENT_TIMEOUT_MINUTES;
    });

    return validPendingBookings;
  } catch (error) {
    console.error('Error in getClientPendingBookings:', error);
    throw error;
  }
}
