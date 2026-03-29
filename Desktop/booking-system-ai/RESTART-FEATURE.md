# Restart/Cancel Feature Documentation

## What Changed

### 1. Automatic 24-Hour Session Expiry
- Conversations older than 24 hours are automatically excluded
- This prevents old conversations from affecting new bookings
- The client can come back anytime and it feels like a fresh start after 24 hours

### 2. Manual Restart Keywords
Users can restart the conversation anytime by saying:
- "restart"
- "cancel"
- "start over"
- "new booking"
- "cancel booking"
- "reset"

When any of these keywords are detected, the system:
1. Clears all conversation history for that client
2. Sends a friendly restart message
3. The next message starts fresh

### 3. Production-Ready Behavior

**What happens:**
- Old conversations (24+ hours) don't affect new bookings
- Users can manually restart without calling you
- Booking records are NEVER deleted - only conversation history is cleared
- The AI knows about this feature and won't be confused

**Example flow:**
```
User: "Hey, I want to book an appointment"
AI: "Hi! I'd love to help you book. What service are you interested in?"
User: "Actually, cancel that"
AI: "No problem! I've cleared our conversation. Let's start fresh 😊

How can I help you today? Would you like to book a nail appointment?"
User: "Yes, gel overlay please"
AI: [Fresh conversation starts...]
```

## Files Modified

1. **server/src/db/queries.js**
   - Added `hoursBack` parameter to `getConversationHistory()`
   - Now filters out messages older than 24 hours

2. **server/src/services/booking.js**
   - Added restart keyword detection
   - Automatically clears conversation when keywords are detected
   - Returns friendly restart message

3. **server/src/prompts/salon-assistant.js**
   - Updated AI system prompt to explain the restart feature
   - AI understands that old conversations might disappear

## Testing

Test these scenarios:

1. **Normal conversation:**
   - Message the bot
   - Have a conversation
   - Message again within 24 hours → should remember context

2. **Restart keyword:**
   - Start a conversation
   - Say "restart" or "cancel"
   - Bot should respond with restart message
   - Next message should be treated as fresh

3. **24-hour expiry:**
   - Wait 24 hours (or manually clear: `curl http://localhost:3000/admin/clear-conversations`)
   - Send new message → should not reference old conversation

## Admin Commands

Clear all conversations manually:
```bash
curl http://localhost:3000/admin/clear-conversations
```

## Production Recommendation

This is now production-ready! The system:
- Handles user-initiated restarts gracefully
- Prevents stale conversations from affecting new bookings
- Maintains booking records for business purposes
- Provides a smooth user experience
