import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, text, children } from '@nozbe/watermelondb/decorators';

/**
 * Category Model
 * Represents a spending/income category.
 *
 *   isNeed = true  → Essential (Housing, Transport, Utilities, etc.)
 *   isNeed = false → Discretionary (Subscriptions, Miscellaneous, etc.)
 */
export class Category extends Model {
  static table = 'categories';

  static associations = {
    transactions: { type: 'has_many' as const, foreignKey: 'category_id' },
  };

  @text('name') name!: string;

  /** true = Need (essential), false = Want (discretionary) */
  @field('is_need') isNeed!: boolean;

  @field('icon') icon?: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
