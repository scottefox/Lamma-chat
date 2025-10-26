/**
 * CEO Approval Endpoint
 *
 * Handles CEO approval workflows for quarantined models
 */

const { app } = require('@azure/functions');
const { getILESystem } = require('../ile-init');

app.http('approvals', {
    methods: ['GET', 'POST', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return {
                status: 200,
                headers: {
                    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Max-Age': '86400'
                }
            };
        }

        try {
            const ileSystem = await getILESystem();
            const action = request.params.action;

            // GET /api/approvals - List pending approvals
            if (request.method === 'GET' && !action) {
                const pendingApprovals = ileSystem.getPendingApprovals();

                return {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*'
                    },
                    body: JSON.stringify({
                        approvals: pendingApprovals,
                        count: pendingApprovals.length
                    })
                };
            }

            // POST /api/approvals/submit - Submit approval decision
            if (request.method === 'POST' && action === 'submit') {
                const body = await request.json();
                const { approvalId, approved, ceoUserId = 'CEO' } = body;

                if (!approvalId || approved === undefined) {
                    return {
                        status: 400,
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*'
                        },
                        body: JSON.stringify({
                            error: 'approvalId and approved fields are required'
                        })
                    };
                }

                context.log(`[APPROVALS] Processing CEO decision: ${approvalId} = ${approved}`);

                const result = await ileSystem.handleCEOApproval(
                    approvalId,
                    approved,
                    ceoUserId
                );

                return {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*'
                    },
                    body: JSON.stringify({
                        success: true,
                        approval: result
                    })
                };
            }

            // Unknown route
            return {
                status: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*'
                },
                body: JSON.stringify({
                    error: 'Not found'
                })
            };

        } catch (error) {
            context.error('[APPROVALS] Error:', error);

            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*'
                },
                body: JSON.stringify({
                    error: 'Failed to process approval',
                    details: error.message
                })
            };
        }
    }
});
