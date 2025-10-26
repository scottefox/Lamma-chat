/**
 * ILE CO - Audit Logger
 *
 * Append-only audit logging system for all critical operations
 * Ensures complete traceability and forensic capabilities
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class AuditLogger {
    constructor(config = {}) {
        this.config = {
            logDir: config.logDir || '/tmp/ile-audit-logs',
            maxLogSizeMB: config.maxLogSizeMB || 100,
            enableEncryption: config.enableEncryption !== false,
            enableSigning: config.enableSigning !== false,
            ...config
        };

        this.currentLogFile = null;
        this.logBuffer = [];
        this.logCount = 0;
    }

    async initialize() {
        console.log('[ILE-CO:AUDIT] Initializing Audit Logger...');

        // Create log directory
        try {
            await fs.mkdir(this.config.logDir, { recursive: true });
        } catch (error) {
            console.error('[ILE-CO:AUDIT] Failed to create log directory:', error);
        }

        // Create new log file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        this.currentLogFile = path.join(this.config.logDir, `audit-${timestamp}.log`);

        // Write header
        await this.writeLogEntry({
            type: 'SYSTEM_START',
            message: 'ILE Audit Logger initialized',
            timestamp: new Date().toISOString(),
            logFile: this.currentLogFile,
        });

        console.log(`[ILE-CO:AUDIT] Logging to: ${this.currentLogFile}`);
    }

    /**
     * Log an event
     */
    async log(type, message, data = {}) {
        const entry = {
            id: ++this.logCount,
            type,
            message,
            timestamp: new Date().toISOString(),
            data,
        };

        await this.writeLogEntry(entry);

        return entry;
    }

    /**
     * Write log entry to file (append-only)
     */
    async writeLogEntry(entry) {
        // Format entry
        const formatted = this.formatLogEntry(entry);

        // Buffer for performance
        this.logBuffer.push(formatted);

        // Flush if buffer is large enough
        if (this.logBuffer.length >= 10) {
            await this.flush();
        }
    }

    /**
     * Format log entry
     */
    formatLogEntry(entry) {
        // Create JSON log line
        const logLine = JSON.stringify(entry);

        // Generate signature if enabled
        let signature = '';
        if (this.config.enableSigning) {
            signature = crypto
                .createHash('sha256')
                .update(logLine)
                .digest('hex')
                .substring(0, 16);
        }

        // Format: [TIMESTAMP] [TYPE] [SIG:signature] JSON
        return `[${entry.timestamp}] [${entry.type}] [SIG:${signature}] ${logLine}\n`;
    }

    /**
     * Flush buffer to disk
     */
    async flush() {
        if (this.logBuffer.length === 0) {
            return;
        }

        try {
            const content = this.logBuffer.join('');
            await fs.appendFile(this.currentLogFile, content);
            this.logBuffer = [];
        } catch (error) {
            console.error('[ILE-CO:AUDIT] Failed to flush log buffer:', error);
        }
    }

    /**
     * Specialized logging methods
     */

    async logQuarantine(partitionId, reason, metadata = {}) {
        return await this.log('QUARANTINE_ALERT', `Partition ${partitionId} quarantined`, {
            partitionId,
            reason,
            ...metadata,
        });
    }

    async logSnapshot(partitionId, snapshotPath, signature) {
        return await this.log('SNAPSHOT_CREATED', `Snapshot created for ${partitionId}`, {
            partitionId,
            path: snapshotPath,
            signature,
        });
    }

    async logModelStaged(modelId, metadata = {}) {
        return await this.log('STAGED_MODEL', `Model ${modelId} staged for deployment`, {
            modelId,
            smokeTest: metadata.smokeTest || 'PENDING',
            ...metadata,
        });
    }

    async logAtomicSwitch(oldModelId, newModelId) {
        return await this.log('ATOMIC_SWITCH', `Model switched: ${oldModelId} -> ${newModelId}`, {
            oldModelId,
            newModelId,
        });
    }

    async logReplaceOK(modelId, metadata = {}) {
        return await this.log('REPLACE_OK', `Model ${modelId} replacement successful`, {
            modelId,
            ...metadata,
        });
    }

    async logUserApproval(action, approved, userId = 'CEO') {
        return await this.log('USER_APPROVAL', `User ${approved ? 'approved' : 'rejected'} ${action}`, {
            action,
            approved,
            userId,
        });
    }

    async logViolation(partitionId, violations) {
        return await this.log('POLICY_VIOLATION', `Policy violations detected in ${partitionId}`, {
            partitionId,
            violationCount: violations.length,
            violations: violations.map(v => ({
                type: v.type,
                severity: v.severity,
                description: v.description,
            })),
        });
    }

    async logCanaryStart(partitionId, duration) {
        return await this.log('CANARY_START', `Canary monitoring started for ${partitionId}`, {
            partitionId,
            durationMs: duration,
        });
    }

    async logCanaryComplete(partitionId, result) {
        return await this.log('CANARY_COMPLETE', `Canary monitoring completed for ${partitionId}`, {
            partitionId,
            result,
        });
    }

    /**
     * Read audit logs (for forensics)
     */
    async readLogs(options = {}) {
        const { limit = 100, type = null } = options;

        try {
            const content = await fs.readFile(this.currentLogFile, 'utf-8');
            let lines = content.split('\n').filter(line => line.trim());

            // Filter by type if specified
            if (type) {
                lines = lines.filter(line => line.includes(`[${type}]`));
            }

            // Limit results
            lines = lines.slice(-limit);

            // Parse JSON from each line
            const entries = lines.map(line => {
                try {
                    const jsonStart = line.indexOf('{');
                    if (jsonStart === -1) return null;
                    return JSON.parse(line.substring(jsonStart));
                } catch (error) {
                    return null;
                }
            }).filter(entry => entry !== null);

            return entries;
        } catch (error) {
            console.error('[ILE-CO:AUDIT] Failed to read logs:', error);
            return [];
        }
    }

    /**
     * Get audit statistics
     */
    async getStatistics() {
        const logs = await this.readLogs({ limit: 10000 });

        const stats = {
            totalEntries: logs.length,
            byType: {},
            recentActivity: logs.slice(-10),
        };

        // Count by type
        logs.forEach(entry => {
            stats.byType[entry.type] = (stats.byType[entry.type] || 0) + 1;
        });

        return stats;
    }

    /**
     * Close and finalize logs
     */
    async close() {
        await this.flush();

        await this.log('SYSTEM_STOP', 'ILE Audit Logger shutting down', {
            totalEntries: this.logCount,
        });

        await this.flush();

        console.log('[ILE-CO:AUDIT] Audit logger closed');
    }
}

module.exports = AuditLogger;
