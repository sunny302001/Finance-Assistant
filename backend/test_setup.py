"""
Test script to verify backend setup and functionality.

Run this after installing dependencies to ensure everything works.
"""

import asyncio
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.abspath('.'))

def test_imports():
    """Test that all modules can be imported."""
    print("🧪 Testing imports...")
    
    try:
        from core import sanitizer
        from core import bank_templates
        from core import ai_clients
        from core import batch_processor
        from core import financial_calc
        from models import database, transaction, category, budget_goal
        print("✅ All core modules imported successfully\n")
        return True
    except Exception as e:
        print(f"❌ Import failed: {e}\n")
        return False


def test_sanitizer():
    """Test the PII sanitizer."""
    print("🧪 Testing PII Sanitizer...")
    
    from core.sanitizer import sanitize_transaction_string
    
    test_cases = [
        {
            'input': 'ACH W/D 04-12-25 PAYPAL * NETFLIX COM 800-555-0199 CA',
            'expected_contains': 'NETFLIX'
        },
        {
            'input': 'NEFT-N123456789-AMAZON PAY INDIA REF 987654',
            'expected_contains': 'AMAZON'
        },
        {
            'input': 'UPI/SWIGGY/9876543210/PAYMENT',
            'expected_contains': 'SWIGGY'
        }
    ]
    
    all_passed = True
    for i, test in enumerate(test_cases, 1):
        result = sanitize_transaction_string(test['input'])
        passed = test['expected_contains'] in result
        
        status = "✅" if passed else "❌"
        print(f"  {status} Test {i}: '{test['input'][:50]}...'")
        print(f"     → Sanitized: '{result}'")
        
        if not passed:
            all_passed = False
    
    print()
    return all_passed


def test_database():
    """Test database initialization."""
    print("🧪 Testing Database Setup...")
    
    try:
        from models.database import init_db, SessionLocal
        from models.category import init_default_categories
        
        # Initialize database
        init_db()
        
        # Initialize categories
        db = SessionLocal()
        try:
            init_default_categories(db)
        finally:
            db.close()
        
        print("✅ Database initialized successfully\n")
        return True
    except Exception as e:
        print(f"❌ Database test failed: {e}\n")
        return False


async def test_ai_clients():
    """Test AI client configuration."""
    print("🧪 Testing AI Clients...")
    
    # Test Gemini client
    try:
        from core.ai_clients import GeminiClient
        
        gemini = GeminiClient()
        print("  ✅ Gemini client initialized")
    except ValueError as e:
        print(f"  ⚠️  Gemini API key not configured: {e}")
    except Exception as e:
        print(f"  ❌ Gemini client error: {e}")
    
    # Test Ollama client
    try:
        from core.ai_clients import OllamaClient
        
        ollama = OllamaClient()
        print(f"  ✅ Ollama client initialized (host: {ollama.host})")
        print(f"     Model: {ollama.model}")
    except Exception as e:
        print(f"  ❌ Ollama client error: {e}")
    
    print()


def test_financial_calculations():
    """Test financial calculation functions."""
    print("🧪 Testing Financial Calculations...")
    
    from core.financial_calc import (
        calculate_savings_rate,
        split_goal_amount,
        calculate_category_totals
    )
    
    # Test savings rate
    rate = calculate_savings_rate(100000, 80000)
    expected = 20.0
    
    if rate == expected:
        print(f"  ✅ Savings rate calculation: {rate}%")
    else:
        print(f"  ❌ Savings rate wrong: expected {expected}, got {rate}")
    
    # Test goal splitter
    goals = [
        {'id': 'emergency', 'priority': 2},
        {'id': 'vacation', 'priority': 1}
    ]
    allocations = split_goal_amount(9000, goals)
    
    print(f"  ✅ Goal splitter: {allocations}")
    
    print()


async def run_all_tests():
    """Run all tests."""
    print("\n" + "="*60)
    print("           FinanceFlow Backend Test Suite")
    print("="*60 + "\n")
    
    results = []
    
    # Run tests
    results.append(("Imports", test_imports()))
    results.append(("Sanitizer", test_sanitizer()))
    results.append(("Database", test_database()))
    await test_ai_clients()
    test_financial_calculations()
    
    # Summary
    print("="*60)
    print("                   Test Summary")
    print("="*60)
    
    for name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{name:.<30} {status}")
    
    print("\n💡 Next Steps:")
    print("1. If Gemini API key is not configured, add it to backend/.env")
    print("2. Make sure Ollama is running: ollama serve")
    print("3. Start the backend: python -m uvicorn api.main:app --reload")
    print("4. Visit http://localhost:8000/docs for API documentation\n")


if __name__ == "__main__":
    asyncio.run(run_all_tests())
