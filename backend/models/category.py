"""
Category Model

Defines spending categories and their target allocations
based on the 50/30/20 budgeting rule.
"""

from sqlalchemy import Column, Integer, String, Float
from .database import Base


class Category(Base):
    """
    Category model for transaction categorization.
    
    Pre-populated with:
    - Needs (50% target)
    - Wants (30% target)
    - Savings (20% target)
    - Debt (managed within the 20%)
    """
    
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    target_percentage = Column(Float, default=0.0)  # Based on 50/30/20 rule
    color = Column(String, default='#6366f1')  # Hex color for charts
    description = Column(String)  # Description of what fits in this category
    
    def to_dict(self):
        """Convert to dictionary for API responses."""
        return {
            'id': self.id,
            'name': self.name,
            'target_percentage': self.target_percentage,
            'color': self.color,
            'description': self.description
        }
    
    def __repr__(self):
        return f"<Category(name={self.name}, target={self.target_percentage}%)>"


# Default categories
DEFAULT_CATEGORIES = [
    {
        'name': 'Needs',
        'target_percentage': 50.0,
        'color': '#ef4444',  # Red
        'description': 'Essential expenses: housing, utilities, groceries, insurance, healthcare, transportation'
    },
    {
        'name': 'Wants',
        'target_percentage': 30.0,
        'color': '#8b5cf6',  # Purple
        'description': 'Non-essential expenses: entertainment, dining out, subscriptions, shopping, hobbies'
    },
    {
        'name': 'Savings',
        'target_percentage': 20.0,
        'color': '#10b981',  # Green
        'description': 'Savings transfers, investments, emergency fund, retirement contributions'
    },
    {
        'name': 'Debt',
        'target_percentage': 0.0,
        'color': '#f59e0b',  # Amber
        'description': 'Loan payments (EMI), credit card payments, debt reduction'
    }
]


# CRUD functions

def init_default_categories(db):
    """
    Initialize database with default categories.
    
    Call this after database initialization.
    """
    
    existing = db.query(Category).count()
    
    if existing == 0:
        for cat_data in DEFAULT_CATEGORIES:
            category = Category(**cat_data)
            db.add(category)
        
        db.commit()
        print(f"✓ Initialized {len(DEFAULT_CATEGORIES)} default categories")
        return True
    
    return False


def get_all_categories(db):
    """Get all categories."""
    return db.query(Category).all()


def get_category_by_name(db, name: str):
    """Get a category by name."""
    return db.query(Category).filter(Category.name == name).first()


def create_category(db, name: str, target_percentage: float, color: str = None, description: str = None):
    """Create a new category."""
    category = Category(
        name=name,
        target_percentage=target_percentage,
        color=color or '#6366f1',
        description=description
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def update_category(db, category_id: int, **kwargs):
    """Update a category."""
    category = db.query(Category).filter(Category.id == category_id).first()
    
    if category:
        for key, value in kwargs.items():
            if hasattr(category, key):
                setattr(category, key, value)
        
        db.commit()
        db.refresh(category)
    
    return category
