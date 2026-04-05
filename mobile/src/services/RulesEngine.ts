/**
 * RulesEngine
 *
 * Phase 1 – Local, offline keyword-based categorization.
 * Each rule maps a keyword (lowercase) to a category name.
 * The engine performs case-insensitive substring matching.
 *
 * Designed to be easily extensible:
 *   1. Add entries to DEFAULT_RULES below for built-in rules.
 *   2. Call `RulesEngine.addRule()` at runtime for user-defined rules.
 *   3. In Phase 2, custom rules will persist in WatermelonDB.
 */

export interface Rule {
  keyword: string;
  categoryName: string;
}

// ─── Default Keyword → Category Mappings ──────────────────────────────────────
// Each keyword is stored lowercase and matched case-insensitively.
const DEFAULT_RULES: Rule[] = [
  // Transport
  { keyword: 'uber', categoryName: 'Transport' },
  { keyword: 'ola', categoryName: 'Transport' },
  { keyword: 'lyft', categoryName: 'Transport' },
  { keyword: 'rapido', categoryName: 'Transport' },
  { keyword: 'metro', categoryName: 'Transport' },
  { keyword: 'fuel', categoryName: 'Transport' },
  { keyword: 'petrol', categoryName: 'Transport' },
  { keyword: 'diesel', categoryName: 'Transport' },
  { keyword: 'parking', categoryName: 'Transport' },

  // Food & Dining
  { keyword: 'swiggy', categoryName: 'Food & Dining' },
  { keyword: 'zomato', categoryName: 'Food & Dining' },
  { keyword: 'doordash', categoryName: 'Food & Dining' },
  { keyword: 'ubereats', categoryName: 'Food & Dining' },
  { keyword: 'dominos', categoryName: 'Food & Dining' },
  { keyword: 'mcdonald', categoryName: 'Food & Dining' },
  { keyword: 'starbucks', categoryName: 'Food & Dining' },
  { keyword: 'restaurant', categoryName: 'Food & Dining' },
  { keyword: 'cafe', categoryName: 'Food & Dining' },
  { keyword: 'grocery', categoryName: 'Food & Dining' },
  { keyword: 'bigbasket', categoryName: 'Food & Dining' },
  { keyword: 'blinkit', categoryName: 'Food & Dining' },
  { keyword: 'zepto', categoryName: 'Food & Dining' },

  // Subscriptions
  { keyword: 'netflix', categoryName: 'Subscriptions' },
  { keyword: 'spotify', categoryName: 'Subscriptions' },
  { keyword: 'prime video', categoryName: 'Subscriptions' },
  { keyword: 'amazon prime', categoryName: 'Subscriptions' },
  { keyword: 'hotstar', categoryName: 'Subscriptions' },
  { keyword: 'disney+', categoryName: 'Subscriptions' },
  { keyword: 'youtube premium', categoryName: 'Subscriptions' },
  { keyword: 'apple music', categoryName: 'Subscriptions' },
  { keyword: 'jio', categoryName: 'Subscriptions' },
  { keyword: 'airtel', categoryName: 'Subscriptions' },

  // Housing
  { keyword: 'rent', categoryName: 'Housing' },
  { keyword: 'mortgage', categoryName: 'Housing' },
  { keyword: 'housing', categoryName: 'Housing' },
  { keyword: 'maintenance', categoryName: 'Housing' },

  // Utilities
  { keyword: 'electricity', categoryName: 'Utilities' },
  { keyword: 'electric bill', categoryName: 'Utilities' },
  { keyword: 'water bill', categoryName: 'Utilities' },
  { keyword: 'gas bill', categoryName: 'Utilities' },
  { keyword: 'internet', categoryName: 'Utilities' },
  { keyword: 'broadband', categoryName: 'Utilities' },
  { keyword: 'wifi', categoryName: 'Utilities' },

  // Income
  { keyword: 'salary', categoryName: 'Income' },
  { keyword: 'payroll', categoryName: 'Income' },
  { keyword: 'deposit', categoryName: 'Income' },
  { keyword: 'refund', categoryName: 'Income' },
  { keyword: 'cashback', categoryName: 'Income' },
  { keyword: 'dividend', categoryName: 'Income' },
  { keyword: 'interest credit', categoryName: 'Income' },
];

/**
 * RulesEngine
 * Stateless, purely local keyword matcher.
 */
export class RulesEngine {
  /** The active rule set (built-in + user-added at runtime). */
  private static rules: Rule[] = [...DEFAULT_RULES];

  /**
   * Match a transaction description against keyword rules.
   * Returns the category **name** if matched, or `null` if no rule fires.
   *
   * Multi-word keywords (e.g. "prime video") are checked first to avoid
   * partial matches on single-word substrings.
   */
  static categorize(description: string): string | null {
    const desc = description.toLowerCase();

    // Sort rules by keyword length (longest first) so multi-word rules
    // are checked before shorter overlapping ones.
    const sorted = [...this.rules].sort(
      (a, b) => b.keyword.length - a.keyword.length,
    );

    for (const rule of sorted) {
      if (desc.includes(rule.keyword)) {
        return rule.categoryName;
      }
    }

    return null;
  }

  // ─── Extensibility API ────────────────────────────────────────────────────

  /** Add a custom rule at runtime (persisting is a Phase 2 concern). */
  static addRule(keyword: string, categoryName: string): void {
    this.rules.push({ keyword: keyword.toLowerCase(), categoryName });
  }

  /** Remove a rule by keyword. */
  static removeRule(keyword: string): void {
    this.rules = this.rules.filter((r) => r.keyword !== keyword.toLowerCase());
  }

  /** Get a snapshot of all active rules (read-only). */
  static getRules(): ReadonlyArray<Rule> {
    return [...this.rules];
  }

  /** Reset to the default built-in rules only. */
  static resetToDefaults(): void {
    this.rules = [...DEFAULT_RULES];
  }
}
