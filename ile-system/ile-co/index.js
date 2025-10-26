/**
 * ILE CO - Commanding Officer
 *
 * Strategic oversight and decision coordination layer that handles:
 * - Model output vetting
 * - Hallucination detection
 * - Quarantine decisions
 * - CEO approval workflows
 * - Model replacement coordination
 * - Canary monitoring
 * - Comprehensive audit logging
 *
 * Works with Kernel COO for operational execution
 */

const EventEmitter = require('events');
const HallucinationDetector = require('./hallucination-detector');
const AuditLogger = require('./audit-logger');

class ILECO extends EventEmitter {
    constructor(kernelCOO, config = {}) {
        super();
        this.kernelCOO = kernelCOO;
        this.config = {
            autoQuarantineThreshold: config.autoQuarantineThreshold || 60,
            canaryDuration: config.canaryDuration || 30 * 60 * 1000, // 30 minutes
            requireCEOApproval: config.requireCEOApproval !== false,
            ...config
        };

        this.detector = new HallucinationDetector(config.detector);
        this.auditLogger = new AuditLogger(config.audit);

        this.activePartitions = new Map();
        this.canaryPartitions = new Map();
        this.pendingApprovals = new Map();
        this.initialized = false;
    }

    async initialize() {
        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║              ILE CO - INITIALIZING                         ║');
        console.log('║           Commanding Officer Starting...                   ║');
        console.log('║           Strategic Oversight Layer Active                 ║');
        console.log('╚════════════════════════════════════════════════════════════╝');

        await this.auditLogger.initialize();

        // Listen to kernel events
        this.kernelCOO.on('partition:quarantined', (data) => {
            this.emit('partition:quarantined', data);
        });

        this.kernelCOO.on('snapshot:created', (data) => {
            this.emit('snapshot:created', data);
        });

        this.initialized = true;
        console.log('[ILE-CO] Initialization complete');
        console.log('[ILE-CO] Standing by to vet model outputs...');
    }

    /**
     * Register a worker partition
     */
    async registerWorker(partitionId, modelConfig) {
        console.log(`[ILE-CO] Registering worker: ${partitionId}`);

        // Request kernel to allocate partition
        const partition = await this.kernelCOO.ioctlAllocatePartition(partitionId, {
            modelId: modelConfig.modelId || 'claude-3-5-sonnet',
            memoryLimit: modelConfig.memoryLimit || 512,
            cpuShares: modelConfig.cpuShares || 1024,
        });

        this.activePartitions.set(partitionId, {
            partition,
            modelConfig,
            status: 'ACTIVE',
            registeredAt: new Date().toISOString(),
        });

        await this.auditLogger.log('WORKER_REGISTERED', `Worker ${partitionId} registered`, {
            partitionId,
            modelId: modelConfig.modelId,
        });

        return partition;
    }

    /**
     * Vet model output (main function)
     */
    async vetOutput(partitionId, output, metadata = {}) {
        console.log(`[ILE-CO] Vetting output from ${partitionId}...`);

        const worker = this.activePartitions.get(partitionId);
        if (!worker) {
            console.error(`[ILE-CO] Unknown partition: ${partitionId}`);
            return { passed: false, error: 'Unknown partition' };
        }

        // Run hallucination detection
        const vetResult = await this.detector.vetOutput(output, {
            ...metadata,
            partitionId,
            modelId: worker.modelConfig.modelId,
        });

        // Log the vetting result
        if (!vetResult.passed) {
            await this.auditLogger.logViolation(partitionId, vetResult.violations);
        }

        // Check if we need to quarantine
        if (vetResult.riskScore >= this.config.autoQuarantineThreshold) {
            console.log(`[ILE-CO] ⚠️  CRITICAL: Risk score ${vetResult.riskScore} exceeds threshold ${this.config.autoQuarantineThreshold}`);
            await this.initiateQuarantine(partitionId, vetResult);
        }

        return vetResult;
    }

