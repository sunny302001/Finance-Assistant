import { appSchema, tableSchema } from '@nozbe/watermelondb';

/**
 * WatermelonDB Schema
 * Defines all database tables for the Finance Assistant app.
 */
export const schema = appSchema({
  version: 1,
  tables: [
    // ─── Categories ──────────────────────────────────────────────────────────
    tableSchema({
      name: 'categories',
      columns: [
        { name: 'name', type: 'string' },
        // type: 'need' | 'want' | 'savings'
        { name: 'type', type: 'string' },
        { name: 'icon', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // ─── Transactions ─────────────────────────────────────────────────────────
    tableSchema({
      name: 'transactions',
      columns: [
        { name: 'amount', type: 'number' },
        { name: 'date', type: 'number' },
        { name: 'description', type: 'string' },
        { name: 'raw_text', type: 'string', isOptional: true },
        { name: 'category_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'is_subscription', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // ─── Goals ────────────────────────────────────────────────────────────────
    tableSchema({
      name: 'goals',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'target_amount', type: 'number' },
        { name: 'current_amount', type: 'number' },
        { name: 'deadline', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // ─── Import Logs (prevents duplicate uploads) ──────────────────────────
    tableSchema({
      name: 'import_logs',
      columns: [
        { name: 'filename', type: 'string' },
        // status: 'pending' | 'success' | 'error'
        { name: 'status', type: 'string' },
        { name: 'error_message', type: 'string', isOptional: true },
        { name: 'transaction_count', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});
