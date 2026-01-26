"""
Statement Upload and Processing Routes

Handles PDF/CSV upload and transaction processing.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional
import os
import shutil
from datetime import datetime
import json

from models.database import get_db
from models import transaction as transaction_model
from core.batch_processor import BatchProcessor

router = APIRouter()

# Create upload directory
UPLOAD_DIR = "data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
async def upload_statement(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload and process a bank statement (PDF or CSV).
    
    🔒 SECURITY: This endpoint triggers the complete privacy-preserving pipeline:
    1. Extract transactions
    2. Sanitize PII
    3. Enrich via Gemini (cloud, sanitized only)
    4. Categorize via Ollama (local)
    5. Save to database
    
    Returns:
        {
            'status': 'success',
            'bank_name': 'SBI',
            'total_transactions': 45,
            'processed_successfully': 43,
            'failed': 2,
            'file_id': 'abc123'
        }
    """
    
    # Validate file type
    if not file.filename.endswith(('.pdf', '.csv')):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only PDF and CSV files are supported."
        )
    
    # Save uploaded file
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    safe_filename = f"{timestamp}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        print(f"📁 Saved file: {file_path}")
        
        # Process the statement
        processor = BatchProcessor()
        result = await processor.process_statement_pdf(file_path)
        
        # Check if processing failed
        if result['processed_successfully'] == 0:
            # Check if file needs manual mapping
            if file.filename.endswith('.csv'):
                preview = processor.get_preview_for_mapping(file_path)
                
                if preview.get('needs_mapping'):
                    return JSONResponse(content={
                        'status': 'needs_mapping',
                        'file_id': safe_filename,
                        'columns': preview['columns'],
                        'preview_data': preview['preview_data'],
                        'message': 'Unknown CSV format. Please provide column mapping.'
                    })
            
            raise HTTPException(
                status_code=400,
                detail=f"Failed to process file: {', '.join(result.get('errors', ['Unknown error']))}"
            )
        
        # Save transactions to database
        transactions_data = []
        for txn in result['transactions']:
            transactions_data.append({
                'date': datetime.fromisoformat(txn['date']),
                'raw_description': txn['raw_description'],
                'sanitized_description': txn['sanitized_description'],
                'merchant_name': txn['merchant_name'],
                'business_type': txn['business_type'],
                'category': txn['category'],
                'amount': txn['amount'],
                'transaction_type': txn['transaction_type'],
                'balance': txn['balance'],
                'source_file': safe_filename,
                'bank_name': result['bank_name']
            })
        
        saved_count = transaction_model.bulk_create_transactions(db, transactions_data)
        
        print(f"✅ Saved {saved_count} transactions to database")
        
        return {
            'status': 'success',
            'bank_name': result['bank_name'],
            'total_transactions': result['total_transactions'],
            'processed_successfully': result['processed_successfully'],
            'failed': result['failed'],
            'file_id': safe_filename,
            'saved_to_db': saved_count
        }
    
    except Exception as e:
        # Clean up file on error
        if os.path.exists(file_path):
            os.remove(file_path)
        
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


@router.post("/upload-with-mapping")
async def upload_with_mapping(
    file_id: str = Form(...),
    column_mapping: str = Form(...),  # JSON string
    db: Session = Depends(get_db)
):
    """
    Process a previously uploaded CSV file with manual column mapping.
    
    Args:
        file_id: The file ID from the initial upload
        column_mapping: JSON string mapping standard fields to CSV columns
            Example: {"date": "Transaction Date", "description": "Particulars", ...}
    """
    
    file_path = os.path.join(UPLOAD_DIR, file_id)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        # Parse column mapping
        mapping = json.loads(column_mapping)
        
        # Process with mapping
        processor = BatchProcessor()
        result = await processor.process_with_mapping(file_path, mapping)
        
        if result['processed_successfully'] == 0:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to process file: {', '.join(result.get('errors', ['Unknown error']))}"
            )
        
        # Save to database
        transactions_data = []
        for txn in result['transactions']:
            transactions_data.append({
                'date': datetime.fromisoformat(txn['date']),
                'raw_description': txn['raw_description'],
                'sanitized_description': txn['sanitized_description'],
                'merchant_name': txn['merchant_name'],
                'business_type': txn['business_type'],
                'category': txn['category'],
                'amount': txn['amount'],
                'transaction_type': txn['transaction_type'],
                'balance': txn['balance'],
                'source_file': file_id,
                'bank_name': result['bank_name']
            })
        
        saved_count = transaction_model.bulk_create_transactions(db, transactions_data)
        
        return {
            'status': 'success',
            'bank_name': result['bank_name'],
            'total_transactions': result['total_transactions'],
            'processed_successfully': result['processed_successfully'],
            'saved_to_db': saved_count
        }
    
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid column mapping JSON")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


@router.get("/preview/{file_id}")
async def get_file_preview(file_id: str):
    """
    Get a preview of a CSV file for manual column mapping.
    """
    
    file_path = os.path.join(UPLOAD_DIR, file_id)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    processor = BatchProcessor()
    preview = processor.get_preview_for_mapping(file_path)
    
    return preview
