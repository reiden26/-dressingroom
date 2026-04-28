import { useState, useEffect, useCallback, useRef } from 'react';
import { getTryOnQueue, type TryOnQueue } from '@/lib/tryOnQueue';
import type { QueuedTryOn } from './vtonTypes';
import { preparePersonImage, prepareGarmentImage } from './imagePreprocessor';

export interface UseTryOnQueueReturn {
  items: QueuedTryOn[];
  isLoading: boolean;
  error: string | null;
  tryOn: (garmentId: string, garmentImageUrl: string) => Promise<string | null>;
  retry: (predictionId: string) => Promise<void>;
  removeItem: (predictionId: string) => void;
  clearAll: () => void;
  canTryOn: boolean;
}

export function useTryOnQueue(personImageUrl: string | null): UseTryOnQueueReturn {
  const [items, setItems] = useState<QueuedTryOn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queueRef = useRef<TryOnQueue | null>(null);
  const personImageUrlRef = useRef(personImageUrl);

  personImageUrlRef.current = personImageUrl;

  useEffect(() => {
    queueRef.current = getTryOnQueue();
    const initialItems = queueRef.current.getItems();
    setItems(initialItems);

    const unsubscribe = queueRef.current.subscribe((newItems) => {
      setItems([...newItems]);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const tryOn = useCallback(
    async (garmentId: string, garmentImageUrl: string): Promise<string | null> => {
      setError(null);
      setIsLoading(true);

      try {
        const personUrl = personImageUrlRef.current;
        if (!personUrl) {
          throw new Error('No person image available');
        }

        const personBase64 = await preparePersonImage(personUrl);
        const garmentBase64 = await prepareGarmentImage(garmentImageUrl);

        const predictionId = await queueRef.current!.add(
          personBase64,
          garmentId,
          garmentImageUrl
        );

        return predictionId;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to start try-on';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const retry = useCallback(async (predictionId: string): Promise<void> => {
    const item = items.find((i) => i.predictionId === predictionId);
    if (!item) return;

    await queueRef.current?.poll(predictionId);
  }, [items]);

  const removeItem = useCallback((predictionId: string): void => {
    queueRef.current?.remove(predictionId);
  }, []);

  const clearAll = useCallback((): void => {
    queueRef.current?.clear();
  }, []);

  const canTryOn = queueRef.current?.canAdd() ?? true;

  return {
    items,
    isLoading,
    error,
    tryOn,
    retry,
    removeItem,
    clearAll,
    canTryOn,
  };
}