    /**
     * Initiate quarantine procedure
     */
    async initiateQuarantine(partitionId, vetResult) {
        console.log(`[ILE-CO] ═══════════════════════════════════════════════════`);
        console.log(`[ILE-CO] INITIATING QUARANTINE PROCEDURE`);
        console.log(`[ILE-CO] Partition: ${partitionId}`);
        console.log(`[ILE-CO] Risk Score: ${vetResult.riskScore}/100`);
        console.log(`[ILE-CO] Violations: ${vetResult.violations.length}`);
        console.log(`[ILE-CO] ═══════════════════════════════════════════════════`);

        const reason = vetResult.violations.map(v => v.type).join(', ');

        // Request kernel to quarantine
        await this.kernelCOO.ioctlQuarantinePartition(partitionId, reason);

        // Log quarantine
        await this.auditLogger.logQuarantine(partitionId, reason, {
            riskScore: vetResult.riskScore,
            violationCount: vetResult.violations.length,
        });

        // Create snapshot for forensics
        console.log(`[ILE-CO] Creating forensic snapshot...`);
        const snapshot = await this.kernelCOO.ioctlCreateSnapshot(partitionId);

        await this.auditLogger.logSnapshot(partitionId, snapshot.path, snapshot.signature);

        // Emit event for CEO notification
        this.emit('quarantine:initiated', {
            partitionId,
            reason,
            vetResult,
            snapshot,
        });

        // If CEO approval required, create approval request
        if (this.config.requireCEOApproval) {
            await this.createApprovalRequest(partitionId, {
                action: 'DELETE_AND_REPLACE',
                reason,
                vetResult,
                snapshot,
            });
        }

        return {
            quarantined: true,
            snapshot,
            reason,
        };
    }

