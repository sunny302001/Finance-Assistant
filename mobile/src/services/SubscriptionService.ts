import { Q } from '@nozbe/watermelondb';
import { database } from '../database';
import { Transaction } from '../database/models';

export class SubscriptionService {
  /**
   * Detects recurring transactions (subscriptions).
   * Logic:
   * 1. Groups transactions by a normalized description.
   * 2. Checks if there are at least 3 occurrences.
   * 3. Checks if the gap between occurrences is roughly 28-32 days.
   */
  static async detectSubscriptions(): Promise<void> {
    const transactions = await database.get<Transaction>('transactions').query().fetch();
    
    // Group by normalized description
    const groups: Record<string, Transaction[]> = {};
    
    transactions.forEach(tx => {
      const normalizedDesc = this.normalizeDescription(tx.description);
      if (!groups[normalizedDesc]) {
        groups[normalizedDesc] = [];
      }
      groups[normalizedDesc].push(tx);
    });

    await database.write(async () => {
      for (const [desc, txs] of Object.entries(groups)) {
        if (txs.length < 3) continue;

        // Sort by date
        txs.sort((a, b) => a.date - b.date);

        const intervals: number[] = [];
        for (let i = 1; i < txs.length; i++) {
          const gapDays = (txs[i].date - txs[i-1].date) / (1000 * 60 * 60 * 24);
          intervals.push(gapDays);
        }

        // Check if intervals are roughly monthly (28-32 days)
        const isMonthly = intervals.every(gap => gap >= 27 && gap <= 33);
        const hasConsistentAmount = txs.every(tx => Math.abs(tx.amount - txs[0].amount) < 1); // $1 variance allowed

        if (isMonthly && hasConsistentAmount) {
          for (const tx of txs) {
            await tx.update(t => {
              t.isSubscription = true;
            });
          }
          console.log(`[SubscriptionService] Detected: ${desc}`);
        }
      }
    });
  }

  private static normalizeDescription(desc: string): string {
    // Remove dates, IDs, and common noises
    return desc
      .toLowerCase()
      .replace(/\d{2}\/\d{2}/g, '') // Remove dates
      .replace(/\d+/g, '') // Remove numbers
      .replace(/purchase|payment|pos|debit|credit/gi, '')
      .trim();
  }
}
