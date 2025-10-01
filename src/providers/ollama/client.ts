import axios from 'axios';
import { queueRequest } from '../../utils/request-queue';
import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';

// Create axios instance with connection pooling
const createAxiosInstance = (baseUrl: string, timeout: number) => {
  return axios.create({
    baseURL: baseUrl,
    timeout,
    maxRedirects: 5,
    httpAgent: new HttpAgent({
      keepAlive: true,
      maxSockets: 10,
      maxFreeSockets: 5,
      timeout: 60000,
      freeSocketTimeout: 30000
    }),
    httpsAgent: new HttpsAgent({
      keepAlive: true,
      maxSockets: 10,
      maxFreeSockets: 5,
      timeout: 60000,
      freeSocketTimeout: 30000
    })
  });
};

export interface GenerateOptions {
	prompt: string;
	temperature?: number;
	maxTokens?: number;
	stopSequences?: string[];
}

export class OllamaClient {
	private readonly baseUrl: string;
	private readonly timeout: number;
	private readonly axiosInstance: any;
	
	constructor(baseUrl: string, timeout: number = 180000) {
		this.baseUrl = baseUrl.replace(/\/$/, '');
		this.timeout = timeout;
		this.axiosInstance = createAxiosInstance(this.baseUrl, timeout);
	}

	async generateText(model: string, options: GenerateOptions): Promise<string> {
		// Queue the request to prevent overwhelming Ollama
		return queueRequest(async () => {
			const { prompt, temperature, maxTokens, stopSequences } = options;
			
			// Use streaming to avoid Ollama's 30-second timeout
			const body: any = {
				model,
				prompt,
				stream: true,
				options: {
					// Set very short max tokens to prevent timeout
					num_predict: Math.min(maxTokens || 50, 50), // Limit to 50 tokens max
					...(typeof temperature === 'number' && { temperature }),
					...(Array.isArray(stopSequences) && stopSequences.length > 0 && { stop: stopSequences })
				}
			};

			// For streaming, we need to collect the chunks
			const response = await this.axiosInstance.post('/api/generate', body, {
				responseType: 'stream',
				timeout: 180000 // 3 minutes
			});

			return new Promise((resolve, reject) => {
				let fullResponse = '';
				response.data.on('data', (chunk: Buffer) => {
					const lines = chunk.toString().split('\n');
					for (const line of lines) {
						if (line.trim()) {
							try {
								const parsed = JSON.parse(line);
								if (parsed.response) {
									fullResponse += parsed.response;
								}
								if (parsed.done) {
									resolve(fullResponse);
									return;
								}
							} catch (e) {
								// Ignore parsing errors for incomplete chunks
							}
						}
					}
				});

				response.data.on('end', () => {
					resolve(fullResponse);
				});

				response.data.on('error', (error: any) => {
					reject(error);
				});
			});
		}, 1); // Priority 1 for text generation
	}

	async generateEmbedding(model: string, input: string): Promise<number[]> {
		// Queue the request to prevent overwhelming Ollama
		return queueRequest(async () => {
			const body = {
				model,
				prompt: input,
				stream: false,
			};

			const res = await this.axiosInstance.post('/api/embeddings', body);
			// Ollama embeddings returns { embedding: number[] }
			return res.data?.embedding ?? [];
		}, 2); // Priority 2 for embeddings (lower priority than text)
	}
}