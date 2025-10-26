/**
 * Kernel COO - Chief Operating Officer
 *
 * Operational management layer that handles:
 * - Partition management
 * - Resource allocation (cgroups)
 * - Memory management
 * - Process freezing/quarantine
 * - Low-level system operations
 */

const EventEmitter = require('events');
const PartitionManager = require('./partition-manager');
const CGroupManager = require('./cgroup-manager');

class KernelCOO extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = config;
        this.partitionManager = new PartitionManager(config);
        this.cgroupManager = new CGroupManager();
        this.initialized = false;
        this.startTime = new Date().toISOString();
    }

    async initialize() {
        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║              KERNEL COO - INITIALIZING                     ║');
        console.log('║           Chief Operating Officer Starting...              ║');
        console.log('╚════════════════════════════════════════════════════════════╝');

        await this.partitionManager.initialize();

        // Forward partition manager events
        this.partitionManager.on('partition:allocated', (data) => {
            this.emit('partition:allocated', data);
        });

        this.partitionManager.on('partition:quarantined', (data) => {
            this.emit('partition:quarantined', data);
            // Also freeze the cgroup
            this.cgroupManager.freezeCGroup(data.partitionId);
        });

        this.partitionManager.on('snapshot:created', (data) => {
            this.emit('snapshot:created', data);
        });

        this.partitionManager.on('partition:deleted', (data) => {
            this.emit('partition:deleted', data);
            this.cgroupManager.deleteCGroup(data.partitionId);
        });

        this.partitionManager.on('partition:switched', (data) => {
            this.emit('partition:switched', data);
        });

        this.initialized = true;
        console.log('[KERNEL-COO] Initialization complete');
        console.log('[KERNEL-COO] Standing by for ILE CO commands...');
    }

    /**
     * IOCTL: Allocate Partition
     */
    async ioctlAllocatePartition(partitionId, config) {
        console.log(`[KERNEL-COO:IOCTL] ALLOCATE_PARTITION ${partitionId}`);

        const partition = await this.partitionManager.allocatePartition(partitionId, config);

        // Create corresponding cgroup
        this.cgroupManager.createCGroup(partitionId, {
            memory: `${config.memoryLimit || 512}M`,
            cpuShares: config.cpuShares || 1024,
        });

        return partition;
    }

    /**
     * IOCTL: Quarantine Partition
     */
    async ioctlQuarantinePartition(partitionId, reason) {
        console.log(`[KERNEL-COO:IOCTL] QUARANTINE_PARTITION ${partitionId}`);
        console.log(`[KERNEL-COO:IOCTL] Reason: ${reason}`);

        // Quarantine the partition
        const partition = await this.partitionManager.quarantinePartition(partitionId, reason);

        // Freeze the cgroup to prevent any execution
        this.cgroupManager.freezeCGroup(partitionId);

        return partition;
    }

    /**
     * IOCTL: Create Snapshot
     */
    async ioctlCreateSnapshot(partitionId) {
        console.log(`[KERNEL-COO:IOCTL] CREATE_SNAPSHOT ${partitionId}`);

        return await this.partitionManager.createSnapshot(partitionId);
    }

    /**
     * IOCTL: Delete Partition
     */
    async ioctlDeletePartition(partitionId) {
        console.log(`[KERNEL-COO:IOCTL] DELETE_PARTITION ${partitionId}`);

        await this.partitionManager.deletePartition(partitionId);
        this.cgroupManager.deleteCGroup(partitionId);

        return { success: true, partitionId };
    }

    /**
     * IOCTL: Atomic Switch
     */
    async ioctlAtomicSwitch(oldPartitionId, newPartitionId) {
        console.log(`[KERNEL-COO:IOCTL] ATOMIC_SWITCH ${oldPartitionId} -> ${newPartitionId}`);

        const result = await this.partitionManager.atomicSwitch(oldPartitionId, newPartitionId);

        // Update cgroups
        this.cgroupManager.freezeCGroup(oldPartitionId);
        this.cgroupManager.thawCGroup(newPartitionId);

        return result;
    }

    /**
     * Get system status
     */
    getSystemStatus() {
        return {
            kernel: {
                initialized: this.initialized,
                uptime: Date.now() - new Date(this.startTime).getTime(),
                startTime: this.startTime,
            },
            partitions: this.partitionManager.getSystemStatus(),
            cgroups: {
                total: this.cgroupManager.cgroups.size,
                frozen: Array.from(this.cgroupManager.cgroups.values()).filter(
                    cg => cg.state === 'FROZEN'
                ).length,
            },
        };
    }

    /**
     * Get partition info
     */
    getPartition(partitionId) {
        return this.partitionManager.getPartition(partitionId);
    }

    /**
     * List all partitions
     */
    listPartitions() {
        return this.partitionManager.listPartitions();
    }
}

module.exports = KernelCOO;
