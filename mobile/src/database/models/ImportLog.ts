import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, text } from '@nozbe/watermelondb/decorators';

/**
 * ImportLog Model
 * Tracks every document import attempt to prevent duplicate uploads.
 * A SHA-256 hash of the file content is stored alongside the filename.
 */
export class ImportLog extends Model {
  static table = 'import_logs';

  @text('filename') filename!: string;
  /** 'pending' | 'success' | 'error' */
  @text('status') status!: 'pending' | 'success' | 'error';
  @text('error_message') errorMessage?: string;
  @field('transaction_count') transactionCount!: number;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
