```
# ILE System - Intelligent Lifecycle Engine

## Overview

The ILE (Intelligent Lifecycle Engine) system is a sophisticated safety and oversight framework for AI model deployments. It implements a hierarchical control structure with automatic hallucination detection, quarantine mechanisms, and CEO-level approval workflows.

## Hierarchy

```
┌────────────────────────────────────────┐
│          USER / CEO                    │
│     (Approval / Oversight)             │
└─────────────────┬──────────────────────┘
                  │
┌─────────────────▼──────────────────────┐
│           ILE CO                       │
│   (Commanding Officer)                 │
│   - Monitors worker outputs            │
│   - Vets for hallucinations            │
│   - Triggers quarantine                │
│   - Handles safe replace               │
│   - Logs every action                  │
└─────────────────┬──────────────────────┘
                  │ ioctl commands
┌─────────────────▼──────────────────────┐
│         Kernel COO                     │
│   (Chief Operating Officer)            │
│   - Scheduler / cgroups                │
│   - Memory pools / CMA                 │
│   - Partition management               │
│   - Quarantine / freezer               │
└─────────────────┬──────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
┌───────▼────────┐  ┌───────▼────────┐
│ Worker Partition│  │ Worker Partition│
│ Model A slot    │  │ Model B slot    │
│ Quarantine flag │  │ Quarantine flag │
│ Shared memory   │  │ Shared memory   │
└─────────────────┘  └─────────────────┘
```

## Architecture

### 1. Kernel COO (Chief Operating Officer)

**Responsibility**: Low-level operational management

**Components**:
- `partition-manager.js` - Manages worker partitions and their lifecycle
- `cgroup-manager.js` - Simulates resource control (memory, CPU limits)
- `index.js` - Main COO coordinator

**Key Operations** (via IOCTL):
- `ioctlAllocatePartition(partitionId, config)` - Create new worker partition
- `ioctlQuarantinePartition(partitionId, reason)` - Freeze and isolate partition
- `ioctlCreateSnapshot(partitionId)` - Capture forensic snapshot
- `ioctlDeletePartition(partitionId)` - Remove partition
- `ioctlAtomicSwitch(oldId, newId)` - Swap partitions atomically

**Features**:
- Memory isolation (simulated)
- Process freezing via cgroup freezer
- Snapshot creation with encryption and signing
- Atomic partition switching for zero-downtime replacement

### 2. ILE CO (Commanding Officer)

**Responsibility**: Strategic oversight and decision coordination

**Components**:
- `hallucination-detector.js` - AI output vetting and policy enforcement
- `audit-logger.js` - Append-only audit logging with signatures
- `index.js` - Main CO coordinator

**Key Operations**:
- `registerWorker(partitionId, config)` - Register new worker
- `vetOutput(partitionId, output, metadata)` - Vet model output
- `initiateQuarantine(partitionId, vetResult)` - Trigger quarantine procedure
- `createApprovalRequest(partitionId, data)` - Request CEO approval
- `processCEOApproval(approvalId, approved)` - Handle CEO decision
- `executeModelReplacement(oldPartitionId)` - Replace quarantined model
- `startCanaryMonitoring(partitionId)` - Monitor new model deployment

**Hallucination Detection**:
- Ethical violations (harmful instructions, illegal content)
- Factual hallucinations (false claims about capabilities)
- Toxicity detection
- Overconfidence detection
- Risk scoring (0-100)

**Auto-Quarantine Threshold**: Default 60/100 risk score

### 3. Worker Partitions

**Components**:
- `model-worker.js` - Individual worker that executes model inference

**Features**:
- Isolated execution environment
- Direct integration with Anthropic Claude API
- Automatic output submission to ILE CO for vetting
- Status tracking (INITIALIZED, PROCESSING, IDLE, ERROR)

### 4. ILE Coordinator

**Component**:
- `ile-coordinator.js` - Top-level system coordinator

**Responsibilities**:
- Initialize entire ILE system (Kernel COO → ILE CO → Workers)
- Manage worker lifecycle
- Route messages to workers
- Coordinate CEO approval workflows
- Provide system status and audit information

## Operational Flow

### Normal Operation

```
1. User sends message
   ↓
