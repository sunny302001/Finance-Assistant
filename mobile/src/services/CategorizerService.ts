import { database } from '../database';
import { Category } from '../database/models';

export interface AnalysisAdvice {
  insight: string;
  recommendation: string;
}

export interface IAnalyzer {
  analyzeSpend(totalIncome: number, totalSpend: number): AnalysisAdvice;
}

export class CategorizerService implements IAnalyzer {
  private static keywordRules: Record<string, string> = {
    'starbucks': 'Food & Drink',
    'mcdonalds': 'Food & Drink',
    'uber': 'Travel',
    'lyft': 'Travel',
    'amazon': 'Shopping',
    'walmart': 'Shopping',
    'netflix': 'Entertainment',
    'spotify': 'Entertainment',
    'rent': 'Housing',
    'mortgage': 'Housing',
    'salary': 'Income',
    'deposit': 'Income',
  };

  /**
   * Phase 1: Keyword-Rule Engine
   */
  static async getCategoryForDescription(description: string): Promise<string> {
    const desc = description.toLowerCase();
    
    for (const [keyword, categoryName] of Object.entries(this.keywordRules)) {
      if (desc.includes(keyword)) {
        return categoryName;
      }
    }
    
    return 'Uncategorized';
  }

  /**
   * Phase 2 (Stub): Local LLM Advice
   * // TODO: LOCAL LLM HOOK - This will eventually call a local Llama model
   */
  analyzeSpend(totalIncome: number, totalSpend: number): AnalysisAdvice {
    const spendRatio = totalIncome > 0 ? (totalSpend / totalIncome) : 0;
    
    if (spendRatio > 0.9) {
      return {
        insight: "Your spending is extremely high relative to your income.",
        recommendation: "Focus on reducing 'Want' categories this month."
      };
    } else if (spendRatio < 0.5) {
      return {
        insight: "Excellent savings rate!",
        recommendation: "Consider moving excess funds to your 'Long-term Growth' goal."
      };
    }
    
    return {
      insight: "Spending is within normal bounds.",
      recommendation: "Stay consistent with your current budget."
    };
  }
}
