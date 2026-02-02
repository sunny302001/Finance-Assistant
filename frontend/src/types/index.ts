export interface Transaction {
  id: number
  date: string
  raw_description: string
  sanitized_description: string
  merchant_name: string
  business_type: string
  category: string
  amount: number
  transaction_type: 'debit' | 'credit'
  balance: number
  source_file: string
  bank_name: string
  created_at: string
}

export interface Category {
  id: number
  name: string
  target_percentage: number
  color: string
  description?: string
  created_at: string
}

export interface BudgetGoal {
  id: number
  name: string
  target_amount: number
  current_amount: number
  priority: number
  deadline?: string
  is_completed: boolean
  created_at: string
  updated_at: string
}

export interface BudgetAnalysis {
  total_income: number
  total_expenses: number
  savings_rate: number
  category_totals: Record<string, {
    total: number
    percentage: number
  }>
  rule_comparison?: Record<string, {
    actual_percentage: number
    target_percentage: number
    status: 'under' | 'on_target' | 'over'
  }>
  llm_advice?: string
}

export interface MonthlyTrend {
  month: string
  total_income: number
  total_expenses: number
  savings: number
}

export interface CategoryBreakdown {
  name: string
  value: number
  percentage: number
  color: string
}

export interface SpendingOverview {
  total_transactions: number
  total_income: number
  total_expenses: number
  net_savings: number
  savings_rate: number
  top_merchants: Array<{
    merchant: string
    total_spent: number
    transaction_count: number
  }>
}

export interface UploadResponse {
  status: string
  bank_name: string
  total_transactions: number
  processed_successfully: number
  failed: number
  saved_to_db: number
  errors?: string[]
}
