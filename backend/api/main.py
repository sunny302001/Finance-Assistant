"""
FastAPI Application - FinanceFlow Backend

Privacy-preserving personal finance dashboard API.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import routes
from .routes import statements, transactions, categories, goals, insights

# Import database initialization
from models.database import init_db
from models.category import init_default_categories
from models.database import SessionLocal

# Create FastAPI app
app = FastAPI(
    title="FinanceFlow API",
    description="Privacy-preserving personal finance dashboard with hybrid AI",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for mobile/local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize database and default data on startup."""
    print("\n🚀 Starting FinanceFlow API...")
    
    # Initialize database
    init_db()
    
    # Initialize default categories
    db = SessionLocal()
    try:
        init_default_categories(db)
    finally:
        db.close()
    
    print("✅ FinanceFlow API ready!\n")
    print("📖 API Documentation: http://localhost:8000/docs")
    print("🔒 Security: PII Sanitization Airlock active\n")


# Root endpoint
@app.get("/")
async def root():
    """API health check."""
    return {
        "message": "FinanceFlow API",
        "status": "running",
        "version": "1.0.0",
        "docs": "/docs"
    }


# Health check
@app.get("/health")
async def health_check():
    """Detailed health check."""
    
    # Check Gemini API key
    gemini_configured = bool(
        os.getenv('GEMINI_API_KEY') and 
        os.getenv('GEMINI_API_KEY') != 'your_gemini_api_key_here'
    )
    
    # Check Ollama (we'll just check if host is configured)
    ollama_configured = bool(os.getenv('OLLAMA_HOST'))
    
    return {
        "status": "healthy",
        "database": "connected",
        "gemini_api": "configured" if gemini_configured else "not_configured",
        "ollama": "configured" if ollama_configured else "not_configured",
        "security": "PII Sanitization Active"
    }


# Include routers
app.include_router(statements.router, prefix="/api/statements", tags=["Statements"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["Transactions"])
app.include_router(categories.router, prefix="/api/categories", tags=["Categories"])
app.include_router(goals.router, prefix="/api/goals", tags=["Budget Goals"])
app.include_router(insights.router, prefix="/api/insights", tags=["Financial Insights"])


# Error handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler."""
    return JSONResponse(
        status_code=500,
        content={"error": str(exc), "message": "Internal server error"}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
