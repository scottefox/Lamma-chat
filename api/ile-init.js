/**
 * ILE System Initialization
 * Singleton instance for Azure Functions
 */

const ILECoordinator = require('../ile-system/ile-coordinator');

let ileInstance = null;
let initializationPromise = null;

async function getILESystem() {
    // Return existing instance if already initialized
    if (ileInstance && ileInstance.initialized) {
        return ileInstance;
    }

    // Wait for ongoing initialization
    if (initializationPromise) {
        await initializationPromise;
        return ileInstance;
    }

    // Start new initialization
    initializationPromise = (async () => {
        console.log('[AZURE-ILE] Starting ILE System initialization...');

        const config = {
            kernel: {
                maxPartitions: 10,
                memoryLimitMB: 512,
                snapshotDir: process.env.ILE_SNAPSHOT_DIR || '/tmp/ile-snapshots',
            },
            ileCO: {
                autoQuarantineThreshold: parseInt(process.env.ILE_QUARANTINE_THRESHOLD) || 60,
                canaryDuration: parseInt(process.env.ILE_CANARY_DURATION) || 30 * 60 * 1000,
                requireCEOApproval: process.env.ILE_REQUIRE_CEO_APPROVAL !== 'false',
                detector: {
                    sensitivityLevel: process.env.ILE_SENSITIVITY || 'MEDIUM',
                    enableEthicsCheck: true,
                    enableFactCheck: true,
                    enableToxicityCheck: true,
                },
                audit: {
                    logDir: process.env.ILE_AUDIT_LOG_DIR || '/tmp/ile-audit-logs',
                    maxLogSizeMB: 100,
                    enableEncryption: true,
                    enableSigning: true,
                },
            },
        };

        ileInstance = new ILECoordinator(config);
        await ileInstance.initialize();

        // Create default worker
        console.log('[AZURE-ILE] Creating default worker partition...');
        await ileInstance.createWorker('primary-worker', {
            modelId: 'claude-3-5-sonnet-20241022',
            apiKey: process.env.ANTHROPIC_API_KEY,
            maxTokens: 1024,
        });

        console.log('[AZURE-ILE] ILE System initialization complete');

        return ileInstance;
    })();

    await initializationPromise;
    initializationPromise = null;

    return ileInstance;
}

module.exports = { getILESystem };
