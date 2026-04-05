import { database, categoriesCollection } from './index';
import { Category } from './models/Category';

/**
 * Default categories to seed on first launch.
 * Each entry maps to a record in the `categories` table.
 *
 *   is_need: true  → "Need" (essential expense or income)
 *   is_need: false → "Want" (discretionary)
 */
interface SeedCategory {
  name: string;
  isNeed: boolean;
  icon: string;
}

const DEFAULT_CATEGORIES: SeedCategory[] = [
  { name: 'Housing',        isNeed: true,  icon: '🏠' },
  { name: 'Food & Dining',  isNeed: true,  icon: '🍽️' },
  { name: 'Transport',      isNeed: true,  icon: '🚗' },
  { name: 'Utilities',      isNeed: true,  icon: '💡' },
  { name: 'Subscriptions',  isNeed: false, icon: '📺' },
  { name: 'Income',         isNeed: true,  icon: '💰' },
  { name: 'Miscellaneous',  isNeed: false, icon: '📦' },
];

/**
 * seedCategories
 *
 * Idempotent: Only seeds if the `categories` table is empty.
 * Safe to call on every app launch.
 */
export async function seedCategories(): Promise<void> {
  try {
    const existingCount = await categoriesCollection.query().fetchCount();

    if (existingCount > 0) {
      console.log(`[Seed] Categories already seeded (${existingCount} records). Skipping.`);
      return;
    }

    console.log('[Seed] Seeding default categories...');

    await database.write(async () => {
      const batch = DEFAULT_CATEGORIES.map((cat) =>
        categoriesCollection.prepareCreate((record: Category) => {
          record.name = cat.name;
          record.isNeed = cat.isNeed;
          record.icon = cat.icon;
        }),
      );

      await database.batch(...batch);
    });

    console.log(`[Seed] Successfully seeded ${DEFAULT_CATEGORIES.length} categories.`);
  } catch (error) {
    console.error('[Seed] Failed to seed categories:', error);
  }
}
