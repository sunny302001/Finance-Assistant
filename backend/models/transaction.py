"""
Transaction Model

Stores all transaction data including:
- Raw and sanitized descriptions
- Merchant information from Gemini
- Category from Ollama
- Financial details
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Index
from sqlalchemy.sql import func
from .database import Base
from datetime import datetime


class Transaction(Base):
    """
    Transaction model representing a single bank transaction.
    
    Contains both raw data (for user reference) and processed data
    (sanitized descriptions, merchant names, categories).
    """
    
    __tablename__ = "transactions"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Transaction details
    date = Column(DateTime, nullable=False, index=True)
    raw_description = Column(String, nullable=False)  # Original from PDF
    sanitized_description = Column(String)  # After PII removal
    
    # Enriched data from AI
    merchant_name = Column(String, index=True)  # From Gemini
    business_type = Column(String)  # From Gemini
    category = Column(String, index=True)  # From Ollama (Needs/Wants/Savings/Debt)
    
    # Financial data
    amount = Column(Float, nullable=False)  # Negative for debits, positive for credits
    transaction_type = Column(String, nullable=False)  # 'debit' or 'credit'
    balance = Column(Float, default=0.0)  # Account balance after transaction
    
    # Metadata
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Source information
    source_file = Column(String)  # Name of the uploaded file
    bank_name = Column(String)  # Detected bank (SBI, ICICI, HDFC)
    
    # Indexes for common queries
    __table_args__ = (
        Index('idx_date_category', 'date', 'category'),
        Index('idx_merchant_category', 'merchant_name', 'category'),
    )
    
    def to_dict(self):
        """Convert to dictionary for API responses."""
        return {
            'id': self.id,
            'date': self.date.isoformat() if self.date else None,
            'raw_description': self.raw_description,
            'sanitized_description': self.sanitized_description,
            'merchant_name': self.merchant_name,
            'business_type': self.business_type,
            'category': self.category,
            'amount': self.amount,
            'transaction_type': self.transaction_type,
            'balance': self.balance,
            'source_file': self.source_file,
            'bank_name': self.bank_name,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f"<Transaction(id={self.id}, date={self.date}, merchant={self.merchant_name}, amount={self.amount})>"


# CRUD functions

def create_transaction(db, transaction_data: dict):
    """Create a new transaction."""
    transaction = Transaction(**transaction_data)
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


def bulk_create_transactions(db, transactions_data: list):
    """
    Create multiple transactions efficiently.
    
    Used by batch processor after processing a statement.
    """
    transactions = [Transaction(**data) for data in transactions_data]
    db.bulk_save_objects(transactions)
    db.commit()
    return len(transactions)


def get_transactions(
    db,
    skip: int = 0,
    limit: int = 100,
    start_date: datetime = None,
    end_date: datetime = None,
    category: str = None,
    merchant: str = None
):
    """
    Get transactions with filtering.
    
    Args:
        db: Database session
        skip: Offset for pagination
        limit: Max results
        start_date: Filter by start date
        end_date: Filter by end date
        category: Filter by category
        merchant: Filter by merchant name
    """
    
    query = db.query(Transaction)
    
    if start_date:
        query = query.filter(Transaction.date >= start_date)
    if end_date:
        query = query.filter(Transaction.date <= end_date)
    if category:
        query = query.filter(Transaction.category == category)
    if merchant:
        query = query.filter(Transaction.merchant_name.ilike(f'%{merchant}%'))
    
    return query.order_by(Transaction.date.desc()).offset(skip).limit(limit).all()


def get_transaction_by_id(db, transaction_id: int):
    """Get a single transaction by ID."""
    return db.query(Transaction).filter(Transaction.id == transaction_id).first()


def delete_transaction(db, transaction_id: int):
    """Delete a transaction."""
    transaction = get_transaction_by_id(db, transaction_id)
    if transaction:
        db.delete(transaction)
        db.commit()
        return True
    return False


def get_total_by_category(db, start_date: datetime = None, end_date: datetime = None):
    """
    Get spending totals grouped by category.
    
    Returns dict: {'Needs': 15000.0, 'Wants': 8000.0, ...}
    """
    from sqlalchemy import func
    
    query = db.query(
        Transaction.category,
        func.sum(func.abs(Transaction.amount)).label('total')
    ).filter(Transaction.transaction_type == 'debit')
    
    if start_date:
        query = query.filter(Transaction.date >= start_date)
    if end_date:
        query = query.filter(Transaction.date <= end_date)
    
    results = query.group_by(Transaction.category).all()
    
    return {category: float(total) for category, total in results if category}
