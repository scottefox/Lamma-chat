/**
 * ILE System Coordinator
 *
 * Main coordinator that initializes and manages:
 * - Kernel COO (operational layer)
 * - ILE CO (command layer)
 * - Worker partitions
 * - CEO approval workflows
 */

const EventEmitter = require('events');
const KernelCOO = require('./kernel-coo');
const ILECO = require('./ile-co');
const ModelWorker = require('./worker/model-worker');

class ILECoordinator extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = config;

        // Initialize layers
        this.kernelCOO = new KernelCOO(config.kernel);
        this.ileCO = new ILECO(this.kernelCOO, config.ileCO);

        this.workers = new Map();
        this.initialized = false;

        // Forward events
        this.ileCO.on('quarantine:initiated', (data) => {
            this.emit('quarantine:initiated', data);
        });

        this.ileCO.on('approval:required', (approval) => {
            this.emit('approval:required', approval);
        });

        this.ileCO.on('approval:processed', (approval) => {
            this.emit('approval:processed', approval);
        });

        this.ileCO.on('replacement:complete', (data) => {
            this.emit('replacement:complete', data);
        });

        this.ileCO.on('canary:complete', (data) => {
            this.emit('canary:complete', data);
        });
    }

    /**
     * Initialize the entire ILE system
     */
    async initialize() {
        console.log('');
        console.log('╔══════════════════════════════════════════════════════════════╗');
        console.log('║                                                              ║');
        console.log('║          ILE SYSTEM - INTELLIGENT LIFECYCLE ENGINE           ║');
        console.log('║                                                              ║');
        console.log('║                    System Boot Sequence                      ║');
        console.log('║                                                              ║');
        console.log('╚══════════════════════════════════════════════════════════════╝');
        console.log('');

        // Step 1: Initialize Kernel COO
        console.log('[ILE-SYSTEM] Step 1: Initializing Kernel COO...');
        await this.kernelCOO.initialize();

        // Step 2: Initialize ILE CO
        console.log('[ILE-SYSTEM] Step 2: Initializing ILE CO...');
        await this.ileCO.initialize();

        this.initialized = true;

        console.log('');
        console.log('╔══════════════════════════════════════════════════════════════╗');
        console.log('║                 ILE SYSTEM INITIALIZATION                    ║');
        console.log('║                        COMPLETE                              ║');
        console.log('║                                                              ║');
        console.log('║  Hierarchy:                                                  ║');
        console.log('║    USER (CEO)        - Approval / Oversight                  ║');
        console.log('║       ↓                                                      ║');
        console.log('║    ILE CO            - Strategic Oversight                   ║');
        console.log('║       ↓                                                      ║');
        console.log('║    Kernel COO        - Operational Management                ║');
        console.log('║       ↓                                                      ║');
        console.log('║    Worker Partitions - Model Execution                       ║');
        console.log('║                                                              ║');
        console.log('║  Status: READY                                               ║');
        console.log('╚══════════════════════════════════════════════════════════════╝');
        console.log('');

        this.emit('initialized');
    }

    /**
     * Create a new worker partition
     */
    async createWorker(workerId, config = {}) {
        if (!this.initialized) {
            throw new Error('ILE System not initialized');
        }

        console.log(`[ILE-SYSTEM] Creating worker: ${workerId}`);

        // Register with ILE CO
        await this.ileCO.registerWorker(workerId, {
            modelId: config.modelId || 'claude-3-5-sonnet-20241022',
            memoryLimit: config.memoryLimit || 512,
            cpuShares: config.cpuShares || 1024,
        });

        // Create worker instance
        const worker = new ModelWorker(workerId, this.ileCO, config);

        this.workers.set(workerId, worker);

        console.log(`[ILE-SYSTEM] Worker ${workerId} created and registered`);

        return worker;
    }

    /**
     * Process a message through a worker
     */
    async processMessage(workerId, message, conversationHistory = []) {
        const worker = this.workers.get(workerId);

        if (!worker) {
            throw new Error(`Worker ${workerId} not found`);
        }

        return await worker.processMessage(message, conversationHistory);
    }

    /**
     * Handle CEO approval
     */
    async handleCEOApproval(approvalId, approved, ceoUserId = 'CEO') {
        return await this.ileCO.processCEOApproval(approvalId, approved, ceoUserId);
    }

    /**
     * Get pending approvals for CEO
     */
    getPendingApprovals() {
        return this.ileCO.getPendingApprovals();
    }

    /**
     * Get system status
     */
    getSystemStatus() {
        return this.ileCO.getSystemStatus();
    }

    /**
     * Get audit statistics
     */
    async getAuditStatistics() {
        return await this.ileCO.getAuditStatistics();
    }

    /**
     * Shutdown system
     */
    async shutdown() {
        console.log('[ILE-SYSTEM] Shutting down...');

        await this.ileCO.shutdown();

        console.log('[ILE-SYSTEM] Shutdown complete');
    }
}

module.exports = ILECoordinator;
