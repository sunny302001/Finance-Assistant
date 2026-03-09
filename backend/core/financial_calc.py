"""
Financial Calculation Engine

Pure Python mathematical functions for financial insights.

🔒 CRITICAL RULE: Python does ALL calculations. LLMs ONLY provide commentary.

Functions for:
- Savings rate calculation
- Category totals
- 50/30/20 rule comparison
- Goal splitting algorithms
"""

from typing import Dict, List, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass


@dataclass
class CategoryTotal:
    """Represents spending total for a category."""
    category: str
    total: float
    percentage: float
    transaction_count: int


@dataclass
class BudgetAnalysis:
    """Complete budget analysis results."""
    total_income: float
    total_expenses: float
    savings_rate: float
    category_totals: Dict[str, CategoryTotal]
    rule_comparison: Dict[str, Dict[str, float]]  # Actual vs. target percentages


def calculate_savings_rate(income: float, expenses: float) -> float:
    """
    Calculate savings rate percentage.
    
    Formula: (income - expenses) / income * 100
    
    Args:
        income: Total income
        expenses: Total expenses (positive number)
    
    Returns:
        Savings rate as percentage (0-100)
    
    Examples:
        >>> calculate_savings_rate(50000, 45000)
        10.0
        >>> calculate_savings_rate(100000, 80000)
        20.0
    """
    
    if income <= 0:
        return 0.0
    
    savings = income - expenses
    rate = (savings / income) * 100
    
    return max(0.0, rate)  # Can't be negative


def calculate_category_totals(transactions: List[Dict]) -> Dict[str, CategoryTotal]:
    """
    Calculate total spending by category.
    
    Args:
        transactions: List of transaction dicts with 'category' and 'amount' keys
    
    Returns:
        Dict mapping category name to CategoryTotal object
    
    Example:
        >>> txns = [
        ...     {'category': 'Needs', 'amount': -1000},
        ...     {'category': 'Wants', 'amount': -500},
        ...     {'category': 'Needs', 'amount': -500}
        ... ]
        >>> totals = calculate_category_totals(txns)
        >>> totals['Needs'].total
        1500.0
    """
    
    category_data = {}
    total_expenses = 0
    
    for txn in transactions:
        category = txn.get('category', 'Wants')
        amount = abs(float(txn.get('amount', 0)))  # Use absolute value
        
        # Only count debits (expenses)
        if txn.get('transaction_type') == 'debit' or txn.get('amount', 0) < 0:
            if category not in category_data:
                category_data[category] = {
                    'total': 0,
                    'count': 0
                }
            
            category_data[category]['total'] += amount
            category_data[category]['count'] += 1
            total_expenses += amount
    
    # Calculate percentages
    result = {}
    for category, data in category_data.items():
        percentage = (data['total'] / total_expenses * 100) if total_expenses > 0 else 0
        
        result[category] = CategoryTotal(
            category=category,
            total=data['total'],
            percentage=percentage,
            transaction_count=data['count']
        )
    
    return result


def compare_to_50_30_20(
    category_totals: Dict[str, CategoryTotal],
    total_income: float
) -> Dict[str, Dict[str, float]]:
    """
    Compare actual spending to the 50/30/20 rule.
    
    Rule:
    - 50% on Needs
    - 30% on Wants
    - 20% on Savings (+ Debt payments)
    
    Args:
        category_totals: Dict from calculate_category_totals()
        total_income: Total income for the period
    
    Returns:
        Dict with comparison data:
        {
            'Needs': {
                'actual_amount': 25000,
                'actual_percentage': 50,
                'target_percentage': 50,
                'target_amount': 25000,
                'difference': 0,
                'status': 'on_target' | 'over' | 'under'
            },
            ...
        }
    """
    
    targets = {
        'Needs': 50,
        'Wants': 30,
        'Savings': 20,
        'Debt': 0  # Debt counts toward the 20% savings/debt allocation
    }
    
    result = {}
    
    for category, target_pct in targets.items():
        actual_amount = category_totals.get(category, CategoryTotal(category, 0, 0, 0)).total
        actual_pct = (actual_amount / total_income * 100) if total_income > 0 else 0
        target_amount = total_income * (target_pct / 100)
        difference = actual_amount - target_amount
        
        # Determine status
        if abs(difference) < (total_income * 0.05):  # Within 5% tolerance
            status = 'on_target'
        elif difference > 0:
            status = 'over'
        else:
            status = 'under'
        
        result[category] = {
            'actual_amount': actual_amount,
            'actual_percentage': actual_pct,
            'target_percentage': target_pct,
            'target_amount': target_amount,
            'difference': difference,
            'status': status
        }
    
    # Adjust for Savings + Debt combined (should be 20%)
    savings_debt_actual = (
        result['Savings']['actual_amount'] + 
        result['Debt']['actual_amount']
    )
    savings_debt_pct = (savings_debt_actual / total_income * 100) if total_income > 0 else 0
    
    result['Savings_Debt_Combined'] = {
        'actual_amount': savings_debt_actual,
        'actual_percentage': savings_debt_pct,
        'target_percentage': 20,
        'target_amount': total_income * 0.2,
        'difference': savings_debt_actual - (total_income * 0.2),
        'status': 'on_target' if abs(savings_debt_pct - 20) < 5 else ('over' if savings_debt_pct > 20 else 'under')
    }
    
    return result


