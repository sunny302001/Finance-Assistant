import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import { Category } from './models/Category';
import { Transaction } from './models/Transaction';
import { Goal } from './models/Goal';
import { ImportLog } from './models/ImportLog';

/**
 * SQLite Adapter
 * WatermelonDB uses the native SQLite driver for high-performance offline storage.
 */
const adapter = new SQLiteAdapter({
  schema,
  // Migrations would go here as the schema evolves:
  // migrations,
  jsi: true, // Use JSI for maximum performance (requires a dev build)
  onSetUpError: (error) => {
    console.error('[Database] Setup error:', error);
  },
});

/**
 * Singleton Database instance
 * Import this anywhere in the app to access the database.
 */
export const database = new Database({
  adapter,
  modelClasses: [Category, Transaction, Goal, ImportLog],
});

// Table collections for ergonomic access
export const transactionsCollection = database.get<Transaction>('transactions');
export const categoriesCollection = database.get<Category>('categories');
export const goalsCollection = database.get<Goal>('goals');
export const importLogsCollection = database.get<ImportLog>('import_logs');
