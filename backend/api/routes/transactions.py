"""
Transaction Management Routes

CRUD operations for transactions.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

from models.database import get_db
from models import transaction as transaction_model

router = APIRouter()


# Pydantic models for request/response
class TransactionResponse(BaseModel):
    id: int
    date: str
    raw_description: str
    sanitized_description: Optional[str]
    merchant_name: Optional[str]
    business_type: Optional[str]
    category: Optional[str]
    amount: float
    transaction_type: str
    balance: float
    source_file: Optional[str]
    bank_name: Optional[str]
    created_at: Optional[str]
    
    class Config:
        from_attributes = True


@router.get("/", response_model=List[TransactionResponse])
async def get_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    category: Optional[str] = None,
    merchant: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get transactions with filtering and pagination.
    
    Query parameters:
    - skip: Offset for pagination (default: 0)
    - limit: Max results (default: 100, max: 500)
    - start_date: Filter by start date (ISO format: 2024-01-01)
    - end_date: Filter by end date (ISO format: 2024-12-31)
    - category: Filter by category (Needs/Wants/Savings/Debt)
    - merchant: Filter by merchant name (partial match)
    """
    
    # Parse dates if provided
    start_dt = datetime.fromisoformat(start_date) if start_date else None
    end_dt = datetime.fromisoformat(end_date) if end_date else None
    
    transactions = transaction_model.get_transactions(
        db=db,
        skip=skip,
        limit=limit,
        start_date=start_dt,
        end_date=end_dt,
        category=category,
        merchant=merchant
    )
    
    return [txn.to_dict() for txn in transactions]


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db)
):
    """Get a single transaction by ID."""
    
    transaction = transaction_model.get_transaction_by_id(db, transaction_id)
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    return transaction.to_dict()


@router.delete("/{transaction_id}")
async def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db)
):
    """Delete a transaction."""
    
    success = transaction_model.delete_transaction(db, transaction_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    return {"status": "success", "message": "Transaction deleted"}


@router.get("/summary/by-category")
async def get_category_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get spending summary grouped by category.
    
    Returns:
        {
            'Needs': 15000.00,
            'Wants': 8000.00,
            'Savings': 2000.00,
            'Debt': 1000.00
        }
    """
    
    start_dt = datetime.fromisoformat(start_date) if start_date else None
    end_dt = datetime.fromisoformat(end_date) if end_date else None
    
    totals = transaction_model.get_total_by_category(db, start_dt, end_dt)
    
    return totals
