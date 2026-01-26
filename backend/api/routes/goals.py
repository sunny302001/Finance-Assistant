"""
Budget Goal Management Routes

CRUD operations for budget goals and goal allocation.
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from models.database import get_db
from models import budget_goal as goal_model
from core.financial_calc import split_goal_amount

router = APIRouter()


# Pydantic models
class GoalResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    target_amount: float
    current_amount: float
    priority: int
    deadline: Optional[str]
    is_active: bool
    is_completed: bool
    color: str
    icon: str
    progress_percentage: float
    remaining_amount: float
    days_remaining: Optional[int]
    created_at: Optional[str]
    
    class Config:
        from_attributes = True


class GoalCreate(BaseModel):
    name: str
    description: Optional[str] = None
    target_amount: float
    priority: int = 1
    deadline: Optional[str] = None
    color: Optional[str] = '#3b82f6'
    icon: Optional[str] = '🎯'


class GoalUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None
    priority: Optional[int] = None
    deadline: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    is_active: Optional[bool] = None


@router.get("/", response_model=List[GoalResponse])
async def get_goals(
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """Get all budget goals."""
    
    goals = goal_model.get_all_goals(db, active_only=active_only)
    return [goal.to_dict() for goal in goals]


@router.post("/", response_model=GoalResponse)
async def create_goal(
    goal: GoalCreate,
    db: Session = Depends(get_db)
):
    """Create a new budget goal."""
    
    goal_data = goal.dict()
    
    # Parse deadline if provided
    if goal_data.get('deadline'):
        goal_data['deadline'] = datetime.fromisoformat(goal_data['deadline'])
    
    new_goal = goal_model.create_goal(db, goal_data)
    return new_goal.to_dict()


@router.get("/{goal_id}", response_model=GoalResponse)
async def get_goal(
    goal_id: int,
    db: Session = Depends(get_db)
):
    """Get a single goal by ID."""
    
    goal = goal_model.get_goal_by_id(db, goal_id)
    
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    return goal.to_dict()


@router.patch("/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: int,
    updates: GoalUpdate,
    db: Session = Depends(get_db)
):
    """Update a goal."""
    
    update_data = {k: v for k, v in updates.dict().items() if v is not None}
    
    # Parse deadline if provided
    if 'deadline' in update_data and update_data['deadline']:
        update_data['deadline'] = datetime.fromisoformat(update_data['deadline'])
    
    updated_goal = goal_model.update_goal(db, goal_id, **update_data)
    
    if not updated_goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    return updated_goal.to_dict()


@router.post("/{goal_id}/add-amount")
async def add_amount_to_goal(
    goal_id: int,
    amount: float,
    db: Session = Depends(get_db)
):
    """Add an amount to a goal's progress."""
    
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    
    updated_goal = goal_model.add_to_goal(db, goal_id, amount)
    
    if not updated_goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    return updated_goal.to_dict()


@router.delete("/{goal_id}")
async def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db)
):
    """Delete (deactivate) a goal."""
    
    success = goal_model.delete_goal(db, goal_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    return {"status": "success", "message": "Goal deleted"}


@router.post("/allocate")
async def allocate_to_goals(
    total_amount: float,
    db: Session = Depends(get_db)
):
    """
    Split a lump sum across active goals based on priority.
    
    Uses the goal splitter algorithm from financial_calc.py
    
    Args:
        total_amount: Amount to allocate (e.g., 10000)
    
    Returns:
        {
            'allocations': {goal_id: amount, ...},
            'updated_goals': [goals after allocation]
        }
    """
    
    if total_amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    
    # Get active goals for splitting
    goals = goal_model.get_active_goals_for_splitting(db)
    
    if not goals:
        raise HTTPException(status_code=400, detail="No active goals to allocate to")
    
    # Calculate allocations
    allocations = split_goal_amount(total_amount, goals)
    
    # Apply allocations
    updated_goals = []
    for goal_id, amount in allocations.items():
        goal = goal_model.add_to_goal(db, goal_id, amount)
        if goal:
            updated_goals.append(goal.to_dict())
    
    return {
        'total_allocated': total_amount,
        'allocations': allocations,
        'updated_goals': updated_goals
    }