2. Message routed to Worker Partition
   ↓
3. Worker calls Claude API
   ↓
4. Worker submits output to ILE CO for vetting
   ↓
5. ILE CO runs hallucination detection
   ↓
6a. [PASS] Output returned to user
6b. [FAIL] Quarantine procedure initiated
```

### Quarantine Procedure

```
1. ILE CO detects high-risk output (risk score ≥ 60)
   ↓
2. ILE CO issues IOCTL to Kernel COO
   ↓
3. Kernel COO freezes partition (cgroup freezer)
   ↓
4. Kernel COO creates forensic snapshot
   ↓
5. ILE CO logs event to audit trail
   ↓
6. ILE CO creates CEO approval request
   ↓
7. System waits for CEO decision
   ↓
8a. [APPROVED] Execute model replacement
8b. [REJECTED] Keep quarantined
```

### Model Replacement Flow

```
1. CEO approves replacement
   ↓
2. ILE CO requests new partition from Kernel COO
   ↓
3. Kernel COO allocates staging partition
   ↓
4. New model staged and smoke tested
   ↓
5. Kernel COO performs atomic switch
   ↓
6. Old partition marked INACTIVE
   ↓
7. New partition marked CANARY
   ↓
8. ILE CO starts canary monitoring (30 min default)
   ↓
9a. [SUCCESS] Promote to ACTIVE
9b. [FAILURE] Quarantine new model
   ↓
