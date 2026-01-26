"""
Budget Goal Model

Tracks savings goals and their progress.
Supports priority-based goal splitting.
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from sqlalchemy.sql import func
from .database import Base
from datetime import datetime


class BudgetGoal(Base):
    """
    Budget goal model for tracking savings targets.
    
    Supports features like:
    - Target amounts and deadlines
    - Current progress tracking
    - Priority-based allocation (for goal splitter)
    """
    
    __tablename__ = "budget_goals"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Goal details
    name = Column(String, nullable=False)
    description = Column(String)
    target_amount = Column(Float, nullable=False)
    current_amount = Column(Float, default=0.0)
    
    # Priority for goal splitter (higher number = higher priority)
    priority = Column(Integer, default=1)
    
    # Timeline
    deadline = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Status
    is_active = Column(Boolean, default=True)
    is_completed = Column(Boolean, default=False)
    
    # Visual
    color = Column(String, default='#3b82f6')  # Blue
    icon = Column(String, default='🎯')  # Emoji icon
    
    def progress_percentage(self):
        """Calculate progress percentage."""
        if self.target_amount <= 0:
            return 0.0
        return min(100.0, (self.current_amount / self.target_amount) * 100)
    
    def remaining_amount(self):
        """Calculate remaining amount to reach goal."""
        return max(0.0, self.target_amount - self.current_amount)
    
    def days_remaining(self):
        """Calculate days remaining until deadline."""
        if not self.deadline:
            return None
        
        days = (self.deadline - datetime.now()).days
        return max(0, days)
    
    def to_dict(self):
        """Convert to dictionary for API responses."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'target_amount': self.target_amount,
            'current_amount': self.current_amount,
            'priority': self.priority,
            'deadline': self.deadline.isoformat() if self.deadline else None,
            'is_active': self.is_active,
            'is_completed': self.is_completed,
            'color': self.color,
            'icon': self.icon,
            'progress_percentage': self.progress_percentage(),
            'remaining_amount': self.remaining_amount(),
            'days_remaining': self.days_remaining(),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f"<BudgetGoal(name={self.name}, target={self.target_amount}, progress={self.progress_percentage():.1f}%)>"


# CRUD functions

def create_goal(db, goal_data: dict):
    """Create a new budget goal."""
    goal = BudgetGoal(**goal_data)
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


def get_all_goals(db, active_only: bool = True):
    """Get all goals, optionally filtered by active status."""
    query = db.query(BudgetGoal)
    
    if active_only:
        query = query.filter(BudgetGoal.is_active == True)
    
    return query.order_by(BudgetGoal.priority.desc(), BudgetGoal.created_at).all()


def get_goal_by_id(db, goal_id: int):
    """Get a single goal by ID."""
    return db.query(BudgetGoal).filter(BudgetGoal.id == goal_id).first()


def update_goal(db, goal_id: int, **kwargs):
    """Update a goal."""
    goal = get_goal_by_id(db, goal_id)
    
    if goal:
        for key, value in kwargs.items():
            if hasattr(goal, key):
                setattr(goal, key, value)
        
        # Auto-complete if target reached
        if goal.current_amount >= goal.target_amount:
            goal.is_completed = True
        
        db.commit()
        db.refresh(goal)
    
    return goal


def add_to_goal(db, goal_id: int, amount: float):
    """Add an amount to a goal's current progress."""
    goal = get_goal_by_id(db, goal_id)
    
    if goal:
        goal.current_amount += amount
        
        # Check if completed
        if goal.current_amount >= goal.target_amount:
            goal.is_completed = True
            goal.current_amount = goal.target_amount  # Cap at target
        
        db.commit()
        db.refresh(goal)
    
    return goal


def delete_goal(db, goal_id: int):
    """Delete a goal (soft delete by marking inactive)."""
    goal = get_goal_by_id(db, goal_id)
    
    if goal:
        goal.is_active = False
        db.commit()
        return True
    
    return False


def get_active_goals_for_splitting(db):
    """
    Get active goals formatted for the goal splitter algorithm.
    
    Returns list of dicts with 'id', 'name', 'priority' keys.
    """
    goals = get_all_goals(db, active_only=True)
    
    return [
        {
            'id': goal.id,
            'name': goal.name,
            'priority': goal.priority,
            'remaining': goal.remaining_amount()
        }
        for goal in goals
        if not goal.is_completed
    ]
