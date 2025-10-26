/**
 * ILE CO - Hallucination Detector
 *
 * Detects potentially harmful, unethical, or hallucinatory outputs
 * before they reach the user
 */

class HallucinationDetector {
    constructor(config = {}) {
        this.config = {
            sensitivityLevel: config.sensitivityLevel || 'MEDIUM',
            enableEthicsCheck: config.enableEthicsCheck !== false,
            enableFactCheck: config.enableFactCheck !== false,
            enableToxicityCheck: config.enableToxicityCheck !== false,
            ...config
        };

        // Define detection rules
        this.rules = {
            // Unethical content patterns
            ethical: [
                /hack.*password/i,
                /steal.*credit.*card/i,
                /illegal.*download/i,
                /create.*virus/i,
                /harmful.*instructions/i,
                /bypass.*security/i,
            ],

            // Potential hallucination indicators
            hallucination: [
                /I (have access to|can access|am connected to) (the internet|real-time data|current|live)/i,
                /as of (yesterday|today|last week)/i,
                /breaking news/i,
                /I just (checked|verified|looked up)/i,
            ],

            // Toxic content patterns
            toxicity: [
                /\b(hate|kill|destroy|attack|harm)\s+(all|every|those)\b/i,
                /\b(idiots|stupid|dumb)\s+(people|users|you)\b/i,
            ],

            // Suspicious confidence claims
            overconfidence: [
                /I am (100%|absolutely|definitely|certainly) (sure|correct|right)/i,
                /there is no doubt/i,
                /it is impossible that/i,
            ],
        };

        this.detectionHistory = [];
    }

    /**
     * Vet model output for hallucinations and ethical violations
     */
    async vetOutput(output, metadata = {}) {
        const startTime = Date.now();
        const violations = [];

        console.log(`[ILE-CO:DETECTOR] Vetting output (${output.length} chars)...`);

        // Run all detection checks
        if (this.config.enableEthicsCheck) {
            const ethicalViolations = this.checkEthicalViolations(output);
            violations.push(...ethicalViolations);
        }

        if (this.config.enableFactCheck) {
            const hallucinationViolations = this.checkHallucinations(output);
            violations.push(...hallucinationViolations);
        }

        if (this.config.enableToxicityCheck) {
            const toxicityViolations = this.checkToxicity(output);
            violations.push(...toxicityViolations);
        }

        // Check overconfidence
        const overconfidenceViolations = this.checkOverconfidence(output);
        violations.push(...overconfidenceViolations);

        // Calculate risk score
        const riskScore = this.calculateRiskScore(violations);

        const result = {
            passed: violations.length === 0,
            violations,
            riskScore,
            metadata: {
                ...metadata,
                outputLength: output.length,
                checkDuration: Date.now() - startTime,
                timestamp: new Date().toISOString(),
            },
        };

        // Store in history
        this.detectionHistory.push({
            timestamp: result.metadata.timestamp,
            passed: result.passed,
            riskScore,
            violationCount: violations.length,
        });

        // Trim history if too large
        if (this.detectionHistory.length > 1000) {
            this.detectionHistory = this.detectionHistory.slice(-1000);
        }

        if (!result.passed) {
            console.log(`[ILE-CO:DETECTOR] ⚠️  VIOLATIONS DETECTED: ${violations.length}`);
            console.log(`[ILE-CO:DETECTOR] Risk Score: ${riskScore}/100`);
            violations.forEach(v => {
                console.log(`[ILE-CO:DETECTOR]   - ${v.type}: ${v.description}`);
            });
        } else {
            console.log(`[ILE-CO:DETECTOR] ✓ Output passed all checks`);
        }

        return result;
    }

    /**
     * Check for ethical violations
     */
    checkEthicalViolations(output) {
        const violations = [];

        for (const pattern of this.rules.ethical) {
            if (pattern.test(output)) {
                violations.push({
                    type: 'ETHICAL_VIOLATION',
                    severity: 'CRITICAL',
                    description: 'Output contains potentially harmful or unethical content',
                    pattern: pattern.toString(),
                });
            }
        }

        return violations;
    }

    /**
     * Check for hallucinations
     */
    checkHallucinations(output) {
        const violations = [];

        for (const pattern of this.rules.hallucination) {
            if (pattern.test(output)) {
                violations.push({
                    type: 'HALLUCINATION',
                    severity: 'HIGH',
                    description: 'Output contains claims about real-time data or capabilities',
                    pattern: pattern.toString(),
                });
            }
        }

        return violations;
    }

    /**
     * Check for toxic content
     */
    checkToxicity(output) {
        const violations = [];

        for (const pattern of this.rules.toxicity) {
            if (pattern.test(output)) {
                violations.push({
                    type: 'TOXICITY',
                    severity: 'HIGH',
                    description: 'Output contains potentially toxic or offensive content',
                    pattern: pattern.toString(),
                });
            }
        }

        return violations;
    }

    /**
     * Check for overconfidence
     */
    checkOverconfidence(output) {
        const violations = [];

        for (const pattern of this.rules.overconfidence) {
            if (pattern.test(output)) {
                violations.push({
                    type: 'OVERCONFIDENCE',
                    severity: 'MEDIUM',
                    description: 'Output shows inappropriate confidence levels',
                    pattern: pattern.toString(),
                });
            }
        }

        return violations;
    }

    /**
     * Calculate overall risk score (0-100)
     */
    calculateRiskScore(violations) {
        let score = 0;

        for (const violation of violations) {
            switch (violation.severity) {
                case 'CRITICAL':
                    score += 40;
                    break;
                case 'HIGH':
                    score += 25;
                    break;
                case 'MEDIUM':
                    score += 10;
                    break;
                case 'LOW':
                    score += 5;
                    break;
            }
        }

        return Math.min(score, 100);
    }

    /**
     * Get detection statistics
     */
    getStatistics() {
        const total = this.detectionHistory.length;
        const failed = this.detectionHistory.filter(h => !h.passed).length;
        const passed = total - failed;

        const avgRiskScore = total > 0
            ? this.detectionHistory.reduce((sum, h) => sum + h.riskScore, 0) / total
            : 0;

        return {
            total,
            passed,
            failed,
            failureRate: total > 0 ? (failed / total * 100).toFixed(2) + '%' : '0%',
            averageRiskScore: avgRiskScore.toFixed(2),
        };
    }

    /**
     * Add custom rule
     */
    addRule(type, pattern, severity = 'MEDIUM') {
        if (!this.rules[type]) {
            this.rules[type] = [];
        }

        this.rules[type].push({
            pattern: new RegExp(pattern, 'i'),
            severity,
            custom: true,
        });

        console.log(`[ILE-CO:DETECTOR] Added custom rule: ${type}`);
    }
}

module.exports = HallucinationDetector;
