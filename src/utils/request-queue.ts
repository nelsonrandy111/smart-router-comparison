/**
 * Request Queue Manager
 * Prevents overwhelming Ollama with too many concurrent requests
 */

export interface QueuedRequest<T> {
  id: string;
  promise: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
  timestamp: number;
  priority: number; // Higher number = higher priority
  retryCount: number;
  maxRetries: number;
}

export class RequestQueue {
  private queue: QueuedRequest<any>[] = [];
  private activeRequests = 0;
  private maxConcurrent: number;
  private processing = false;

  constructor(maxConcurrent: number = 2) {
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * Add a request to the queue
   */
  async enqueue<T>(
    requestFn: () => Promise<T>,
    priority: number = 0,
    requestId?: string,
    maxRetries: number = 3
  ): Promise<T> {
    const id = requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return new Promise<T>((resolve, reject) => {
      const queuedRequest: QueuedRequest<T> = {
        id,
        promise: requestFn,
        resolve,
        reject,
        timestamp: Date.now(),
        priority,
        retryCount: 0,
        maxRetries
      };

      // Insert request in priority order (higher priority first)
      const insertIndex = this.queue.findIndex(req => req.priority < priority);
      if (insertIndex === -1) {
        this.queue.push(queuedRequest);
      } else {
        this.queue.splice(insertIndex, 0, queuedRequest);
      }

      // Start processing if not already running
      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  /**
   * Process the queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing) return;
    
    this.processing = true;
    
    try {
      while (this.queue.length > 0 || this.activeRequests > 0) {
        // Start new requests if we have capacity
        while (this.activeRequests < this.maxConcurrent && this.queue.length > 0) {
          const request = this.queue.shift();
          if (request) {
            this.executeRequest(request);
          }
        }
        
        // Wait a bit before checking again
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } finally {
      this.processing = false;
    }
  }

  /**
   * Execute a single request with retry logic
   */
  private async executeRequest<T>(request: QueuedRequest<T>): Promise<void> {
    this.activeRequests++;
    console.log(`Executing request ${request.id}, active requests: ${this.activeRequests}`);
    
    try {
      const result = await request.promise();
      console.log(`Request ${request.id} succeeded`);
      request.resolve(result);
    } catch (error) {
      // Check if we should retry
      if (request.retryCount < request.maxRetries && this.isRetryableError(error)) {
        request.retryCount++;
        
        // Calculate exponential backoff delay: 1s, 2s, 4s, 8s...
        const delayMs = Math.min(1000 * Math.pow(2, request.retryCount - 1), 8000);
        
        console.log(`Retrying request ${request.id} (attempt ${request.retryCount + 1}/${request.maxRetries + 1}) after ${delayMs}ms delay`);
        console.log(`Error was:`, error.message);
        
        // Add delay and re-queue the request
        setTimeout(() => {
          this.queue.unshift(request); // Add to front of queue for retry
        }, delayMs);
      } else {
        request.reject(error);
      }
    } finally {
      this.activeRequests--;
    }
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (!error) return false;
    
    // Retry on timeout errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return true;
    }
    
    // Retry on connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
      return true;
    }
    
    // Retry on 5xx server errors
    if (error.response?.status >= 500) {
      return true;
    }
    
    return false;
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      activeRequests: this.activeRequests,
      maxConcurrent: this.maxConcurrent,
      processing: this.processing
    };
  }

  /**
   * Clear the queue (useful for cleanup)
   */
  clear(): void {
    // Reject all pending requests
    this.queue.forEach(request => {
      request.reject(new Error('Queue cleared'));
    });
    this.queue = [];
  }

  /**
   * Set maximum concurrent requests
   */
  setMaxConcurrent(max: number): void {
    this.maxConcurrent = Math.max(1, max);
  }
}

// Global request queue instance
export const globalRequestQueue = new RequestQueue(1); // Max 1 concurrent request to Ollama

/**
 * Decorator to automatically queue requests
 */
export function queuedRequest<T extends any[], R>(
  priority: number = 0,
  queue: RequestQueue = globalRequestQueue
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: T): Promise<R> {
      return queue.enqueue(
        () => originalMethod.apply(this, args),
        priority,
        `${target.constructor.name}.${propertyKey}_${Date.now()}`
      );
    };
    
    return descriptor;
  };
}

/**
 * Utility function to create a queued request
 */
export async function queueRequest<T>(
  requestFn: () => Promise<T>,
  priority: number = 0,
  queue: RequestQueue = globalRequestQueue,
  maxRetries: number = 3
): Promise<T> {
  return queue.enqueue(requestFn, priority, undefined, maxRetries);
}