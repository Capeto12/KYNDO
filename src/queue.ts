import Bull from 'bull';

const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';

// Create a queue for card updates
const cardQueue = new Bull('card-updates', REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 500, // Keep last 500 failed jobs
  },
});

// Job types - flexible interface to support different action patterns
export interface CardUpdateJob {
  cardId: string;
  action?: 'regenerate_thumbnail' | 'update_rarity';
  metadata?: Record<string, any>;
  changes?: any;
  actor?: string;
  timestamp?: string;
}

/**
 * Enqueue a card update job
 */
export async function enqueueCardUpdate(job: CardUpdateJob): Promise<Bull.Job<CardUpdateJob>> {
  return cardQueue.add('card.updated', job, {
    jobId: `card-update-${job.cardId}-${Date.now()}`,
  });
}

/**
 * Get queue for worker processing
 */
export function getCardUpdateQueue(): Bull.Queue<CardUpdateJob> {
  return cardQueue;
}

/**
 * Get queue stats
 */
export async function getQueueStats() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    cardQueue.getWaitingCount(),
    cardQueue.getActiveCount(),
    cardQueue.getCompletedCount(),
    cardQueue.getFailedCount(),
    cardQueue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
  };
}

// Export the queue instance as both named and default export
export { cardQueue };
export default cardQueue;
