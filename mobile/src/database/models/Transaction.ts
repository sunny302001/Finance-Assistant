import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, text, relation } from '@nozbe/watermelondb/decorators';
import { Category } from './Category';

/**
 * Transaction Model
 * Core record for a single financial event parsed from a bank statement.
 */
export class Transaction extends Model {
  static table = 'transactions';

  static associations = {
    categories: { type: 'belongs_to' as const, key: 'category_id' },
    import_logs: { type: 'belongs_to' as const, key: 'import_log_id' },
  };

  /** Positive = income, Negative = expense */
  @field('amount') amount!: number;

  /** Epoch timestamp of the actual transaction date */
  @field('date') date!: number;

  @text('description') description!: string;
  @text('raw_text') rawText?: string;

  @field('category_id') categoryId?: string;
  @field('is_subscription') isSubscription!: boolean;

  /** Lazily loads the related Category model */
  @relation('categories', 'category_id') category!: Category;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