def split_goal_amount(
    total_amount: float,
    goals: List[Dict]
) -> Dict[str, float]:
    """
    Split a lump sum across multiple budget goals based on priority.
    
    Algorithm:
    - Goals with same priority get equal share of their portion
    - Higher priority number = higher allocation
    
    Args:
        total_amount: Amount to split (e.g., 10000)
        goals: List of goal dicts with 'id', 'name', 'priority' keys
            Example: [
                {'id': 1, 'name': 'Emergency Fund', 'priority': 2},
                {'id': 2, 'name': 'Vacation', 'priority': 1},
                {'id': 3, 'name': 'New Laptop', 'priority': 1}
            ]
    
    Returns:
        Dict mapping goal ID to allocated amount:
        {
            1: 5000,  # Emergency Fund gets 50% (priority 2)
            2: 2500,  # Vacation gets 25% (priority 1)
            3: 2500   # Laptop gets 25% (priority 1)
        }
    
    Example:
        >>> goals = [
        ...     {'id': 'emergency', 'priority': 2},
        ...     {'id': 'vacation', 'priority': 1}
        ... ]
        >>> split_goal_amount(9000, goals)
        {'emergency': 6000.0, 'vacation': 3000.0}
    """
    
    if not goals:
        return {}
    
    # Group by priority
    priority_groups = {}
    for goal in goals:
        priority = goal.get('priority', 1)
        if priority not in priority_groups:
            priority_groups[priority] = []
        priority_groups[priority].append(goal)
    
    # Calculate total priority weight
    total_weight = sum(priority * len(goals_in_group) 
                      for priority, goals_in_group in priority_groups.items())
    
    # Allocate amounts
    allocations = {}
    
    for priority, goals_in_group in priority_groups.items():
        # Amount for this priority level
        priority_amount = (priority / total_weight) * total_amount
        
        # Split equally among goals in this priority
        per_goal = priority_amount / len(goals_in_group)
        
        for goal in goals_in_group:
            goal_id = goal.get('id') or goal.get('name')
            allocations[goal_id] = round(per_goal, 2)
    
    return allocations


def calculate_budget_analysis(
    transactions: List[Dict],
    income_amount: float
) -> BudgetAnalysis:
    """
    Complete budget analysis combining all calculations.
    
    Args:
        transactions: List of transaction dicts
        income_amount: Total income for the period
    
    Returns:
        BudgetAnalysis object with all calculations
    """
    
    # Calculate category totals
    category_totals = calculate_category_totals(transactions)
    
    # Calculate total expenses
    total_expenses = sum(cat.total for cat in category_totals.values())
    
    # Calculate savings rate
    savings_rate = calculate_savings_rate(income_amount, total_expenses)
    
    # Compare to 50/30/20 rule
    rule_comparison = compare_to_50_30_20(category_totals, income_amount)
    
    return BudgetAnalysis(
        total_income=income_amount,
        total_expenses=total_expenses,
        savings_rate=savings_rate,
        category_totals=category_totals,
        rule_comparison=rule_comparison
    )


def calculate_monthly_trend(
    transactions: List[Dict],
    months: int = 6
) -> Dict[str, List[float]]:
    """
    Calculate spending trends over multiple months.
    
    Args:
        transactions: List of transactions with 'date' field
        months: Number of months to analyze
    
    Returns:
        Dict mapping category to list of monthly totals
        {
            'Needs': [15000, 16000, 14500, ...],
            'Wants': [8000, 9000, 7500, ...],
            ...
        }
    """
    
    from collections import defaultdict
    
    monthly_data = defaultdict(lambda: defaultdict(float))
    
    for txn in transactions:
        if txn.get('transaction_type') != 'debit':
            continue
        
        # Parse date
        date_str = txn.get('date', '')
        try:
            if isinstance(date_str, str):
                date = datetime.fromisoformat(date_str)
            else:
                date = date_str
        except:
            continue
        
        # Get month key (YYYY-MM)
        month_key = date.strftime('%Y-%m')
        category = txn.get('category', 'Wants')
        amount = abs(float(txn.get('amount', 0)))
        
        monthly_data[month_key][category] += amount
    
    # Convert to list format
    sorted_months = sorted(monthly_data.keys())[-months:]
    
    result = defaultdict(list)
    for month in sorted_months:
        for category in ['Needs', 'Wants', 'Savings', 'Debt']:
            result[category].append(monthly_data[month].get(category, 0))
    
    return dict(result)


def calculate_goal_progress(
    goal_target: float,
    goal_current: float,
    goal_deadline: Optional[datetime] = None
) -> Dict[str, any]:
    """
    Calculate progress toward a budget goal.
    
    Args:
        goal_target: Target amount
        goal_current: Current saved amount
        goal_deadline: Optional deadline date
    
    Returns:
        {
            'progress_percentage': float (0-100),
            'remaining_amount': float,
            'days_remaining': int (if deadline provided),
            'daily_save_needed': float (if deadline provided),
            'on_track': bool
        }
    """
    
    progress_pct = (goal_current / goal_target * 100) if goal_target > 0 else 0
    remaining = goal_target - goal_current
    
    result = {
        'progress_percentage': min(100, progress_pct),
        'remaining_amount': max(0, remaining),
        'is_complete': goal_current >= goal_target
    }
    
    if goal_deadline:
        days_remaining = (goal_deadline - datetime.now()).days
        result['days_remaining'] = max(0, days_remaining)
        
        if days_remaining > 0:
            result['daily_save_needed'] = remaining / days_remaining
            
            # Rough estimate of "on track" (if saving needed is reasonable)
            # Assume "reasonable" is < 10% of typical daily income
            result['on_track'] = result['daily_save_needed'] < (goal_target * 0.001)
        else:
            result['daily_save_needed'] = 0
            result['on_track'] = result['is_complete']
    
    return result
