export interface LLMInsight {
  category: string;
  confidence: number;
  reasoning: string;
  tags: string[];
}

export interface SpendingAdvice {
  summary: string;
  anomalies: string[];
  savingTips: string[];
}

export class LocalLLMService {
  /**
   * // TODO: LOCAL LLM HOOK
   * This class serves as the interface for ONNX Runtime or Llama.RN.
   * For Phase 2, this remains a sophisticated stub to define the mobile-native AI pipeline.
   */
  
  static async categorizeTransaction(description: string, amount: number): Promise<LLMInsight> {
    console.log(`[LocalLLMService] Mocking inference for: ${description}`);
    
    // Simulate latency of a local 1B model
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      category: 'Shopping', // Mocked
      confidence: 0.85,
      reasoning: "Description matches retail patterns in local vector index.",
      tags: ['discretionary', 'retail']
    };
  }

  static async getMonthlyAdvice(transactions: any[]): Promise<SpendingAdvice> {
    return {
      summary: "Your spending in 'Dining Out' has increased by 15% compared to last month.",
      anomalies: ["Unusually large transaction at 'Apple Store' on 15th."],
      savingTips: [
        "Consolidate your streaming subscriptions to save $25/mo.",
        "Set a budget limit for 'Food & Drink' to stay on track."
      ]
    };
  }
}
