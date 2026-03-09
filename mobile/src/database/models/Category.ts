import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, text, children } from '@nozbe/watermelondb/decorators';

/**
 * Category Model
 * Represents a spending category: e.g. "Coffee" → type: "want"
 */
export class Category extends Model {
  static table = 'categories';

  static associations = {
    transactions: { type: 'has_many' as const, foreignKey: 'category_id' },
  };

  @text('name') name!: string;
  /** 'need' | 'want' | 'savings' */
  @text('type') type!: string;
  @field('icon') icon?: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