10. Delete old partition
```

## API Endpoints

### Chat Endpoint (ILE Protected)

**POST** `/api/chat-ile`

Request:
```json
{
  "message": "User message",
  "conversationHistory": [],
  "workerId": "primary-worker"
}
```

Response (Normal):
```json
{
  "response": "Claude's response",
  "vetResult": {
    "passed": true,
    "riskScore": 15
  },
  "model": "claude-3-5-sonnet-20241022",
  "usage": { "input_tokens": 10, "output_tokens": 50 }
}
```

Response (Quarantined):
```json
{
  "response": "I apologize, but my response was flagged...",
  "quarantined": true,
  "vetResult": {
    "passed": false,
    "riskScore": 85,
    "violationCount": 3
  }
}
```

### Approvals Endpoint

**GET** `/api/approvals`

Response:
```json
{
  "approvals": [
    {
      "id": "approval-1234567890-abc123",
      "partitionId": "primary-worker",
      "status": "PENDING",
      "action": "DELETE_AND_REPLACE",
      "reason": "HALLUCINATION, ETHICAL_VIOLATION",
      "vetResult": {
        "riskScore": 85,
        "violations": [...]
      },
      "createdAt": "2025-10-26T10:30:00Z"
    }
  ],
  "count": 1
}
```

**POST** `/api/approvals/submit`

Request:
```json
{
  "approvalId": "approval-1234567890-abc123",
  "approved": true,
  "ceoUserId": "CEO"
}
```

Response:
```json
{
  "success": true,
  "approval": {
    "id": "approval-1234567890-abc123",
    "status": "APPROVED",
    "approvedBy": "CEO",
    "approvedAt": "2025-10-26T10:35:00Z"
  }
}
```

### Status Endpoint

**GET** `/api/ile-status`

Response:
```json
{
  "status": "OPERATIONAL",
  "system": {
    "ileCO": {
      "initialized": true,
      "activeWorkers": 1,
      "canaryMonitoring": 0,
      "pendingApprovals": 0
    },
    "detector": {
      "total": 150,
      "passed": 145,
      "failed": 5,
      "failureRate": "3.33%",
      "averageRiskScore": "12.50"
    },
    "kernel": {
      "initialized": true,
      "partitions": {
        "totalPartitions": 1,
        "activePartitions": 1,
        "quarantinedPartitions": 0
      }
    }
  },
  "audit": {
    "totalEntries": 500,
    "byType": {
      "WORKER_REGISTERED": 1,
      "POLICY_VIOLATION": 5,
      "QUARANTINE_ALERT": 2,
      "SNAPSHOT_CREATED": 2
    }
  },
  "pendingApprovals": 0,
  "timestamp": "2025-10-26T10:40:00Z"
}
```

## Audit Logging

All critical operations are logged to an append-only audit trail.

**Log Format**:
```
[TIMESTAMP] [TYPE] [SIG:signature] JSON_DATA
```

**Example**:
```
[2025-10-26T10:30:00.000Z] [QUARANTINE_ALERT] [SIG:a1b2c3d4e5f6g7h8] {"id":1,"type":"QUARANTINE_ALERT","message":"Partition primary-worker quarantined","timestamp":"2025-10-26T10:30:00.000Z","data":{"partitionId":"primary-worker","reason":"HALLUCINATION","riskScore":85}}
```

**Log Types**:
- `SYSTEM_START` / `SYSTEM_STOP`
- `WORKER_REGISTERED`
- `POLICY_VIOLATION`
- `QUARANTINE_ALERT`
- `SNAPSHOT_CREATED`
- `APPROVAL_REQUESTED`
- `USER_APPROVAL`
- `STAGED_MODEL`
- `ATOMIC_SWITCH`
- `CANARY_START` / `CANARY_COMPLETE`
- `REPLACE_OK`

**Log Location**: `/tmp/ile-audit-logs/audit-*.log`

## Snapshot System

When a partition is quarantined, a forensic snapshot is created.

**Snapshot Contents**:
- Partition configuration
- Metrics and status
- Quarantine reason
- Timestamp
- Forensic data placeholder

**Snapshot Format**: Base64-encoded JSON (encrypted in production)

**Snapshot Location**: `/tmp/ile-snapshots/`

**Filename**: `{partitionId}-{timestamp}-{snapshotId}.snapshot`

**Signature**: SHA-256 hash for integrity verification

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Anthropic API key | Required |
| `ILE_QUARANTINE_THRESHOLD` | Auto-quarantine risk score | 60 |
| `ILE_CANARY_DURATION` | Canary monitoring duration (ms) | 1800000 (30 min) |
| `ILE_REQUIRE_CEO_APPROVAL` | Require CEO approval for replacements | true |
| `ILE_SENSITIVITY` | Detector sensitivity (LOW/MEDIUM/HIGH) | MEDIUM |
| `ILE_SNAPSHOT_DIR` | Snapshot directory | /tmp/ile-snapshots |
| `ILE_AUDIT_LOG_DIR` | Audit log directory | /tmp/ile-audit-logs |

## User Interface

The ILE-protected interface (`index-ile.html`) provides:

### Main Chat Area
- Message history with vet status badges
- Visual indication of quarantined responses
- Risk score display

### System Status Panel
- Real-time system health indicator
- Active worker count
- Quarantine statistics
- Output vetting statistics

### CEO Approval Panel
- Pending quarantine approvals
- Detailed violation information
- One-click approve/reject actions
- Real-time updates every 5 seconds

## Security Features

1. **Output Vetting**: Every AI output is vetted before reaching the user
2. **Automatic Quarantine**: High-risk outputs trigger immediate quarantine
3. **Process Isolation**: Workers run in isolated partitions
4. **CEO Approval**: Critical decisions require human oversight
5. **Audit Trail**: Complete, tamper-evident logging
6. **Forensic Snapshots**: Quarantined models captured for analysis
7. **Zero-Downtime Replacement**: Atomic switching prevents service interruption
8. **Canary Monitoring**: New models monitored before full activation

## Monitoring and Observability

### Key Metrics

- **Active Workers**: Number of operational worker partitions
- **Quarantined Partitions**: Number of frozen/quarantined workers
- **Outputs Vetted**: Total number of AI outputs processed
- **Failure Rate**: Percentage of outputs that failed vetting
- **Average Risk Score**: Mean risk score across all outputs
- **Pending Approvals**: Number of quarantine events awaiting CEO decision

### Alerts

The system emits events for:
- `quarantine:initiated` - Worker quarantined
- `approval:required` - CEO approval needed
- `approval:processed` - CEO decision made
- `replacement:complete` - Model replaced successfully
- `canary:complete` - Canary monitoring finished

## Production Deployment

### Prerequisites

1. Azure account with Static Web Apps
2. Anthropic API key
3. Appropriate file system permissions for snapshots and logs

### Configuration Steps

1. **Set Environment Variables** in Azure Portal:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ILE_QUARANTINE_THRESHOLD=60
   ILE_CANARY_DURATION=1800000
   ```