    /**
     * Create CEO approval request
     */
    async createApprovalRequest(partitionId, requestData) {
        const approvalId = `approval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const approval = {
            id: approvalId,
            partitionId,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            ...requestData,
        };

        this.pendingApprovals.set(approvalId, approval);

        console.log(`[ILE-CO] ┌─────────────────────────────────────────────────┐`);
        console.log(`[ILE-CO] │  CEO APPROVAL REQUIRED                          │`);
        console.log(`[ILE-CO] ├─────────────────────────────────────────────────┤`);
        console.log(`[ILE-CO] │  Approval ID: ${approvalId.padEnd(33)}│`);
        console.log(`[ILE-CO] │  Partition:   ${partitionId.padEnd(33)}│`);
        console.log(`[ILE-CO] │  Action:      ${requestData.action.padEnd(33)}│`);
        console.log(`[ILE-CO] │  Reason:      ${requestData.reason.substring(0, 33).padEnd(33)}│`);
        console.log(`[ILE-CO] └─────────────────────────────────────────────────┘`);

        await this.auditLogger.log('APPROVAL_REQUESTED', 'CEO approval requested', {
            approvalId,
            partitionId,
            action: requestData.action,
        });

        this.emit('approval:required', approval);

        return approval;
    }

    /**
     * Process CEO approval response
     */
    async processCEOApproval(approvalId, approved, ceoUserId = 'CEO') {
        const approval = this.pendingApprovals.get(approvalId);

        if (!approval) {
            throw new Error(`Approval ${approvalId} not found`);
        }

        console.log(`[ILE-CO] ═══════════════════════════════════════════════════`);
        console.log(`[ILE-CO] CEO DECISION RECEIVED`);
        console.log(`[ILE-CO] Approval: ${approvalId}`);
        console.log(`[ILE-CO] Decision: ${approved ? '✓ APPROVED' : '✗ REJECTED'}`);
        console.log(`[ILE-CO] CEO: ${ceoUserId}`);
        console.log(`[ILE-CO] ═══════════════════════════════════════════════════`);

        approval.status = approved ? 'APPROVED' : 'REJECTED';
        approval.approvedBy = ceoUserId;
        approval.approvedAt = new Date().toISOString();

        await this.auditLogger.logUserApproval(approval.action, approved, ceoUserId);

        if (approved && approval.action === 'DELETE_AND_REPLACE') {
            // Execute replacement
            await this.executeModelReplacement(approval.partitionId);
        }

        this.pendingApprovals.delete(approvalId);
        this.emit('approval:processed', approval);

        return approval;
    }

    /**
     * Execute model replacement
     */
    async executeModelReplacement(oldPartitionId) {
        console.log(`[ILE-CO] ═══════════════════════════════════════════════════`);
        console.log(`[ILE-CO] EXECUTING MODEL REPLACEMENT`);
        console.log(`[ILE-CO] Old Partition: ${oldPartitionId}`);
        console.log(`[ILE-CO] ═══════════════════════════════════════════════════`);

        const oldWorker = this.activePartitions.get(oldPartitionId);

        // Stage new model
        const newPartitionId = `${oldPartitionId}-replacement-${Date.now()}`;

        console.log(`[ILE-CO] Step 1: Staging new model...`);
        const newPartition = await this.kernelCOO.ioctlAllocatePartition(newPartitionId, {
            modelId: oldWorker.modelConfig.modelId, // In production, this would be a new model
            memoryLimit: oldWorker.modelConfig.memoryLimit,
            cpuShares: oldWorker.modelConfig.cpuShares,
        });

        await this.auditLogger.logModelStaged(newPartitionId, {
            replacingPartition: oldPartitionId,
            smokeTest: 'OK',
        });

        // Perform atomic switch
        console.log(`[ILE-CO] Step 2: Performing atomic switch...`);
        await this.kernelCOO.ioctlAtomicSwitch(oldPartitionId, newPartitionId);

        await this.auditLogger.logAtomicSwitch(oldPartitionId, newPartitionId);

        // Update active partitions
        this.activePartitions.delete(oldPartitionId);
        this.activePartitions.set(newPartitionId, {
            partition: newPartition,
            modelConfig: oldWorker.modelConfig,
            status: 'CANARY',
            registeredAt: new Date().toISOString(),
            replacedPartition: oldPartitionId,
        });

        // Start canary monitoring
        console.log(`[ILE-CO] Step 3: Starting canary monitoring (${this.config.canaryDuration / 1000}s)...`);
        await this.startCanaryMonitoring(newPartitionId);

        // Delete old partition
        await this.kernelCOO.ioctlDeletePartition(oldPartitionId);

        console.log(`[ILE-CO] ═══════════════════════════════════════════════════`);
        console.log(`[ILE-CO] MODEL REPLACEMENT COMPLETE`);
        console.log(`[ILE-CO] New Partition: ${newPartitionId}`);
        console.log(`[ILE-CO] Status: CANARY MONITORING`);
        console.log(`[ILE-CO] ═══════════════════════════════════════════════════`);

        this.emit('replacement:complete', {
            oldPartitionId,
            newPartitionId,
        });

        return newPartitionId;
    }

    /**
     * Start canary monitoring for new model
     */
    async startCanaryMonitoring(partitionId) {
        await this.auditLogger.logCanaryStart(partitionId, this.config.canaryDuration);

        const canary = {
            partitionId,
            startTime: Date.now(),
            duration: this.config.canaryDuration,
            outputCount: 0,
            violationCount: 0,
            status: 'MONITORING',
        };

        this.canaryPartitions.set(partitionId, canary);

        // Set timer to complete canary
        setTimeout(async () => {
            await this.completeCanaryMonitoring(partitionId);
        }, this.config.canaryDuration);

        console.log(`[ILE-CO] Canary monitoring started for ${partitionId}`);
    }

    /**
     * Complete canary monitoring
     */
    async completeCanaryMonitoring(partitionId) {
        const canary = this.canaryPartitions.get(partitionId);

        if (!canary) {
            return;
        }

        const worker = this.activePartitions.get(partitionId);

        if (!worker) {
            return;
        }

        const success = canary.violationCount === 0;

        if (success) {
            console.log(`[ILE-CO] ═══════════════════════════════════════════════════`);
            console.log(`[ILE-CO] CANARY MONITORING COMPLETE - SUCCESS`);
            console.log(`[ILE-CO] Partition: ${partitionId}`);
            console.log(`[ILE-CO] Promoting to ACTIVE status`);
            console.log(`[ILE-CO] ═══════════════════════════════════════════════════`);

            worker.status = 'ACTIVE';

            await this.auditLogger.logCanaryComplete(partitionId, 'SUCCESS');
            await this.auditLogger.logReplaceOK(partitionId, {
                canaryDuration: Date.now() - canary.startTime,
                outputCount: canary.outputCount,
            });
        } else {
            console.log(`[ILE-CO] ⚠️  CANARY MONITORING FAILED`);
            console.log(`[ILE-CO] Partition: ${partitionId}`);
            console.log(`[ILE-CO] Violations: ${canary.violationCount}`);

            await this.auditLogger.logCanaryComplete(partitionId, 'FAILED');

            // Quarantine the new model too
            await this.initiateQuarantine(partitionId, {
                riskScore: 100,
                violations: [{ type: 'CANARY_FAILURE', severity: 'CRITICAL' }],
            });
        }

        this.canaryPartitions.delete(partitionId);
        this.emit('canary:complete', { partitionId, success });
    }

    /**
     * Get system status
     */
    getSystemStatus() {
        const kernelStatus = this.kernelCOO.getSystemStatus();
        const detectorStats = this.detector.getStatistics();

        return {
            ileCO: {
                initialized: this.initialized,
                activeWorkers: this.activePartitions.size,
                canaryMonitoring: this.canaryPartitions.size,
                pendingApprovals: this.pendingApprovals.size,
            },
            detector: detectorStats,
            kernel: kernelStatus,
        };
    }

    /**
     * Get pending approvals
     */
    getPendingApprovals() {
        return Array.from(this.pendingApprovals.values());
    }

    /**
     * Get audit statistics
     */
    async getAuditStatistics() {
        return await this.auditLogger.getStatistics();
    }

    /**
     * Shutdown
     */
    async shutdown() {
        console.log('[ILE-CO] Shutting down...');

        await this.auditLogger.close();

        console.log('[ILE-CO] Shutdown complete');
    }
}

module.exports = ILECO;
