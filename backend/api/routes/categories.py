"""
Category Management Routes

CRUD operations for budget categories.
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from models.database import get_db
from models import category as category_model

router = APIRouter()


# Pydantic models
class CategoryResponse(BaseModel):
    id: int
    name: str
    target_percentage: float
    color: str
    description: Optional[str]
    
    class Config:
        from_attributes = True


class CategoryCreate(BaseModel):
    name: str
    target_percentage: float
    color: Optional[str] = '#6366f1'
    description: Optional[str] = None


@router.get("/", response_model=List[CategoryResponse])
async def get_categories(db: Session = Depends(get_db)):
    """Get all categories."""
    
    categories = category_model.get_all_categories(db)
    return [cat.to_dict() for cat in categories]


@router.post("/", response_model=CategoryResponse)
async def create_category(
    category: CategoryCreate,
    db: Session = Depends(get_db)
):
    """Create a new category."""
    
    # Check if category name already exists
    existing = category_model.get_category_by_name(db, category.name)
    if existing:
        raise HTTPException(status_code=400, detail="Category name already exists")
    
    new_category = category_model.create_category(
        db=db,
        name=category.name,
        target_percentage=category.target_percentage,
        color=category.color,
        description=category.description
    )
    
    return new_category.to_dict()


@router.patch("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int,
    updates: dict,
    db: Session = Depends(get_db)
):
    """Update a category."""
    
    updated_category = category_model.update_category(db, category_id, **updates)
    
    if not updated_category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return updated_category.to_dict()
