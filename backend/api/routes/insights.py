"""
Financial Insights Routes

Endpoints for financial analysis and AI-powered advice.

🔒 CRITICAL: Python does ALL calculations. LLM provides commentary only.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from models.database import get_db
from models import transaction as transaction_model
from core.financial_calc import (
    calculate_budget_analysis,
    calculate_monthly_trend,
    compare_to_50_30_20
)
from core.ai_clients import OllamaClient

router = APIRouter()


# Pydantic models
class BudgetAnalysisResponse(BaseModel):
    total_income: float
    total_expenses: float
    savings_rate: float
    category_totals: dict
    rule_comparison: dict
    llm_advice: Optional[str] = None


@router.get("/budget-analysis", response_model=BudgetAnalysisResponse)
async def get_budget_analysis(
    income: float = Query(..., description="Total income for the period"),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    include_advice: bool = True,
    db: Session = Depends(get_db)
):
    """
    🔒 PYTHON MATH + LLM COMMENTARY 🔒
    
    Complete budget analysis comparing spending to the 50/30/20 rule.
    
    Args:
        income: Total income for the period
        start_date: Analysis start date (default: 30 days ago)
        end_date: Analysis end date (default: today)
        include_advice: Whether to include LLM-generated advice
    
    Returns:
        Full budget analysis with:
        - Category totals (calculated by Python)
        - Savings rate (calculated by Python)
        - 50/30/20 comparison (calculated by Python)
        - Optional LLM advice (commentary only, no math)
    """
    
    # Default to last 30 days if not provided
    if not end_date:
        end_date = datetime.now().isoformat()
    if not start_date:
        start_date = (datetime.now() - timedelta(days=30)).isoformat()
    
    start_dt = datetime.fromisoformat(start_date)
    end_dt = datetime.fromisoformat(end_date)
    
    # Get all transactions in period
    transactions = transaction_model.get_transactions(
        db=db,
        start_date=start_dt,
        end_date=end_dt,
        skip=0,
        limit=10000  # Get all transactions
    )
    
    # Convert to dict format for calculations
    txn_dicts = [txn.to_dict() for txn in transactions]
    
    # 🔒 PYTHON DOES ALL MATH 🔒
    analysis = calculate_budget_analysis(txn_dicts, income)
    
    # Prepare response
    result = {
        'total_income': analysis.total_income,
        'total_expenses': analysis.total_expenses,
        'savings_rate': analysis.savings_rate,
        'category_totals': {
            cat.category: {
                'total': cat.total,
                'percentage': cat.percentage,
                'transaction_count': cat.transaction_count
            }
            for cat in analysis.category_totals.values()
        },
        'rule_comparison': analysis.rule_comparison
    }
    
    # Get LLM advice if requested
    if include_advice:
        try:
            ollama = OllamaClient()
            
            # Extract category totals
            category_totals_dict = {
                cat.category: cat.total
                for cat in analysis.category_totals.values()
            }
            
            advice = await ollama.get_financial_advice(
                category_totals=category_totals_dict,
                total_income=income,
                savings_rate=analysis.savings_rate
            )
            
            result['llm_advice'] = advice
        
        except Exception as e:
            result['llm_advice'] = f"Unable to generate advice: {str(e)}"
    
    return result


@router.get("/monthly-trend")
async def get_monthly_trend(
    months: int = Query(6, ge=1, le=24),
    db: Session = Depends(get_db)
):
    """
    Get spending trends over multiple months.
    
    Args:
        months: Number of months to analyze (1-24)
    
    Returns:
        {
            'Needs': [15000, 16000, 14500, ...],
            'Wants': [8000, 9000, 7500, ...],
            'months': ['2024-01', '2024-02', ...]
        }
    """
    
    # Get all transactions from the last N months
    start_date = datetime.now() - timedelta(days=months * 31)
    
    transactions = transaction_model.get_transactions(
        db=db,
        start_date=start_date,
        skip=0,
        limit=100000
    )
    
    txn_dicts = [txn.to_dict() for txn in transactions]
    
    trend_data = calculate_monthly_trend(txn_dicts, months)
    
    # Generate month labels
    current_date = datetime.now()
    month_labels = []
    for i in range(months):
        month_date = current_date - timedelta(days=(months - i - 1) * 31)
        month_labels.append(month_date.strftime('%Y-%m'))
    
    trend_data['months'] = month_labels
    
    return trend_data


@router.get("/category-breakdown")
async def get_category_breakdown(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get category breakdown for visualization (pie chart).
    
    Returns data formatted for Recharts PieChart.
    """
    
    start_dt = datetime.fromisoformat(start_date) if start_date else None
    end_dt = datetime.fromisoformat(end_date) if end_date else None
    
    totals = transaction_model.get_total_by_category(db, start_dt, end_dt)
    
    # Format for Recharts
    total_amount = sum(totals.values())
    
    chart_data = []
    colors = {
        'Needs': '#ef4444',
        'Wants': '#8b5cf6',
        'Savings': '#10b981',
        'Debt': '#f59e0b'
    }
    
    for category, amount in totals.items():
        percentage = (amount / total_amount * 100) if total_amount > 0 else 0
        
        chart_data.append({
            'name': category,
            'value': amount,
            'percentage': round(percentage, 1),
            'color': colors.get(category, '#6366f1')
        })
    
    return {
        'data': chart_data,
        'total': total_amount
    }


@router.get("/spending-overview")
async def get_spending_overview(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get high-level spending overview for dashboard.
    
    Returns:
        {
            'total_expenses': float,
            'transaction_count': int,
            'top_merchants': [{'merchant': str, 'amount': float}, ...],
            'top_categories': [{'category': str, 'amount': float}, ...]
        }
    """
    
    start_dt = datetime.fromisoformat(start_date) if start_date else None
    end_dt = datetime.fromisoformat(end_date) if end_date else None
    
    # Get all transactions
    transactions = transaction_model.get_transactions(
        db=db,
        start_date=start_dt,
        end_date=end_dt,
        skip=0,
        limit=10000
    )
    
    # Calculate totals
    total_expenses = 0
    merchant_totals = {}
    category_totals = {}
    
    for txn in transactions:
        if txn.transaction_type == 'debit':
            amount = abs(txn.amount)
            total_expenses += amount
            
            # Aggregate by merchant
            merchant = txn.merchant_name or 'Unknown'
            merchant_totals[merchant] = merchant_totals.get(merchant, 0) + amount
            
            # Aggregate by category
            category = txn.category or 'Wants'
            category_totals[category] = category_totals.get(category, 0) + amount
    
    # Get top merchants
    top_merchants = sorted(
        [{'merchant': k, 'amount': v} for k, v in merchant_totals.items()],
        key=lambda x: x['amount'],
        reverse=True
    )[:10]
    
    # Get top categories
    top_categories = sorted(
        [{'category': k, 'amount': v} for k, v in category_totals.items()],
        key=lambda x: x['amount'],
        reverse=True
    )
    
    return {
        'total_expenses': total_expenses,
        'transaction_count': len(transactions),
        'top_merchants': top_merchants,
        'top_categories': top_categories
    }
