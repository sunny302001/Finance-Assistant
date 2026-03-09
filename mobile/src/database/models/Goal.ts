import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, text } from '@nozbe/watermelondb/decorators';

/**
 * Goal Model
 * A savings goal the user is tracking towards.
 */
export class Goal extends Model {
  static table = 'goals';

  @text('name') name!: string;
  @field('target_amount') targetAmount!: number;
  @field('current_amount') currentAmount!: number;

  /** Optional deadline as an epoch timestamp */
  @field('deadline') deadline?: number;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  /** Computed percentage progress (0–100) */
  get progressPercent(): number {
    if (this.targetAmount === 0) return 0;
    return Math.min(100, (this.currentAmount / this.targetAmount) * 100);
  }
}
