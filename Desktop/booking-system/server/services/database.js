const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

class DatabaseService {
  // Salon operations
  async getSalon(salonId) {
    const { data, error } = await supabase
      .from('salons')
      .select('*')
      .eq('id', salonId)
      .single();
    
    if (error) throw error;
    return data;
  }

  async getSalonByWhatsApp(whatsappNumber) {
    const { data, error } = await supabase
      .from('salons')
      .select('*')
      .eq('whatsapp_number', whatsappNumber)
      .single();
    
    if (error) throw error;
    return data;
  }

  // Customer operations
  async findOrCreateCustomer(salonId, whatsappNumber, name = null) {
    // Try to find existing customer
    let { data: customer, error } = await supabase
      .from('customers')
      .select('*')
      .eq('salon_id', salonId)
      .eq('whatsapp_number', whatsappNumber)
      .single();

    if (error && error.code === 'PGRST116') {
      // Customer doesn't exist, create new one
      const { data: newCustomer, error: createError } = await supabase
        .from('customers')
        .insert({
          salon_id: salonId,
          whatsapp_number: whatsappNumber,
          name: name
        })
        .select()
        .single();

      if (createError) throw createError;
      customer = newCustomer;
    } else if (error) {
      throw error;
    }

    return customer;
  }

  // Service operations
  async getServices(salonId, activeOnly = true) {
    let query = supabase
      .from('services')
      .select('*')
      .eq('salon_id', salonId);
    
    if (activeOnly) {
      query = query.eq('active', true);
    }

    const { data, error } = await query.order('name');
    if (error) throw error;
    return data;
  }

  // Create operations
  async createSalon({ name, timezone = 'Africa/Johannesburg', deposit_amount_cents = 0 }) {
    const { data, error } = await supabase
      .from('salons')
      .insert({ name, timezone, deposit_amount_cents })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateSalon(salonId, updates) {
    const { data, error } = await supabase
      .from('salons')
      .update({ ...updates })
      .eq('id', salonId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async createServices(salonId, services) {
    if (!services || services.length === 0) return []
    const payload = services.map(s => ({
      salon_id: salonId,
      name: s.name,
      duration_min: s.duration_min,
      price_cents: s.price_cents,
      active: true
    }))
    const { data, error } = await supabase
      .from('services')
      .insert(payload)
      .select()

    if (error) throw error
    return data
  }

  async createStaff(salonId, staff) {
    if (!staff || staff.length === 0) return []
    const payload = staff.map(m => ({
      salon_id: salonId,
      name: m.name,
      active: true
    }))
    const { data, error } = await supabase
      .from('staff')
      .insert(payload)
      .select()

    if (error) throw error
    return data
  }

  async setDefaultOperatingHours(salonId) {
    const defaults = [
      { weekday: 1, open_time: '09:00', close_time: '17:00' },
      { weekday: 2, open_time: '09:00', close_time: '17:00' },
      { weekday: 3, open_time: '09:00', close_time: '17:00' },
      { weekday: 4, open_time: '09:00', close_time: '17:00' },
      { weekday: 5, open_time: '09:00', close_time: '17:00' },
      { weekday: 6, open_time: '09:00', close_time: '13:00' },
    ]
    const payload = defaults.map(h => ({ ...h, salon_id: salonId }))
    const { data, error } = await supabase
      .from('operating_hours')
      .insert(payload)
      .select()

    if (error) throw error
    return data
  }

  async findServiceByName(salonId, serviceName) {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('salon_id', salonId)
      .eq('active', true)
      .ilike('name', `%${serviceName}%`)
      .order('name')
      .limit(1);

    if (error) throw error;
    return data[0] || null;
  }

  // Staff operations
  async getActiveStaff(salonId) {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('salon_id', salonId)
      .eq('active', true);

    if (error) throw error;
    return data;
  }

  // Operating hours
  async getOperatingHours(salonId, weekday = null) {
    let query = supabase
      .from('operating_hours')
      .select('*')
      .eq('salon_id', salonId);
    
    if (weekday !== null) {
      query = query.eq('weekday', weekday);
    }

    const { data, error } = await query.order('weekday');
    if (error) throw error;
    return data;
  }

  // Blackouts
  async getBlackouts(salonId, startDate, endDate) {
    const { data, error } = await supabase
      .from('blackouts')
      .select('*')
      .eq('salon_id', salonId)
      .lte('start_ts', endDate)
      .gte('end_ts', startDate);

    if (error) throw error;
    return data;
  }

  // Booking operations
  async createBooking(bookingData) {
    const { data, error } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getBooking(bookingId) {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        customer:customers(*),
        service:services(*),
        staff:staff(*),
        salon:salons(*)
      `)
      .eq('id', bookingId)
      .single();

    if (error) throw error;
    return data;
  }

  async updateBookingStatus(bookingId, status) {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getBookingsInRange(salonId, startTs, endTs, statuses = ['hold', 'pending_deposit', 'confirmed']) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('salon_id', salonId)
      .in('status', statuses)
      .lt('start_ts', endTs)
      .gt('end_ts', startTs);

    if (error) throw error;
    return data;
  }

  async cleanExpiredHolds() {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('status', 'hold')
      .lt('held_until', new Date().toISOString())
      .select();

    if (error) throw error;
    return data;
  }

  // Payment operations
  async createPayment(paymentData) {
    const { data, error } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updatePaymentStatus(paymentId, status, providerRef = null) {
    const updateData = { status };
    if (providerRef) updateData.provider_ref = providerRef;

    const { data, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', paymentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async findPaymentByProviderRef(providerRef) {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        booking:bookings(
          *,
          customer:customers(*),
          service:services(*),
          salon:salons(*)
        )
      `)
      .eq('provider_ref', providerRef)
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = new DatabaseService();