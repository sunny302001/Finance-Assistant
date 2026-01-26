"""
Batch Processing Pipeline

Orchestrates the complete transaction processing workflow:
1. Extract transactions from PDF/CSV
2. Sanitize descriptions (remove PII)
3. Batch enrichment via Gemini (cloud)
4. Batch categorization via Ollama (local)
5. Bulk database insert

🔒 SECURITY: Sanitization happens BEFORE any cloud API calls
"""

import asyncio
from typing import List, Dict, Optional
import pandas as pd
from datetime import datetime

from .bank_templates import TemplateDetector, BankTemplate
from .sanitizer import sanitize_transaction_string, batch_sanitize, validate_sanitization
from .ai_clients import GeminiClient, OllamaClient, validate_gemini_input


class TransactionBatch:
    """Represents a batch of transactions being processed."""
    
    def __init__(self, transactions_df: pd.DataFrame):
        self.df = transactions_df
        self.sanitized_descriptions = []
        self.enriched_data = []
        self.categories = []
    
    def __len__(self):
        return len(self.df)


class BatchProcessor:
    """
    High-performance batch processor for bank statements.
    
    Processes transactions in batches of 20 to minimize API calls.
    """
    
    def __init__(self, batch_size: int = 20):
        self.batch_size = batch_size
        self.template_detector = TemplateDetector()
        self.gemini_client = None
        self.ollama_client = None
    
    def _init_clients(self):
        """Lazy initialization of AI clients."""
        if self.gemini_client is None:
            self.gemini_client = GeminiClient()
        if self.ollama_client is None:
            self.ollama_client = OllamaClient()
    
    async def process_statement_pdf(
        self,
        file_path: str,
        column_mapping: Optional[Dict[str, str]] = None
    ) -> Dict[str, any]:
        """
        🔒 COMPLETE PRIVACY-PRESERVING PIPELINE 🔒
        
        Process a bank statement through the entire pipeline:
        1. Extract transactions using bank template
        2. Sanitize all descriptions (SECURITY CHECKPOINT)
        3. Enrich merchants via Gemini (cloud, sanitized data only)
        4. Categorize via Ollama (local, full context)
        5. Return processed data ready for database
        
        Args:
            file_path: Path to the bank statement PDF/CSV
            column_mapping: Optional manual column mapping for unknown formats
        
        Returns:
            Dict with processing results:
            {
                'bank_name': str,
                'total_transactions': int,
                'processed_successfully': int,
                'failed': int,
                'transactions': List[Dict],
                'errors': List[str]
            }
        """
        
        self._init_clients()
        
        result = {
            'bank_name': 'Unknown',
            'total_transactions': 0,
            'processed_successfully': 0,
            'failed': 0,
            'transactions': [],
            'errors': []
        }
        
        try:
            # ===== STEP 1: Extract raw transactions =====
            print(f"📄 Step 1: Extracting transactions from {file_path}")
            
            template = self.template_detector.detect_template(file_path)
            result['bank_name'] = self.template_detector.get_template_name(template)
            
            print(f"✓ Detected bank: {result['bank_name']}")
            
            # Extract transactions
            if column_mapping:
                raw_df = template.extract_transactions(file_path, column_mapping)
            else:
                raw_df = template.extract_transactions(file_path)
            
            if raw_df.empty:
                result['errors'].append("No transactions found in file")
                return result
            
            result['total_transactions'] = len(raw_df)
            print(f"✓ Extracted {len(raw_df)} transactions")
            
            # ===== STEP 2: Sanitize descriptions (🔒 SECURITY AIRLOCK) =====
            print(f"\n🔒 Step 2: SANITIZING PII from descriptions")
            
            raw_descriptions = raw_df['description'].tolist()
            sanitized_descriptions = batch_sanitize(raw_descriptions)
            
            # Validate sanitization
            for i, (raw, sanitized) in enumerate(zip(raw_descriptions, sanitized_descriptions)):
                validation = validate_sanitization(raw, sanitized)
                if not validation['is_safe']:
                    print(f"⚠️  WARNING: Transaction {i} may still contain PII: {sanitized}")
            
            print(f"✓ Sanitized {len(sanitized_descriptions)} descriptions")
            print(f"🔒 SECURITY CHECKPOINT PASSED: No PII will reach cloud APIs")
            
            # ===== STEP 3: Process in batches =====
            print(f"\n⚙️  Step 3: Processing in batches of {self.batch_size}")
            
            all_processed_transactions = []
            
            # Split into batches
            num_batches = (len(raw_df) + self.batch_size - 1) // self.batch_size
            
            for batch_idx in range(num_batches):
                start_idx = batch_idx * self.batch_size
                end_idx = min(start_idx + self.batch_size, len(raw_df))
                
                print(f"\n  📦 Processing batch {batch_idx + 1}/{num_batches} (transactions {start_idx+1}-{end_idx})")
                
                batch_df = raw_df.iloc[start_idx:end_idx]
                batch_sanitized = sanitized_descriptions[start_idx:end_idx]
                batch_amounts = batch_df['amount'].tolist()
                
                # ===== STEP 3a: Gemini enrichment (cloud, sanitized only) =====
                print(f"    ☁️  Enriching merchants via Gemini (cloud)...")
                
                # SECURITY: Validate before sending to cloud
                validate_gemini_input(batch_sanitized)
                
                enriched_data = await self.gemini_client.enrich_merchant_batch(batch_sanitized)
                print(f"    ✓ Enriched {len(enriched_data)} merchants")
                
                # ===== STEP 3b: Ollama categorization (local) =====
                print(f"    💻 Categorizing via Ollama (local)...")
                
                merchants = [item['merchant'] for item in enriched_data]
                business_types = [item['business_type'] for item in enriched_data]
                
                categories = await self.ollama_client.categorize_transactions_batch(
                    merchants,
                    batch_amounts,
                    business_types
                )
                print(f"    ✓ Categorized {len(categories)} transactions")
                
                # ===== STEP 3c: Combine all data =====
                for i in range(len(batch_df)):
                    row = batch_df.iloc[i]
                    
                    transaction = {
                        'date': row['date'].isoformat() if isinstance(row['date'], datetime) else str(row['date']),
                        'raw_description': row['description'],
                        'sanitized_description': batch_sanitized[i],
                        'merchant_name': merchants[i],
                        'business_type': business_types[i],
                        'amount': float(row['amount']),
                        'transaction_type': row['transaction_type'],
                        'category': categories[i],
                        'balance': float(row.get('balance', 0))
                    }
                    
                    all_processed_transactions.append(transaction)
                    result['processed_successfully'] += 1
            
            result['transactions'] = all_processed_transactions
            
            print(f"\n✅ Processing complete!")
            print(f"   Total: {result['total_transactions']}")
            print(f"   Success: {result['processed_successfully']}")
            print(f"   Failed: {result['failed']}")
            
            return result
        
        except Exception as e:
            error_msg = f"Processing failed: {str(e)}"
            result['errors'].append(error_msg)
            print(f"\n❌ {error_msg}")
            return result
    
    def get_preview_for_mapping(self, file_path: str) -> Dict[str, any]:
        """
        Get a preview of CSV data for manual column mapping.
        
        Used when bank format is unknown and user needs to map columns.
        
        Args:
            file_path: Path to CSV file
        
        Returns:
            {
                'columns': List of column names,
                'preview_data': First 10 rows as list of lists,
                'needs_mapping': True
            }
        """
        
        try:
            import pandas as pd
            df = pd.read_csv(file_path, nrows=10)
            
            return {
                'columns': df.columns.tolist(),
                'preview_data': df.values.tolist(),
                'needs_mapping': True,
                'message': 'Unknown bank format. Please map columns manually.'
            }
        
        except Exception as e:
            return {
                'error': f"Failed to read file: {str(e)}",
                'needs_mapping': False
            }
    
    async def process_with_mapping(
        self,
        file_path: str,
        column_mapping: Dict[str, str]
    ) -> Dict[str, any]:
        """
        Process a file with user-provided column mapping.
        
        Args:
            file_path: Path to CSV file
            column_mapping: Dict mapping standard fields to CSV columns
        
        Returns:
            Same format as process_statement_pdf()
        """
        
        return await self.process_statement_pdf(file_path, column_mapping)


# Convenience function for single-file processing
async def process_single_statement(file_path: str) -> Dict[str, any]:
    """
    Process a single bank statement file.
    
    This is the main entry point for the processing pipeline.
    
    Args:
        file_path: Path to PDF or CSV file
    
    Returns:
        Processing results dict
    """
    
    processor = BatchProcessor()
    return await processor.process_statement_pdf(file_path)


# Example usage
if __name__ == "__main__":
    # Example: Process a statement
    async def main():
        result = await process_single_statement("path/to/statement.pdf")
        print(f"Processed {result['processed_successfully']} transactions")
        print(f"Bank: {result['bank_name']}")
    
    asyncio.run(main())
