import express from 'express';
import { clearAllConversations } from '../db/queries.js';
import { supabase } from '../db/supabase.js';

const router = express.Router();

// Admin route to clear all conversations (for testing)
router.get('/clear-conversations', async (req, res) => {
  try {
    await clearAllConversations();
    console.log('All conversations cleared');
    res.json({ success: true, message: 'All conversations cleared' });
  } catch (error) {
    console.error('Error clearing conversations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin route to manually mark a booking as paid (for testing)
router.post('/mark-paid', async (req, res) => {
  try {
    const { booking_id, payment_reference } = req.body;

    if (!booking_id) {
      return res.status(400).json({ success: false, error: 'booking_id required' });
    }

    const { data, error } = await supabase
      .from('bookings')
      .update({
        deposit_paid: true,
        payment_reference: payment_reference || 'MANUAL_TEST',
        status: 'deposit_paid'
      })
      .eq('id', booking_id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log('Booking marked as paid:', booking_id);
    res.json({ success: true, message: 'Booking marked as paid', booking: data });
  } catch (error) {
    console.error('Error marking booking as paid:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin route to list all services (for testing)
router.get('/services', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    res.json({ success: true, services: data });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
