"""
Bank Statement Template System

Provides abstract base class and concrete implementations for parsing
bank statements from different Indian banks (SBI, ICICI, HDFC).

Supports both PDF and CSV formats with automatic template detection.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Optional
import pandas as pd
import pdfplumber
import re
from datetime import datetime
import io


class BankTemplate(ABC):
    """
    Abstract base class for bank statement parsers.
    
    Each bank implementation should override extract_transactions() to handle
    their specific PDF/CSV format.
    """
    
    @abstractmethod
    def extract_transactions(self, file_path: str, password: Optional[str] = None) -> pd.DataFrame:
        """
        Extract transactions from a bank statement file.
        
        Args:
            file_path: Path to the PDF or CSV file
            password: Optional password for protected PDFs
            
        Returns:
            DataFrame with standardized columns:
            - date: datetime object
            - description: str (raw transaction description)
            - amount: float (positive for credit, negative for debit)
            - transaction_type: str ('debit' or 'credit')
            - balance: float (optional, account balance after transaction)
        """
        pass
    
    @abstractmethod
    def detect(self, file_path: str, password: Optional[str] = None) -> bool:
        """
        Detect if this template matches the given file.
        
        Args:
            file_path: Path to the file
            password: Optional password for protected PDFs
            
        Returns:
            True if this template can parse the file
        """
        pass
    
    def _parse_amount(self, amount_str: str) -> float:
        """Helper to parse amount strings with various formats."""
        if not amount_str or pd.isna(amount_str):
            return 0.0
        
        # Remove currency symbols and commas
        cleaned = str(amount_str).replace('₹', '').replace('Rs', '').replace(',', '').strip()
        
        # Handle parentheses as negative (accounting format)
        if '(' in cleaned:
            cleaned = '-' + cleaned.replace('(', '').replace(')', '')
        
        try:
            return float(cleaned)
        except ValueError:
            return 0.0
    
    def _parse_date(self, date_str: str, formats: List[str] = None) -> Optional[datetime]:
        """Helper to parse dates with multiple format attempts."""
        if not date_str or pd.isna(date_str):
            return None
        
        if formats is None:
            formats = [
                '%d/%m/%Y', '%d-%m-%Y', '%d.%m.%Y',  # DD/MM/YYYY variations
                '%d/%m/%y', '%d-%m-%y', '%d.%m.%y',   # DD/MM/YY variations
                '%Y-%m-%d',                            # ISO format
                '%d %b %Y', '%d-%b-%Y',                # DD Mon YYYY
            ]
        
        date_str = str(date_str).strip()
        
        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
        
        return None


class SBITemplate(BankTemplate):
    """
    State Bank of India statement parser.
    
    Handles SBI PDF statement format which typically has:
    - Transaction date, Value date, Description, Ref No, Debit, Credit, Balance
    """
    
    def detect(self, file_path: str, password: Optional[str] = None) -> bool:
        """Detect SBI format by looking for bank name in header."""
        try:
            with pdfplumber.open(file_path, password=password) as pdf:
                first_page_text = pdf.pages[0].extract_text()
                return 'STATE BANK OF INDIA' in first_page_text.upper()
        except:
            return False
    
    def extract_transactions(self, file_path: str, password: Optional[str] = None) -> pd.DataFrame:
        """
        Extract transactions from SBI PDF statement.
        
        SBI format typically has columns:
        Txn Date | Value Date | Description | Ref No./Cheque No. | Debit | Credit | Balance
        """
        transactions = []
        
        with pdfplumber.open(file_path, password=password) as pdf:
            for page in pdf.pages:
                # Extract table data
                table = page.extract_table()
                
                if not table:
                    continue
                
                # Find header row to identify columns
                header_row = None
                for i, row in enumerate(table):
                    if row and any('DESCRIPTION' in str(cell).upper() for cell in row if cell):
                        header_row = i
                        break
                
                if header_row is None:
                    continue
                
                # Process rows after header
                for row in table[header_row + 1:]:
                    if not row or len(row) < 5:
                        continue
                    
                    # Skip empty rows or subtotal rows
                    if not any(cell for cell in row if cell and str(cell).strip()):
                        continue
                    
                    if any(keyword in str(row).upper() for keyword in ['OPENING BALANCE', 'CLOSING BALANCE', 'TOTAL']):
                        continue
                    
                    try:
                        # Typical SBI format: Date, Value Date, Description, Ref, Debit, Credit, Balance
                        txn_date = self._parse_date(row[0]) if len(row) > 0 else None
                        description = str(row[2]).strip() if len(row) > 2 else ""
                        debit = self._parse_amount(row[4]) if len(row) > 4 else 0.0
                        credit = self._parse_amount(row[5]) if len(row) > 5 else 0.0
                        balance = self._parse_amount(row[6]) if len(row) > 6 else 0.0
                        
                        if not txn_date or not description:
                            continue
                        
                        # Determine transaction type and amount
                        if debit > 0:
                            amount = -debit
                            txn_type = 'debit'
                        elif credit > 0:
                            amount = credit
                            txn_type = 'credit'
                        else:
                            continue
                        
                        transactions.append({
                            'date': txn_date,
                            'description': description,
                            'amount': amount,
                            'transaction_type': txn_type,
                            'balance': balance
                        })
                    
                    except Exception as e:
                        continue
        
        return pd.DataFrame(transactions)


class ICICITemplate(BankTemplate):
    """
    ICICI Bank statement parser.
    
    Handles both PDF and CSV formats from ICICI Bank.
    """
    
    def detect(self, file_path: str, password: Optional[str] = None) -> bool:
        """Detect ICICI format."""
        if file_path.endswith('.csv'):
            try:
                df = pd.read_csv(file_path, nrows=5)
                # ICICI CSV typically has specific headers
                headers = [str(col).upper() for col in df.columns]
                return any('ICICI' in h or 'TRANSACTION' in h for h in headers)
            except:
                return False
        else:
            try:
                with pdfplumber.open(file_path, password=password) as pdf:
                    first_page_text = pdf.pages[0].extract_text()
                    return 'ICICI BANK' in first_page_text.upper()
            except:
                return False
    
    def extract_transactions(self, file_path: str, password: Optional[str] = None) -> pd.DataFrame:
        """Extract transactions from ICICI statement (PDF or CSV)."""
        
        if file_path.endswith('.csv'):
            return self._extract_from_csv(file_path)
        else:
            return self._extract_from_pdf(file_path, password)
    
    def _extract_from_csv(self, file_path: str) -> pd.DataFrame:
        """Extract from ICICI CSV format."""
        df = pd.read_csv(file_path)
        
        transactions = []
        
        for _, row in df.iterrows():
            try:
                # Common ICICI CSV columns (may vary)
                # Try to find date column
                date_col = None
                for col in df.columns:
                    if any(keyword in str(col).upper() for keyword in ['DATE', 'TRANSACTION DATE', 'VALUE DATE']):
                        date_col = col
                        break
                
                if not date_col:
                    continue
                
                txn_date = self._parse_date(row[date_col])
                
                # Find description column
                desc_col = None
                for col in df.columns:
                    if any(keyword in str(col).upper() for keyword in ['DESCRIPTION', 'PARTICULARS', 'NARRATION']):
                        desc_col = col
                        break
                
                description = str(row[desc_col]) if desc_col else ""
                
                # Find amount columns
                debit = 0.0
                credit = 0.0
                
                for col in df.columns:
                    col_upper = str(col).upper()
                    if 'DEBIT' in col_upper or 'WITHDRAWAL' in col_upper:
                        debit = self._parse_amount(row[col])
                    elif 'CREDIT' in col_upper or 'DEPOSIT' in col_upper:
                        credit = self._parse_amount(row[col])
                
                if debit > 0:
                    amount = -debit
                    txn_type = 'debit'
                elif credit > 0:
                    amount = credit
                    txn_type = 'credit'
                else:
                    continue
                
                # Find balance column
                balance = 0.0
                for col in df.columns:
                    if 'BALANCE' in str(col).upper():
                        balance = self._parse_amount(row[col])
                        break
                
                transactions.append({
                    'date': txn_date,
                    'description': description,
                    'amount': amount,
                    'transaction_type': txn_type,
                    'balance': balance
                })
            
            except Exception as e:
                continue
        
        return pd.DataFrame(transactions)
    
    def _extract_from_pdf(self, file_path: str, password: Optional[str] = None) -> pd.DataFrame:
        """Extract from ICICI PDF format."""
        transactions = []
        
        with pdfplumber.open(file_path, password=password) as pdf:
            for page in pdf.pages:
                table = page.extract_table()
                
                if not table:
                    continue
                
                # Find header row
                header_row = None
                for i, row in enumerate(table):
                    if row and any('PARTICULARS' in str(cell).upper() or 'DESCRIPTION' in str(cell).upper() for cell in row if cell):
                        header_row = i
                        break
                
                if header_row is None:
                    continue
                
                for row in table[header_row + 1:]:
                    if not row or len(row) < 4:
                        continue
                    
                    try:
                        # Typical ICICI format: Date, Particulars, Debit, Credit, Balance
                        txn_date = self._parse_date(row[0])
                        description = str(row[1]).strip()
                        debit = self._parse_amount(row[2]) if len(row) > 2 else 0.0
                        credit = self._parse_amount(row[3]) if len(row) > 3 else 0.0
                        balance = self._parse_amount(row[4]) if len(row) > 4 else 0.0
                        
                        if not txn_date or not description:
                            continue
                        
                        if debit > 0:
                            amount = -debit
                            txn_type = 'debit'
                        elif credit > 0:
                            amount = credit
                            txn_type = 'credit'
                        else:
                            continue
                        
                        transactions.append({
                            'date': txn_date,
                            'description': description,
                            'amount': amount,
                            'transaction_type': txn_type,
                            'balance': balance
                        })
                    
                    except Exception as e:
                        continue
        
        return pd.DataFrame(transactions)


class HDFCTemplate(BankTemplate):
    """
    HDFC Bank statement parser.
    
    Handles HDFC PDF statement format.
    """
    
    def detect(self, file_path: str, password: Optional[str] = None) -> bool:
        """Detect HDFC format."""
        try:
            with pdfplumber.open(file_path, password=password) as pdf:
                first_page_text = pdf.pages[0].extract_text()
                return 'HDFC BANK' in first_page_text.upper()
        except:
            return False
    
    def extract_transactions(self, file_path: str, password: Optional[str] = None) -> pd.DataFrame:
        """
        Extract transactions from HDFC PDF statement.
        
        HDFC format typically has:
        Date | Narration | Chq./Ref.No. | Value Dt | Withdrawal Amt. | Deposit Amt. | Closing Balance
        """
        transactions = []
        
        with pdfplumber.open(file_path, password=password) as pdf:
            for page in pdf.pages:
                table = page.extract_table()
                
                if not table:
                    continue
                
                # Find header row
                header_row = None
                for i, row in enumerate(table):
                    if row and any('NARRATION' in str(cell).upper() or 'PARTICULARS' in str(cell).upper() for cell in row if cell):
                        header_row = i
                        break
                
                if header_row is None:
                    continue
                
                for row in table[header_row + 1:]:
                    if not row or len(row) < 5:
                        continue
                    
                    # Skip summary rows
                    if any(keyword in str(row).upper() for keyword in ['OPENING BALANCE', 'CLOSING BALANCE', 'TOTAL']):
                        continue
                    
                    try:
                        # HDFC format: Date, Narration, Ref, Value Date, Withdrawal, Deposit, Balance
                        txn_date = self._parse_date(row[0])
                        description = str(row[1]).strip()
                        withdrawal = self._parse_amount(row[4]) if len(row) > 4 else 0.0
                        deposit = self._parse_amount(row[5]) if len(row) > 5 else 0.0
                        balance = self._parse_amount(row[6]) if len(row) > 6 else 0.0
                        
                        if not txn_date or not description:
                            continue
                        
                        if withdrawal > 0:
                            amount = -withdrawal
                            txn_type = 'debit'
                        elif deposit > 0:
                            amount = deposit
                            txn_type = 'credit'
                        else:
                            continue
                        
                        transactions.append({
                            'date': txn_date,
                            'description': description,
                            'amount': amount,
                            'transaction_type': txn_type,
                            'balance': balance
                        })
                    
                    except Exception as e:
                        continue
        
        return pd.DataFrame(transactions)


class GenericCSVTemplate(BankTemplate):
    """
    Generic CSV parser for unknown bank formats.
    
    Requires manual column mapping from the user.
    """
    
    def detect(self, file_path: str, password: Optional[str] = None) -> bool:
        """Generic CSV always returns True as fallback."""
        return file_path.endswith('.csv')
    
    def extract_transactions(self, file_path: str, password: Optional[str] = None, column_mapping: Optional[Dict[str, str]] = None) -> pd.DataFrame:
        """
        Extract with user-provided column mapping.
        
        Args:
            file_path: Path to CSV file
            column_mapping: Dict mapping standard names to CSV column names:
                {
                    'date': 'Transaction Date',
                    'description': 'Particulars',
                    'debit': 'Withdrawal',
                    'credit': 'Deposit',
                    'balance': 'Balance'
                }
        """
        df = pd.read_csv(file_path)
        
        if not column_mapping:
            # Return empty DataFrame with preview data for manual mapping
            return df.head(10)
        
        transactions = []
        
        for _, row in df.iterrows():
            try:
                txn_date = self._parse_date(row[column_mapping['date']])
                description = str(row[column_mapping['description']])
                
                debit = 0.0
                credit = 0.0
                
                if 'debit' in column_mapping:
                    debit = self._parse_amount(row[column_mapping['debit']])
                if 'credit' in column_mapping:
                    credit = self._parse_amount(row[column_mapping['credit']])
                
                # If single amount column
                if 'amount' in column_mapping:
                    amt = self._parse_amount(row[column_mapping['amount']])
                    if amt < 0:
                        debit = abs(amt)
                    else:
                        credit = amt
                
                if debit > 0:
                    amount = -debit
                    txn_type = 'debit'
                elif credit > 0:
                    amount = credit
                    txn_type = 'credit'
                else:
                    continue
                
                balance = 0.0
                if 'balance' in column_mapping:
                    balance = self._parse_amount(row[column_mapping.get('balance', '')])
                
                transactions.append({
                    'date': txn_date,
                    'description': description,
                    'amount': amount,
                    'transaction_type': txn_type,
                    'balance': balance
                })
            
            except Exception as e:
                continue
        
        return pd.DataFrame(transactions)


class TemplateDetector:
    """
    Automatic bank template detection.
    
    Tries each template's detect() method and returns the first match.
    Falls back to GenericCSVTemplate if no match found.
    """
    
    def __init__(self):
        self.templates = [
            SBITemplate(),
            ICICITemplate(),
            HDFCTemplate(),
        ]
    
    def detect_template(self, file_path: str, password: Optional[str] = None) -> BankTemplate:
        """
        Auto-detect the appropriate template for a file.
        
        Args:
            file_path: Path to the statement file
            password: Optional password for protected PDFs
            
        Returns:
            Matched BankTemplate instance or GenericCSVTemplate as fallback (if CSV)
        """
        # First check if PDF is encrypted and password is missing
        if file_path.lower().endswith('.pdf'):
            try:
                import pdfplumber
                with pdfplumber.open(file_path, password=password) as pdf:
                    pass
            except Exception as e:
                error_msg = str(e).lower()
                if "password" in error_msg or "encrypted" in error_msg:
                    if not password:
                        raise ValueError("NEEDS_PASSWORD: This PDF is password protected.")
                    else:
                        raise ValueError("INVALID_PASSWORD: The password provided is incorrect.")
                raise ValueError(f"Could not read PDF file: {str(e)}")

        for template in self.templates:
            try:
                if template.detect(file_path, password=password):
                    return template
            except Exception:
                continue

        # Fallback for unknown format (only if CSV)
        if file_path.lower().endswith('.csv'):
            return GenericCSVTemplate()
            
        raise ValueError("Unsupported bank or statement format. Currently supporting SBI, ICICI, and HDFC PDFs.")
    
    def get_template_name(self, template: BankTemplate) -> str:
        """Get human-readable name of detected template."""
        return template.__class__.__name__.replace('Template', '')
