import Anthropic from '@anthropic-ai/sdk';
import { getSystemPrompt } from '../prompts/salon-assistant.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const tools = [
  {
    name: 'create_booking',
    description: 'Creates a new booking for a client. Use this when the client has confirmed they want to book a specific service at a specific date and time.',
    input_schema: {
      type: 'object',
      properties: {
        service_name: {
          type: 'string',
          description: 'The name of the service to book (e.g., "Gel Overlay", "Acrylic Full Set")',
        },
        booking_date: {
          type: 'string',
          description: 'The date of the booking in YYYY-MM-DD format',
        },
        booking_time: {
          type: 'string',
          description: 'The time of the booking in HH:MM format (24-hour, e.g., "14:30")',
        },
        client_name: {
          type: 'string',
          description: 'The client\'s name',
        },
      },
      required: ['service_name', 'booking_date', 'booking_time', 'client_name'],
    },
  },
  {
    name: 'check_availability',
    description: 'Checks which time slots are available on a specific date. Use this before suggesting times to the client.',
    input_schema: {
      type: 'object',
      properties: {
        booking_date: {
          type: 'string',
          description: 'The date to check availability for in YYYY-MM-DD format',
        },
      },
      required: ['booking_date'],
    },
  },
  {
    name: 'get_my_pending_bookings',
    description: 'Gets the current client\'s pending bookings that are awaiting payment. Use this when a client asks about their existing bookings or tries to book a time they already have pending.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'resend_payment_link',
    description: 'Resends the payment link for a specific pending booking. Use this when a client asks for the payment link or says they didn\'t receive it.',
    input_schema: {
      type: 'object',
      properties: {
        booking_id: {
          type: 'string',
          description: 'The ID of the booking to resend payment link for',
        },
      },
      required: ['booking_id'],
    },
  },
];

export async function processMessage(conversationHistory, profileName = null) {
  try {
    // Format conversation history - only text messages from database
    const messages = conversationHistory.map((msg) => ({
      role: msg.role,
      content: msg.message,
    }));

    console.log('Sending to Claude API...');
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: getSystemPrompt(profileName),
      messages,
      tools,
    });
    console.log('Claude response:', JSON.stringify(response));

    // Check if Claude wants to use a tool
    const toolUseBlock = response.content.find((block) => block.type === 'tool_use');

    if (toolUseBlock) {
      return {
        type: 'tool_use',
        tool: toolUseBlock.name,
        input: toolUseBlock.input,
        toolUseId: toolUseBlock.id,
        fullContent: response.content, // Return the FULL content array
      };
    }

    // Otherwise, return the text response
    const textBlock = response.content.find((block) => block.type === 'text');

    if (textBlock) {
      return {
        type: 'text',
        content: textBlock.text,
      };
    }

    throw new Error('No valid response from Claude API');
  } catch (error) {
    console.error('Error in processMessage:', error);
    throw error;
  }
}

export async function continueWithToolResult(conversationHistory, assistantContent, toolUseId, toolResult, profileName = null) {
  try {
    // Format conversation history - only text messages from database
    const messages = conversationHistory.map((msg) => ({
      role: msg.role,
      content: msg.message,
    }));

    // Add the assistant message that contained the tool_use (full content array)
    messages.push({
      role: 'assistant',
      content: assistantContent,
    });

    // Add tool result as a user message
    messages.push({
      role: 'user',
      content: [
        {
          type: 'tool_result',
          tool_use_id: toolUseId,
          content: JSON.stringify(toolResult),
        },
      ],
    });

    console.log('Sending tool result to Claude API...');
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: getSystemPrompt(profileName),
      messages,
      tools,
    });
    console.log('Claude response after tool:', JSON.stringify(response));

    // Check if Claude wants to use another tool
    const toolUseBlock = response.content.find((block) => block.type === 'tool_use');

    if (toolUseBlock) {
      return {
        type: 'tool_use',
        tool: toolUseBlock.name,
        input: toolUseBlock.input,
        toolUseId: toolUseBlock.id,
        fullContent: response.content,
      };
    }

    // Return the text response
    const textBlock = response.content.find((block) => block.type === 'text');

    if (textBlock) {
      return {
        type: 'text',
        content: textBlock.text,
      };
    }

    throw new Error('No text response after tool use');
  } catch (error) {
    console.error('Error in continueWithToolResult:', error);
    throw error;
  }
}
