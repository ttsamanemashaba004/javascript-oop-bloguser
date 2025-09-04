const moment = require('moment-timezone');
const db = require('./database');

class BookingService {
  async checkAvailability(salonId, serviceId, requestedStart, requestedEnd) {
    const salon = await db.getSalon(salonId);
    const startMoment = moment.tz(requestedStart, salon.timezone);
    const endMoment = moment.tz(requestedEnd, salon.timezone);
    
    // Check if it's in the past
    if (startMoment.isBefore(moment().tz(salon.timezone))) {
      return { available: false, reason: 'Time slot is in the past' };
    }

    // Check operating hours
    const weekday = startMoment.day(); // 0 = Sunday
    const operatingHours = await db.getOperatingHours(salonId, weekday);
    
    if (!operatingHours || operatingHours.length === 0) {
      return { available: false, reason: 'Salon is closed on this day' };
    }

    const hours = operatingHours[0];
    const openTime = moment.tz(`${startMoment.format('YYYY-MM-DD')} ${hours.open_time}`, salon.timezone);
    const closeTime = moment.tz(`${startMoment.format('YYYY-MM-DD')} ${hours.close_time}`, salon.timezone);

    if (startMoment.isBefore(openTime) || endMoment.isAfter(closeTime)) {
      return { 
        available: false, 
        reason: `Outside operating hours (${hours.open_time} - ${hours.close_time})` 
      };
    }

    // Check blackouts
    const blackouts = await db.getBlackouts(salonId, requestedStart, requestedEnd);
    if (blackouts && blackouts.length > 0) {
      return { available: false, reason: 'Salon is closed during this period' };
    }

    // Check existing bookings (including holds)
    const existingBookings = await db.getBookingsInRange(
      salonId, 
      requestedStart, 
      requestedEnd,
      ['hold', 'pending_deposit', 'confirmed']
    );

    if (existingBookings && existingBookings.length > 0) {
      return { available: false, reason: 'Time slot is already booked' };
    }

    return { available: true };
  }

  async findAlternatives(salonId, serviceId, preferredDate, preferredTime, durationMin) {
    const salon = await db.getSalon(salonId);
    const alternatives = [];
    const startDate = moment.tz(preferredDate, salon.timezone);
    
    // Look for alternatives within the next 7 days
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const checkDate = startDate.clone().add(dayOffset, 'days');
      const weekday = checkDate.day();
      
      const operatingHours = await db.getOperatingHours(salonId, weekday);
      if (!operatingHours || operatingHours.length === 0) continue;
      
      const hours = operatingHours[0];
      const openTime = moment.tz(`${checkDate.format('YYYY-MM-DD')} ${hours.open_time}`, salon.timezone);
      const closeTime = moment.tz(`${checkDate.format('YYYY-MM-DD')} ${hours.close_time}`, salon.timezone);
      
      // Check every 30-minute slot
      let slotTime = openTime.clone();
      while (slotTime.clone().add(durationMin, 'minutes').isBefore(closeTime)) {
        const slotEnd = slotTime.clone().add(durationMin, 'minutes');
        
        const availability = await this.checkAvailability(
          salonId, 
          serviceId, 
          slotTime.toISOString(), 
          slotEnd.toISOString()
        );
        
        if (availability.available) {
          alternatives.push({
            date: slotTime.format('YYYY-MM-DD'),
            time: slotTime.format('HH:mm'),
            formatted: slotTime.format('dddd, MMMM Do [at] h:mm A')
          });
          
          if (alternatives.length >= 3) {
            return alternatives;
          }
        }
        
        slotTime.add(30, 'minutes');
      }
    }
    
    return alternatives;
  }

  async createHold(salonId, customerId, serviceId, startTs, endTs) {
    const staff = await db.getActiveStaff(salonId);
    if (!staff || staff.length === 0) {
      throw new Error('No staff available');
    }

    // Use first available staff member (MVP approach)
    const staffId = staff[0].id;
    
    // Create 15-minute hold
    const heldUntil = moment().add(15, 'minutes').toISOString();
    
    const bookingData = {
      salon_id: salonId,
      customer_id: customerId,
      staff_id: staffId,
      service_id: serviceId,
      start_ts: startTs,
      end_ts: endTs,
      status: 'hold',
      held_until: heldUntil,
      source: 'whatsapp'
    };

    return await db.createBooking(bookingData);
  }

  async confirmBooking(bookingId) {
    return await db.updateBookingStatus(bookingId, 'confirmed');
  }

  async cleanExpiredHolds() {
    return await db.cleanExpiredHolds();
  }

  formatBookingTime(booking, timezone) {
    const startTime = moment.tz(booking.start_ts, timezone);
    return {
      date: startTime.format('dddd, MMMM Do YYYY'),
      time: startTime.format('h:mm A'),
      dateShort: startTime.format('YYYY-MM-DD'),
      timeShort: startTime.format('HH:mm')
    };
  }
}

module.exports = new BookingService();