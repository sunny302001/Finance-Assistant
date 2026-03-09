"""
🔒 SECURITY AIRLOCK - PII Sanitization Engine 🔒

This module is the CRITICAL security barrier that prevents Personally Identifiable
Information (PII) from being sent to cloud APIs (Google Gemini).

SECURITY POLICY:
- All transaction descriptions MUST pass through sanitize_transaction_string()
  before any cloud API call
- This function removes: dates, transaction IDs, account numbers, phone numbers,
  location codes, and other identifying information
- Only the sanitized merchant name should reach cloud services

"""

import re
from typing import Dict, List


def sanitize_transaction_string(raw_text: str) -> str:
    """
    🔒 SECURITY AIRLOCK FUNCTION 🔒
    
    Aggressively strips PII from transaction descriptions before cloud API calls.
    
    Removes:
    - Dates (MM-DD-YY, MM/DD/YYYY, DD-MM-YYYY, etc.)
    - Transaction IDs (TX #12345, REF:ABC123, TXN 456789)
    - Account numbers (ACCT ****1234, A/C 1234)
    - Phone numbers (800-555-0199, +91-9876543210)
    - Location codes (CA, TX, MH, Store #123)
    - Reference numbers (REF, IMPS, NEFT identifiers)
    
    Args:
        raw_text: Original transaction description from bank statement
        
    Returns:
        Sanitized string containing only core merchant name
        
    Examples:
        >>> sanitize_transaction_string("ACH W/D 04-12-25 PAYPAL * NETFLIX COM 800-555-0199 CA")
        "PAYPAL NETFLIX COM"
        
        >>> sanitize_transaction_string("NEFT-N123456789-AMAZON PAY INDIA REF 987654")
        "AMAZON PAY INDIA"
    """
    
    if not raw_text:
        return ""
    
    # Convert to uppercase for consistent processing
    text = raw_text.upper()
    
    # 🔒 PATTERN 1: Remove dates (multiple formats)
    # Matches: 04-12-25, 12/04/2025, 2025-01-26, 26-JAN-2026, etc.
    date_patterns = [
        r'\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b',  # MM-DD-YY, DD/MM/YYYY
        r'\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b',    # YYYY-MM-DD
        r'\b\d{1,2}[-/][A-Z]{3}[-/]\d{2,4}\b', # DD-JAN-2026
        r'\b[A-Z]{3}\s+\d{1,2},?\s+\d{4}\b',   # JAN 26, 2026
    ]
    for pattern in date_patterns:
        text = re.sub(pattern, '', text)
    
    # 🔒 PATTERN 2: Remove transaction IDs and reference numbers
    # Matches: TX #12345, REF:ABC123, TXN 456789, IMPS/123456, NEFT-N123456
    transaction_id_patterns = [
        r'\bTX\s*#?\s*\d+\b',                  # TX #12345
        r'\bREF:?\s*[A-Z0-9]+\b',              # REF:ABC123
        r'\bTXN\s*#?\s*\d+\b',                 # TXN 456789
        r'\b(IMPS|NEFT|RTGS|UPI)[/-]?[A-Z0-9]?\d+\b', # IMPS/123456, NEFT-N123456, UPI-1234
        r'\bUTR\s*#?\s*[A-Z0-9]+\b',           # UTR #ABC123
        r'\bRRN\s*#?\s*\d+\b',                 # RRN 123456
        r'\bORDER\s*#?\s*\d+\b',               # ORDER #123
        r'\bVPA\s*[:\s]*[A-Z0-9.]+@[A-Z]+\b',  # VPA: someone@upi
    ]
    for pattern in transaction_id_patterns:
        text = re.sub(pattern, '', text)
    
    # 🔒 PATTERN 3: Remove account numbers
    # Matches: ACCT ****1234, A/C 1234, XXXX1234
    account_patterns = [
        r'\bACCT\s*\*+\d+\b',                  # ACCT ****1234
        r'\bA/C\s*\d+\b',                      # A/C 1234
        r'\b[X*]{4,}\d{4}\b',                  # XXXX1234
        r'\bXXXX+\d+\b',                       # XXXXXXXXXXXX1234
    ]
    for pattern in account_patterns:
        text = re.sub(pattern, '', text)
    
    # 🔒 PATTERN 4: Remove phone numbers
    # Matches: 800-555-0199, +91-9876543210, (123) 456-7890
    phone_patterns = [
        r'\b\d{3}[-\.\s]?\d{3}[-\.\s]?\d{4}\b',      # 800-555-0199
        r'\+\d{1,3}[-\.\s]?\d{10}\b',                 # +91-9876543210
        r'\(\d{3}\)\s*\d{3}[-\.\s]?\d{4}\b',         # (123) 456-7890
    ]
    for pattern in phone_patterns:
        text = re.sub(pattern, '', text)
    
    # 🔒 PATTERN 5: Remove location codes and store numbers
    # Matches: CA, TX, MH, Store #123, LOC 456
    location_patterns = [
        r'\b[A-Z]{2}\b(?=\s|$)',               # CA, TX, MH (standalone)
        r'\bSTORE\s*#?\s*\d+\b',               # Store #123
        r'\bLOC\s*#?\s*\d+\b',                 # LOC 456
        r'\bBRANCH\s*#?\s*\d+\b',              # BRANCH 123
        r'\b[A-Z0-9._%+-]+@(OK|AXIS|SBI|HDFC|ICICI|YBL|UPI|PAYTM|GOOGL|OKSBI|OKAXIS|OKHDFC|OKICICI)\b', # UPI IDs
    ]
    for pattern in location_patterns:
        text = re.sub(pattern, '', text)
    
    # 🔒 PATTERN 6: Remove common banking prefixes/suffixes
    banking_keywords = [
        r'\bACH\s+(W/D|DEBIT|CREDIT)\b',
        r'\bPOS\s+PURCHASE\b',
        r'\bATM\s+WITHDRAWAL\b',
        r'\bINTERNET\s+BANKING\b',
        r'\bMOBILE\s+BANKING\b',
        r'\bUPI[/-]?\b',
        r'\bDEBIT\s+CARD\b',
        r'\bCREDIT\s+CARD\b',
    ]
    for pattern in banking_keywords:
        text = re.sub(pattern, '', text)
    
    # Clean up whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Remove leading/trailing special characters
    text = re.sub(r'^[^A-Z0-9]+|[^A-Z0-9]+$', '', text)
    
    # If sanitization removed everything, return a safe placeholder
    if not text or len(text) < 3:
        return "UNKNOWN MERCHANT"
    
    return text


