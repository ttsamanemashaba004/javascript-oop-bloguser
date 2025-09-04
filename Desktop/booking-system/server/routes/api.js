const express = require('express');
const moment = require('moment-timezone');
const db = require('../services/database');
const booking = require('../services/booking');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Get availability for a specific date and service
router.get('/availability', async (req, res) => {
  try {
    let { salon_id, service_id, date } = req.query;
    if (!salon_id) salon_id = process.env.DEFAULT_SALON_ID;

    if (!salon_id || !service_id || !date) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const salon = await db.getSalon(salon_id);
    const services = await db.getServices(salon_id);
    const service = services.find(s => String(s.id) === String(service_id));
    
    if (!salon || !service) {
      return res.status(404).json({ error: 'Salon or service not found' });
    }

    // Get operating hours for the requested date
    const requestedDate = moment.tz(date, salon.timezone);
    const weekday = requestedDate.day();
    const operatingHours = await db.getOperatingHours(salon_id, weekday);

    if (!operatingHours || operatingHours.length === 0) {
      return res.json({ available_slots: [], message: 'Salon is closed on this day' });
    }

    const hours = operatingHours[0];
    const openTime = moment.tz(`${date} ${hours.open_time}`, salon.timezone);
    const closeTime = moment.tz(`${date} ${hours.close_time}`, salon.timezone);

    // Generate time slots
    const slots = [];
    let slotTime = openTime.clone();

    while (slotTime.clone().add(service.duration_min, 'minutes').isBefore(closeTime)) {
      const slotEnd = slotTime.clone().add(service.duration_min, 'minutes');
      
      const availability = await booking.checkAvailability(
        salon_id,
        service_id,
        slotTime.toISOString(),
        slotEnd.toISOString()
      );

      slots.push({
        time: slotTime.format('HH:mm'),
        display_time: slotTime.format('h:mm A'),
        available: availability.available,
        reason: availability.reason || null
      });

      slotTime.add(30, 'minutes'); // 30-minute intervals
    }

    res.json({ available_slots: slots });

  } catch (error) {
    console.error('Availability check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get bookings for a date range
router.get('/bookings', async (req, res) => {
  try {
    let { salon_id, from, to, status } = req.query;
    if (!salon_id) salon_id = process.env.DEFAULT_SALON_ID;

    if (!salon_id) {
      return res.status(400).json({ error: 'salon_id is required' });
    }

    // If Supabase is not configured, return empty data to avoid 500s in dev
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      console.warn('SUPABASE env not configured. Returning empty bookings.');
      return res.json({ bookings: [] });
    }

    const fromDate = from || moment().format('YYYY-MM-DD');
    const toDate = to || moment().add(7, 'days').format('YYYY-MM-DD');

    // Simplified select to reduce likelihood of 500s from relational issues
    // Client maps fields defensively; we can expand later when relations are stable
    let query = supabase
      .from('bookings')
      .select('*')
      .eq('salon_id', salon_id)
      .gte('start_ts', `${fromDate}T00:00:00Z`)
      .lte('start_ts', `${toDate}T23:59:59Z`)
      .order('start_ts', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase bookings query error:', error);
      // Fail-open for development: return empty list instead of 500
      return res.json({ bookings: [] });
    }

    res.json({ bookings: data || [] });

  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a manual booking (for dashboard use)
router.post('/bookings', async (req, res) => {
  try {
    const {
      salon_id,
      customer_whatsapp,
      customer_name,
      service_id,
      date,
      time,
      staff_id
    } = req.body;

    if (!salon_id || !customer_whatsapp || !service_id || !date || !time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find or create customer
    const customer = await db.findOrCreateCustomer(
      salon_id,
      customer_whatsapp,
      customer_name
    );

    // Get service details
    const services = await db.getServices(salon_id);
    const service = services.find(s => String(s.id) === String(service_id));

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Parse datetime
    const salon = await db.getSalon(salon_id);
    const startDateTime = moment.tz(`${date} ${time}`, 'YYYY-MM-DD HH:mm', salon.timezone);
    const endDateTime = startDateTime.clone().add(service.duration_min, 'minutes');

    // Check availability
    const availability = await booking.checkAvailability(
      salon_id,
      service_id,
      startDateTime.toISOString(),
      endDateTime.toISOString()
    );

    if (!availability.available) {
      return res.status(409).json({ error: availability.reason });
    }

    // Create booking
    const newBooking = await db.createBooking({
      salon_id,
      customer_id: customer.id,
      service_id,
      staff_id: staff_id || (await db.getActiveStaff(salon_id))[0]?.id,
      start_ts: startDateTime.toISOString(),
      end_ts: endDateTime.toISOString(),
      status: 'confirmed',
      source: 'dashboard'
    });

    res.status(201).json({ booking: newBooking });

  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update booking status
router.patch('/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const updatedBooking = await db.updateBookingStatus(id, status);
    res.json({ booking: updatedBooking });

  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get salon services
router.get('/services', async (req, res) => {
  try {
    let { salon_id } = req.query;
    if (!salon_id) salon_id = req.headers['x-salon-id'] || process.env.DEFAULT_SALON_ID;

    if (!salon_id) {
      return res.status(400).json({ error: 'salon_id is required' });
    }

    const services = await db.getServices(salon_id);
    res.json({ services });

  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get salon staff
router.get('/staff', async (req, res) => {
  try {
    let { salon_id } = req.query;
    if (!salon_id) salon_id = req.headers['x-salon-id'] || process.env.DEFAULT_SALON_ID;

    if (!salon_id) {
      return res.status(400).json({ error: 'salon_id is required' });
    }

    const staff = await db.getActiveStaff(salon_id);
    res.json({ staff });

  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
