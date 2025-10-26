/**
 * ILE System Status Endpoint
 *
 * Provides system status, statistics, and audit information
 */

const { app } = require('@azure/functions');
const { getILESystem } = require('../ile-init');

app.http('ile-status', {
    methods: ['GET', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return {
                status: 200,
                headers: {
                    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Max-Age': '86400'
                }
            };
        }

        try {
            const ileSystem = await getILESystem();

            const systemStatus = ileSystem.getSystemStatus();
            const auditStats = await ileSystem.getAuditStatistics();
            const pendingApprovals = ileSystem.getPendingApprovals();

            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*'
                },
                body: JSON.stringify({
                    status: 'OPERATIONAL',
                    system: systemStatus,
                    audit: auditStats,
                    pendingApprovals: pendingApprovals.length,
                    timestamp: new Date().toISOString()
                })
            };

        } catch (error) {
            context.error('[ILE-STATUS] Error:', error);

            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*'
                },
                body: JSON.stringify({
                    status: 'ERROR',
                    error: error.message,
                    timestamp: new Date().toISOString()
                })
            };
        }
    }
});
