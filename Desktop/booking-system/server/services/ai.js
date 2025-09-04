const axios = require('axios');
const moment = require('moment-timezone');

class AIService {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.baseURL = 'https://api.openai.com/v1';
  }

  async processMessage(message, salon, services) {
    const servicesText = services.map(s => `${s.name} (${s.duration_min} min, R${(s.price_cents / 100).toFixed(2)})`).join(', ');
    const currentTime = moment().tz(salon.timezone);
    
    const systemPrompt = `You are an AI assistant for ${salon.name}, a nail salon. Be concise and helpful.

SERVICES AVAILABLE: ${servicesText}

OPERATING HOURS: Monday-Friday 9:00-17:00, Saturday 9:00-15:00, Sunday closed
TIMEZONE: ${salon.timezone}
CURRENT TIME: ${currentTime.format('YYYY-MM-DD HH:mm dddd')}

INSTRUCTIONS:
1. Classify the intent as one of: book_new, reschedule, cancel, price_query, hours_query, service_list, greeting, other, choice_selection
2. If booking intent, extract: service name, preferred date, preferred time, customer name (if mentioned)
3. For dates: convert relative terms like "tomorrow", "Friday", "next week" to YYYY-MM-DD format
4. For times: convert to 24-hour format (HH:MM)
5. IMPORTANT: If user replies with ONLY a number (1, 2, or 3), classify as "choice_selection" and extract the choice number
6. Return ONLY a JSON object with this structure:

{
  "intent": "book_new|reschedule|cancel|price_query|hours_query|service_list|greeting|other|choice_selection",
  "entities": {
    "service": "exact service name from available services or null",
    "date": "YYYY-MM-DD or null",
    "time": "HH:MM or null", 
    "customer_name": "name or null",
    "duration_min": number or null,
    "choice_number": "1|2|3 or null (only for choice_selection intent)"
  },
  "confidence": 0.0-1.0,
  "raw_request": "the original message for context"
}

EXAMPLES:
- "Hi can I book gel nails tomorrow 3pm" → {"intent": "book_new", "entities": {"service": "Gel Nails", "date": "2025-08-20", "time": "15:00", "customer_name": null, "duration_min": 60}}
- "What are your prices?" → {"intent": "price_query", "entities": {}}
- "1" → {"intent": "choice_selection", "entities": {"choice_number": "1"}}
- "2" → {"intent": "choice_selection", "entities": {"choice_number": "2"}}
- "3" → {"intent": "choice_selection", "entities": {"choice_number": "3"}}
- "Cancel my Friday booking" → {"intent": "cancel", "entities": {"date": "2025-08-23"}}`;

    try {
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.1,
        max_tokens: 300
      }, {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const aiResponse = response.data.choices[0].message.content.trim();
      
      // Parse JSON response
      try {
        const parsed = JSON.parse(aiResponse);
        parsed.raw_request = message;
        return parsed;
      } catch (parseError) {
        console.error('Failed to parse AI response:', aiResponse);
        return {
          intent: 'other',
          entities: {},
          confidence: 0.1,
          raw_request: message,
          error: 'Failed to parse AI response'
        };
      }
    } catch (error) {
      console.error('OpenAI API error:', error.response?.data || error.message);
      return {
        intent: 'other',
        entities: {},
        confidence: 0.0,
        raw_request: message,
        error: 'AI service unavailable'
      };
    }
  }

  generateResponse(intent, data = {}) {
    switch (intent) {
      case 'greeting':
        return `Hello! I'm here to help you book your appointment at ${data.salonName || 'our salon'}. What service would you like to book?`;
      
      case 'service_list':
        if (data.services && data.services.length > 0) {
          const serviceList = data.services
            .map(s => `• ${s.name} - ${s.duration_min} minutes - R${(s.price_cents / 100).toFixed(2)}`)
            .join('\n');
          return `Here are our services:\n\n${serviceList}\n\nWhich service would you like to book?`;
        }
        return 'Let me get our service list for you...';
      
      case 'price_query':
        if (data.services && data.services.length > 0) {
          const priceList = data.services
            .map(s => `• ${s.name}: R${(s.price_cents / 100).toFixed(2)}`)
            .join('\n');
          return `Our prices are:\n\n${priceList}\n\nA R${(data.depositAmount / 100).toFixed(2)} deposit is required to secure your booking.`;
        }
        return 'Let me get our pricing for you...';
      
      case 'hours_query':
        return `We're open:\n• Monday-Friday: 9:00 AM - 5:00 PM\n• Saturday: 9:00 AM - 3:00 PM\n• Sunday: Closed\n\nWhat time works best for you?`;
      
      case 'booking_hold':
        return `Perfect! I'm holding ${data.service} on ${data.date} at ${data.time} for 15 minutes.\n\nPay your R${(data.depositAmount / 100).toFixed(2)} deposit to confirm:\n${data.paymentUrl}\n\nOnce paid, I'll send your confirmation! 💅`;
      
      case 'booking_unavailable':
        if (data.alternatives && data.alternatives.length > 0) {
          const altList = data.alternatives
            .map((alt, i) => `${i + 1}. ${alt.date} at ${alt.time}`)
            .join('\n');
          return `Sorry, ${data.requestedTime} is not available. Here are some alternatives:\n\n${altList}\n\nReply with your choice (1, 2, or 3).`;
        }
        return `Sorry, that time slot is not available. Please suggest another time.`;
      
      case 'booking_confirmed':
        return `🎉 Booking confirmed!\n\n📅 ${data.service}\n🗓️ ${data.date} at ${data.time}\n💰 Deposit received: R${(data.depositAmount / 100).toFixed(2)}\n\nSee you soon! If you need to reschedule, just message me.`;
      
      case 'choice_selection':
        return `Perfect! I'll book option ${data.choiceNumber} for you. Processing your booking now...`;
      
      case 'error':
        return `Sorry, I couldn't process that request. Please try again or contact us directly.`;
      
      default:
        return `I understand you want to ${intent}, but I need more information. Please specify the service, date, and time you prefer.`;
    }
  }
}

module.exports = new AIService();