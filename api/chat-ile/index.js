/**
 * Chat Endpoint with ILE Integration
 *
 * This endpoint integrates with the ILE system for:
 * - Model execution through worker partitions
 * - Automatic output vetting
 * - Hallucination detection
 * - Quarantine on policy violations
 */

const { app } = require('@azure/functions');
const { getILESystem } = require('../ile-init');

app.http('chat-ile', {
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
            const { message, conversationHistory = [], workerId = 'primary-worker' } = body;

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

            context.log('[ILE-CHAT] Getting ILE System instance...');

            // Get ILE System
            const ileSystem = await getILESystem();

            context.log('[ILE-CHAT] Processing message through ILE worker...');

            // Process message through ILE system
            const result = await ileSystem.processMessage(
                workerId,
                message,
                conversationHistory
            );

            // Check if output passed vetting
            if (!result.vetResult.passed) {
                context.warn('[ILE-CHAT] Output failed vetting!');
                context.warn(`[ILE-CHAT] Risk Score: ${result.vetResult.riskScore}`);
                context.warn(`[ILE-CHAT] Violations: ${result.vetResult.violations.length}`);

                // If quarantined, return special response
                if (result.vetResult.riskScore >= 60) {
                    return {
                        status: 200,
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*'
                        },
                        body: JSON.stringify({
                            response: 'I apologize, but my response was flagged by the safety system and has been quarantined. The system administrator has been notified. Please try rephrasing your question.',
                            quarantined: true,
                            vetResult: {
                                passed: false,
                                riskScore: result.vetResult.riskScore,
                                violationCount: result.vetResult.violations.length,
                            },
                            model: result.model,
                            usage: result.usage
                        })
                    };
                }
            }

            context.log('[ILE-CHAT] Output passed vetting, returning to user');

            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*'
                },
                body: JSON.stringify({
                    response: result.output,
                    vetResult: {
                        passed: result.vetResult.passed,
                        riskScore: result.vetResult.riskScore,
                    },
                    model: result.model,
                    usage: result.usage
                })
            };

        } catch (error) {
            context.error('[ILE-CHAT] Error:', error);

            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*'
                },
                body: JSON.stringify({
                    error: 'Failed to process message through ILE system',
                    details: error.message
                })
            };
        }
    }
});
