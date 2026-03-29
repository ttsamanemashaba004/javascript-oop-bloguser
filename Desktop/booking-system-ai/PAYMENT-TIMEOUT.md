# Payment Timeout Feature

## Problem Solved
Previously, when someone created a booking, that time slot was blocked immediately - even if they never paid. This meant people could "hoard" time slots without commitment.

## Solution: 15-Minute Payment Window

### How It Works

1. **Client books a time slot** → Booking created with `status: 'pending'`
2. **Client receives payment link** → They have 15 minutes to pay
3. **Two scenarios:**
   - ✅ **Payment within 15 minutes** → Booking confirmed, slot secured
   - ❌ **No payment after 15 minutes** → Slot becomes available again

### Technical Implementation

#### 1. Updated `getBookingsByDate()` - [queries.js:111-148](server/src/db/queries.js#L111-L148)
- Filters out pending bookings older than 15 minutes
- Only counts bookings with `deposit_paid: true` or within the 15-minute window
- This affects availability checks automatically

#### 2. New Function `getClientPendingBookings()` - [queries.js:230-261](server/src/db/queries.js#L230-L261)
- Returns a client's unpaid bookings
- Shows how many minutes remaining before expiry
- Used by AI to remind clients about pending payments

#### 3. New AI Tool: `get_my_pending_bookings`
- AI can check if user has unpaid bookings
- Helps prevent duplicate bookings
- Reminds users to complete payment

#### 4. Updated System Prompt
- AI explains the 15-minute rule when sending payment links
- AI can proactively check for pending bookings

## Real-World Scenarios

### Scenario 1: User tries to double-book
```
User: "I want gel overlay at 2pm on April 3rd"
AI: Creates booking, sends payment link with 15-minute warning
User: (doesn't pay, waits 20 minutes)
User: "I want gel overlay at 2pm on April 3rd" (same time!)
AI: ✅ Allows it - previous booking expired
```

### Scenario 2: Different user wants same slot
```
User A: Books 2pm, doesn't pay
[15 minutes pass]
User B: "I want to book at 2pm"
AI: ✅ Shows 2pm as available - User A's booking expired
```

### Scenario 3: User pays within time
```
User: Books 2pm, receives payment link
User: Clicks link and pays within 10 minutes
System: ✅ Booking confirmed, slot secured
AI: Sends WhatsApp confirmation
```

## Configuration

The timeout is set to **15 minutes** but can be easily changed:

**In [queries.js:111](server/src/db/queries.js#L111):**
```javascript
const PAYMENT_TIMEOUT_MINUTES = 15; // Change this value
```

**In [queries.js:230](server/src/db/queries.js#L230):**
```javascript
const PAYMENT_TIMEOUT_MINUTES = 15; // Change this value too
```

### Recommended Timeouts by Business Type
- **5 minutes**: High-demand, limited slots (concerts, limited events)
- **15 minutes**: Nail salons, hair salons, restaurants ✅ (current)
- **30 minutes**: Hotels, spa packages
- **60 minutes**: Professional services, consultations

## Database Impact

**No schema changes needed!** The feature works with existing columns:
- `status` (pending, deposit_paid, confirmed, cancelled)
- `deposit_paid` (boolean)
- `created_at` (timestamp)

## Benefits

1. **Prevents slot hoarding** - Users can't block times without commitment
2. **Fair for all clients** - First to pay, not first to request
3. **Maximizes bookings** - No wasted slots from no-shows at payment stage
4. **Professional** - Matches industry standards (airlines, hotels, events)
5. **No manual intervention** - Automatic cleanup

## Testing

### Test 1: Basic timeout
```bash
# Create a booking via WhatsApp
# Wait 15+ minutes
# Try to book the same time again
# Should allow it
```

### Test 2: Multiple clients
```bash
# User A books 2pm (don't pay)
# User B tries to book 2pm after 15 mins
# Should be available for User B
```

### Test 3: Payment within window
```bash
# Create booking
# Pay within 15 minutes
# Try to book same time from another number
# Should be blocked (payment confirmed)
```

## Future Enhancements (Optional)

1. **Send reminder at 10 minutes** - "5 minutes left to secure your booking!"
2. **Auto-cancel expired bookings** - Background job to update status to 'expired'
3. **Show countdown in messages** - "You have 12 minutes remaining..."
4. **Allow extension** - "Need more time? Reply 'extend' for 10 more minutes"

## Summary

This feature makes your booking system **production-ready** and follows **industry best practices**. Slots are only truly reserved after payment, preventing abuse and maximizing availability.