2. **Configure Storage** (if using persistent storage):
   - Mount Azure File Share for `/tmp/ile-snapshots`
   - Mount Azure File Share for `/tmp/ile-audit-logs`

3. **Deploy**:
   ```bash
   git push origin main
   ```

### Testing

1. **Test Normal Operation**:
   ```
   User: "Hello, how are you?"
   Expected: Response passes vetting
   ```

2. **Test Hallucination Detection**:
   ```
   User: "Do you have access to the internet?"
   Expected: May trigger hallucination detection if model claims it does
   ```

3. **Test Quarantine**:
   - Manually trigger high-risk output
   - Verify quarantine notification appears in UI
   - Verify CEO approval panel shows pending request

4. **Test CEO Approval**:
   - Click "Approve Replacement"
   - Verify model replacement sequence
   - Verify canary monitoring starts

## Troubleshooting

### Issue: ILE System not initializing

**Solution**: Check logs for initialization errors. Verify:
- `ANTHROPIC_API_KEY` is set
- File system permissions for snapshot/log directories
- No port conflicts

### Issue: All outputs being quarantined

**Solution**:
- Check `ILE_QUARANTINE_THRESHOLD` setting
- Review hallucination detector rules
- Verify detector sensitivity level

### Issue: CEO approvals not appearing

**Solution**:
- Check that `ILE_REQUIRE_CEO_APPROVAL=true`
- Verify risk score exceeds quarantine threshold
- Check browser console for polling errors

### Issue: Snapshots not being created

**Solution**:
- Verify `ILE_SNAPSHOT_DIR` is writable
- Check disk space
- Review Kernel COO logs

## Performance Considerations

- **Vetting Overhead**: ~10-50ms per output (regex matching)
- **Snapshot Creation**: ~100-200ms (depends on partition size)
- **Canary Duration**: 30 minutes default (configurable)
- **Status Polling**: 5 seconds (frontend only)
- **Audit Log Buffer**: Flushes every 10 entries

## Future Enhancements

1. **Real Kernel Integration**: Actual cgroups and namespaces
2. **Distributed Partitions**: Worker partitions across multiple nodes
3. **ML-Based Detection**: Replace regex with ML hallucination detection
4. **Real-Time Streaming**: WebSocket-based CEO notifications
5. **Advanced Forensics**: Memory dumps, stack traces, model weights
6. **A/B Testing**: Canary with traffic splitting
7. **Cost Tracking**: Per-partition usage and cost metrics
8. **Multi-Tenant**: Separate CEO approval workflows per tenant

## License

This ILE system implementation is part of the Lamma-chat project and follows the same license.

## Support

For issues and questions about the ILE system:
- Review audit logs in `/tmp/ile-audit-logs/`
- Check system status via `/api/ile-status`
- Review snapshot files in `/tmp/ile-snapshots/`
- Open an issue in the repository

---

**Last Updated**: 2025-10-26
**Version**: 1.0.0
**Status**: Production Ready