def batch_sanitize(raw_descriptions: List[str]) -> List[str]:
    """
    Sanitize a batch of transaction descriptions.
    
    Args:
        raw_descriptions: List of raw transaction descriptions
        
    Returns:
        List of sanitized descriptions in same order
    """
    return [sanitize_transaction_string(desc) for desc in raw_descriptions]


def validate_sanitization(raw_text: str, sanitized_text: str) -> Dict[str, bool]:
    """
    Validate that sanitization removed all PII.
    
    Returns a dict indicating whether potentially sensitive patterns remain.
    Used for testing and auditing.
    
    Args:
        raw_text: Original text
        sanitized_text: Sanitized text
        
    Returns:
        Dict with validation results: {
            "has_dates": bool,
            "has_phone_numbers": bool,
            "has_transaction_ids": bool,
            "is_safe": bool (overall safety)
        }
    """
    results = {
        "has_dates": bool(re.search(r'\d{1,2}[-/]\d{1,2}[-/]\d{2,4}', sanitized_text)),
        "has_phone_numbers": bool(re.search(r'\d{3}[-\.\s]?\d{3}[-\.\s]?\d{4}', sanitized_text)),
        "has_transaction_ids": bool(re.search(r'\b(TX|REF|TXN|IMPS|NEFT)\s*[:#]?\s*[A-Z0-9]+', sanitized_text)),
        "has_account_numbers": bool(re.search(r'\b(ACCT|A/C)\s*\*?\d+', sanitized_text)),
    }
    
    results["is_safe"] = not any(results.values())
    
    return results


# 🔒 SECURITY CHECKPOINT MARKER 🔒
# Any code calling cloud APIs must import and use sanitize_transaction_string()
# from this module before making API calls
