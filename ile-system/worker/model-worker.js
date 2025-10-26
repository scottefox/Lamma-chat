/**
 * Model Worker
 *
 * Represents a worker partition that executes model inference
 * Communicates with ILE CO for output vetting
 */

const Anthropic = require('@anthropic-ai/sdk');

class ModelWorker {
    constructor(partitionId, ileCO, config = {}) {
        this.partitionId = partitionId;
        this.ileCO = ileCO;
        this.config = {
            modelId: config.modelId || 'claude-3-5-sonnet-20241022',
            maxTokens: config.maxTokens || 1024,
            apiKey: config.apiKey,
            ...config
        };

        this.anthropic = new Anthropic({
            apiKey: this.config.apiKey
        });

        this.conversationHistory = [];
        this.status = 'INITIALIZED';
    }

    /**
     * Process a message through the model
     */
    async processMessage(userMessage, conversationHistory = []) {
        console.log(`[WORKER:${this.partitionId}] Processing message...`);

        this.status = 'PROCESSING';

        try {
            // Build messages
            const messages = [
                ...conversationHistory,
                { role: 'user', content: userMessage }
            ];

            // Call Claude API
            const response = await this.anthropic.messages.create({
                model: this.config.modelId,
                max_tokens: this.config.maxTokens,
                messages: messages
            });

            const output = response.content[0].text;

            console.log(`[WORKER:${this.partitionId}] Generated output (${output.length} chars)`);

            // Vet output through ILE CO
            console.log(`[WORKER:${this.partitionId}] Submitting to ILE CO for vetting...`);
            const vetResult = await this.ileCO.vetOutput(this.partitionId, output, {
                userMessage,
                model: response.model,
                usage: response.usage,
            });

            this.status = 'IDLE';

            return {
                output,
                vetResult,
                model: response.model,
                usage: response.usage,
            };

        } catch (error) {
            this.status = 'ERROR';
            console.error(`[WORKER:${this.partitionId}] Error:`, error);
            throw error;
        }
    }

    /**
     * Get worker status
     */
    getStatus() {
        return {
            partitionId: this.partitionId,
            status: this.status,
            modelId: this.config.modelId,
        };
    }
}

module.exports = ModelWorker;
