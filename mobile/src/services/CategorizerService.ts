import { database, categoriesCollection } from '../database';
import { Category } from '../database/models/Category';
import { RulesEngine } from './RulesEngine';

export interface AnalysisAdvice {
  insight: string;
  recommendation: string;
}

export interface IAnalyzer {
  analyzeSpend(totalIncome: number, totalSpend: number): AnalysisAdvice;
}

/**
 * CategorizerService
 *
 * Bridges the RulesEngine (keyword matching) with WatermelonDB (category records).
 * Phase 1: Local keyword rules only.
 * Phase 2: Will add local LLM fallback for unmatched descriptions.
 */
export class CategorizerService implements IAnalyzer {
  /**
   * In-memory cache: category name → WatermelonDB record ID.
   * Populated once on first call, then reused for the session.
   */
  private static categoryMap: Map<string, string> | null = null;

  /**
   * Build (or return cached) category name → ID lookup map.
   */
  private static async getCategoryMap(): Promise<Map<string, string>> {
    if (this.categoryMap) return this.categoryMap;

    const allCategories = await categoriesCollection.query().fetch();

    this.categoryMap = new Map<string, string>();
    for (const cat of allCategories) {
      this.categoryMap.set(cat.name, cat.id);
    }

    console.log(`[Categorizer] Built category map with ${this.categoryMap.size} entries.`);
    return this.categoryMap;
  }

  /**
   * Invalidate the cached map (call after seeding or adding new categories).
   */
  static invalidateCache(): void {
    this.categoryMap = null;
  }

  /**
   * Phase 1: Keyword-Rule Engine
   *
   * Given a transaction description, returns the WatermelonDB category ID
   * or null if no rule matches (caller can default to Miscellaneous).
   */
  static async getCategoryIdForDescription(
    description: string,
  ): Promise<string | null> {
    const categoryName = RulesEngine.categorize(description);

    if (!categoryName) return null;

    const map = await this.getCategoryMap();
    return map.get(categoryName) ?? null;
  }

  /**
   * Convenience: resolve the "Miscellaneous" category ID as fallback.
   */
  static async getMiscellaneousId(): Promise<string | null> {
    const map = await this.getCategoryMap();
    return map.get('Miscellaneous') ?? null;
  }

  /**
   * Categorize a batch of descriptions efficiently.
   * Returns a Map<index, categoryId> so the caller can look up by position.
   */
  static async categorizeBatch(
    descriptions: string[],
  ): Promise<Map<number, string>> {
    const map = await this.getCategoryMap();
    const miscId = map.get('Miscellaneous');
    const result = new Map<number, string>();

    for (let i = 0; i < descriptions.length; i++) {
      const categoryName = RulesEngine.categorize(descriptions[i]);

      if (categoryName) {
        const id = map.get(categoryName);
        if (id) {
          result.set(i, id);
          continue;
        }
      }

      // Fallback to Miscellaneous
      if (miscId) {
        result.set(i, miscId);
      }
    }

    return result;
  }

  /**
   * Phase 2 (Stub): Local LLM Advice
   * TODO: LOCAL LLM HOOK – will eventually call a local Llama model
   */
  analyzeSpend(totalIncome: number, totalSpend: number): AnalysisAdvice {
    const spendRatio = totalIncome > 0 ? totalSpend / totalIncome : 0;

    if (spendRatio > 0.9) {
      return {
        insight: 'Your spending is extremely high relative to your income.',
        recommendation: "Focus on reducing 'Want' categories this month.",
      };
    } else if (spendRatio < 0.5) {
      return {
        insight: 'Excellent savings rate!',
        recommendation:
          "Consider moving excess funds to your 'Long-term Growth' goal.",
      };
    }

    return {
      insight: 'Spending is within normal bounds.',
      recommendation: 'Stay consistent with your current budget.',
    };
  }
}
