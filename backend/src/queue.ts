import Bull from 'bull';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create a queue for card updates
const cardUpdateQueue = new Bull('card-updates', REDIS_URL, {
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

// Job types
export interface CardUpdateJob {
  cardId: string;
  action: 'regenerate_thumbnail' | 'update_rarity';
  metadata?: Record<string, any>;
}

/**
 * Enqueue a card update job
 */
export async function enqueueCardUpdate(job: CardUpdateJob): Promise<Bull.Job<CardUpdateJob>> {
  return cardUpdateQueue.add(job, {
    jobId: `${job.action}-${job.cardId}-${Date.now()}`,
  });
}

/**
 * Get queue for worker processing
 */
export function getCardUpdateQueue(): Bull.Queue<CardUpdateJob> {
  return cardUpdateQueue;
}

/**
 * Get queue stats
 */
export async function getQueueStats() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    cardUpdateQueue.getWaitingCount(),
    cardUpdateQueue.getActiveCount(),
    cardUpdateQueue.getCompletedCount(),
    cardUpdateQueue.getFailedCount(),
    cardUpdateQueue.getDelayedCount(),
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

export default cardUpdateQueue;
