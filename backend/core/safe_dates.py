"""
Safe Date Parsing Utility
Prevents 500 errors by gracefully handling invalid date strings.
"""

from datetime import datetime
from fastapi import HTTPException

def parse_date_safe(date_str: str, field_name: str = "date") -> datetime:
    """
    Parse an ISO format date string safely.
    Raises HTTPException 400 if parsing fails.
    """
    if not date_str:
        return None
        
    try:
        return datetime.fromisoformat(date_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid date format for '{field_name}'. Expected ISO format (YYYY-MM-DD)."
        )
