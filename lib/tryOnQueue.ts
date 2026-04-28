import type { QueuedTryOn, TryOnStatusResponse } from './vtonTypes';

const STORAGE_KEY = 'vfr_tryon_queue';
const MAX_CONCURRENT = 3;
const POLLING_INTERVAL = 2000;
const MAX_POLLING_TIME = 180000;

export class TryOnQueue {
  private listeners: Set<(items: QueuedTryOn[]) => void> = new Set();
  private pollingIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      this.cleanupExpiredItems();
    }
  }

  private getQueue(): QueuedTryOn[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private saveQueue(queue: QueuedTryOn[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    this.notifyListeners();
  }

  private notifyListeners(): void {
    const items = this.getQueue();
    this.listeners.forEach((listener) => listener(items));
  }

  subscribe(listener: (items: QueuedTryOn[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getItems(): QueuedTryOn[] {
    return this.getQueue();
  }

  getActiveCount(): number {
    return this.getQueue().filter(
      (item) => item.status === 'pending' || item.status === 'processing'
    ).length;
  }

  canAdd(): boolean {
    return this.getActiveCount() < MAX_CONCURRENT;
  }

  async add(
    personImageBase64: string,
    garmentId: string,
    garmentImageUrl: string
  ): Promise<string> {
    if (!this.canAdd()) {
      throw new Error('Queue is full. Maximum 3 concurrent try-on requests allowed.');
    }

    const response = await fetch('/api/tryon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personImageBase64,
        garmentImageBase64: garmentImageUrl,
        garmentDescription: `garment`,
        garmentId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to start try-on');
    }

    const data = await response.json();
    const predictionId = data.predictionId;

    const queuedItem: QueuedTryOn = {
      predictionId,
      status: 'pending',
      garmentId,
      garmentImageUrl,
      createdAt: Date.now(),
    };

    const queue = this.getQueue();
    queue.push(queuedItem);
    this.saveQueue(queue);

    this.startPolling(predictionId);

    return predictionId;
  }

  private startPolling(predictionId: string): void {
    if (this.pollingIntervals.has(predictionId)) return;

    const intervalId = setInterval(async () => {
      try {
        await this.poll(predictionId);
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, POLLING_INTERVAL);

    this.pollingIntervals.set(predictionId, intervalId);

    setTimeout(() => {
      this.stopPolling(predictionId);
    }, MAX_POLLING_TIME);
  }

  private stopPolling(predictionId: string): void {
    const intervalId = this.pollingIntervals.get(predictionId);
    if (intervalId) {
      clearInterval(intervalId);
      this.pollingIntervals.delete(predictionId);
    }
  }

  async poll(predictionId: string): Promise<QueuedTryOn | null> {
    try {
      const response = await fetch(`/api/tryon/${predictionId}`);

      if (!response.ok) {
        if (response.status === 404) {
          this.updateItemStatus(predictionId, 'failed', undefined, 'Prediction not found');
          return null;
        }
        throw new Error('Failed to poll status');
      }

      const data: TryOnStatusResponse = await response.json();

      const outputUrl = data.outputUrl;

      this.updateItemStatus(
        predictionId,
        data.status as QueuedTryOn['status'],
        outputUrl
      );

      if (data.status === 'succeeded' || data.status === 'failed') {
        this.stopPolling(predictionId);
      }

      const queue = this.getQueue();
      return queue.find((item) => item.predictionId === predictionId) || null;
    } catch (error) {
      console.error('Poll error for', predictionId, error);
      return null;
    }
  }

  private updateItemStatus(
    predictionId: string,
    status: QueuedTryOn['status'],
    outputUrl?: string,
    error?: string
  ): void {
    const queue = this.getQueue();
    const index = queue.findIndex((item) => item.predictionId === predictionId);

    if (index !== -1) {
      queue[index] = {
        ...queue[index],
        status,
        outputUrl,
        error,
      };
      this.saveQueue(queue);
    }
  }

  remove(predictionId: string): void {
    this.stopPolling(predictionId);
    const queue = this.getQueue().filter(
      (item) => item.predictionId !== predictionId
    );
    this.saveQueue(queue);
  }

  clear(): void {
    this.pollingIntervals.forEach((intervalId) => clearInterval(intervalId));
    this.pollingIntervals.clear();
    this.saveQueue([]);
  }

  private cleanupExpiredItems(): void {
    const queue = this.getQueue();
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000;

    const validItems = queue.filter((item) => {
      if (item.status === 'succeeded' || item.status === 'failed') {
        return now - item.createdAt < maxAge;
      }
      return true;
    });

    if (validItems.length !== queue.length) {
      this.saveQueue(validItems);
    }
  }
}

let queueInstance: TryOnQueue | null = null;

export function getTryOnQueue(): TryOnQueue {
  if (!queueInstance) {
    queueInstance = new TryOnQueue();
  }
  return queueInstance;
}
