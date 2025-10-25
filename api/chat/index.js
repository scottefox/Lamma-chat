const { app } = require('@azure/functions');
const Anthropic = require('@anthropic-ai/sdk');

// Initialize Anthropic client
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

app.http('chat', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return {
                status: 200,
                headers: {
                    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Max-Age': '86400'
                }
            };
        }

        try {
            const body = await request.json();
            const { message, conversationHistory = [] } = body;

            if (!message) {
                return {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*'
                    },
                    body: JSON.stringify({ error: 'Message is required' })
                };
            }

            // Build messages array for Claude API
            const messages = [
                ...conversationHistory,
                { role: 'user', content: message }
            ];

            context.log('Sending request to Claude API');

            // Call Claude API
            const response = await anthropic.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 1024,
                messages: messages
            });

            const assistantMessage = response.content[0].text;

            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*'
                },
                body: JSON.stringify({
                    response: assistantMessage,
                    model: response.model,
                    usage: response.usage
                })
            };

        } catch (error) {
            context.error('Error calling Claude API:', error);

            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*'
                },
                body: JSON.stringify({
                    error: 'Failed to get response from Claude',
                    details: error.message
                })
            };
        }
    }
});
