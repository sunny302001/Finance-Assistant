# FinanceFlow - Setup & Configuration Guide

Welcome to **FinanceFlow**, your privacy-preserving personal finance dashboard! 🔒💰

This guide will help you get started with the application.

---

## Prerequisites

Before running FinanceFlow, ensure you have:

### Required Software
- **Python 3.9+** - [Download Python](https://www.python.org/downloads/)
- **Node.js 18+** - [Download Node.js](https://nodejs.org/)
- **Ollama** - [Download Ollama](https://ollama.ai/) (for local AI)

### API Keys
- **Google Gemini API Key** (Free tier available)
  - Get yours at: https://makersuite.google.com/app/apikey
  - Used only for merchant name enrichment on **sanitized data**

---

## 🚀 Quick Start Guide

### Step 1: Install Ollama (Local AI)

FinanceFlow uses Ollama to run AI locally for transaction categorization. This ensures your financial data **never leaves your computer**.

1. Download Ollama from: https://ollama.ai/
2. Install it on your system
3. Open a terminal and run:
   ```bash
   ollama pull llama3
   ```
4. Verify it's running:
   ```bash
   ollama list
   ```

You should see `llama3` in the list.

---

### Step 2: Backend Setup

1. **Navigate to the backend folder:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment (recommended):**
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Mac/Linux
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   
   Copy the example environment file:
   ```bash
   copy .env.example .env
   ```
   
   Edit `.env` and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   OLLAMA_HOST=http://localhost:11434
   OLLAMA_MODEL=llama3
   DATABASE_URL=sqlite:///./data/finance.db
   FRONTEND_URL=http://localhost:5173
   ```

5. **Run the backend server:**
   ```bash
   # From the backend folder
   cd api
   python -m uvicorn main:app --reload
   ```
   
   Or from the root backend directory:
   ```bash
   python -m uvicorn api.main:app --reload
   ```

The API will start at **http://localhost:8000**

📖 **API Documentation:** http://localhost:8000/docs

---

### Step 3: Frontend Setup (Coming Soon)

The React frontend is currently being built. Once complete, you'll:

1. Navigate to `frontend/`
2. Run `npm install`
3. Run `npm run dev`
4. Access the dashboard at `http://localhost:5173`

---

## 🔒 Privacy & Security Features

FinanceFlow implements a **Sanitization Airlock** to protect your privacy:

### The Airlock Pipeline

```
1. PDF Upload
   ↓
2. Extract Raw Transactions
   ↓
3. 🔒 SANITIZE (Remove PII)
   ↓
4. ☁️ Gemini API (sanitized data only)
   ↓
5. 💻 Ollama (local, full context)
   ↓
6. Save to Local Database
```

### What Data Goes Where?

| Data Type | Stays Local | Goes to Gemini (Cloud) |
|-----------|-------------|------------------------|
| Account Numbers | ✅ | ❌ |
| Transaction IDs | ✅ | ❌ |
| Dates | ✅ | ❌ |
| Phone Numbers | ✅ | ❌ |
| Amounts | ✅ | ❌ |
| **Sanitized Merchant Names** | ✅ | ✅ (only this!) |
| Full Transaction Details | ✅ | ❌ |

**Example:**
- **Raw:** `NEFT-N123456789-AMAZON PAY INDIA REF 987654 04-12-2025`
- **Sent to Gemini:** `AMAZON PAY INDIA`
- **Categorization (Ollama):** Happens locally with full context

---

## 📁 Supported Bank Formats

FinanceFlow supports the following Indian banks out of the box:

### 1. State Bank of India (SBI)
- ✅ PDF statements
- Auto-detected format

### 2. ICICI Bank
- ✅ PDF statements
- ✅ CSV exports

### 3. HDFC Bank
- ✅ PDF statements

### Unknown Formats
If your bank isn't supported, you can:
1. Upload a CSV file
2. Manually map columns via the UI
3. FinanceFlow will remember the mapping for future uploads

---

## 🧪 Testing the Setup

### Test Backend Health

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "gemini_api": "configured",
  "ollama": "configured",
  "security": "PII Sanitization Active"
}
```

### Test Transaction Processing

Use the API documentation at `http://localhost:8000/docs`:

1. Navigate to **POST /api/statements/upload**
2. Upload a sample bank statement (PDF or CSV)
3. Watch the processing pipeline in action!

---

## 📊 Key Features

### ✅ Implemented (Backend)
- [x] PDF/CSV statement upload
- [x] Auto-detection of SBI, ICICI, HDFC formats
- [x] PII sanitization before cloud API calls
- [x] Merchant enrichment via Gemini
- [x] Transaction categorization via Ollama (local)
- [x] 50/30/20 budget analysis
- [x] Goal tracking and priority-based allocation
- [x] Monthly spending trends
- [x] Financial insights with LLM commentary

### 🚧 In Progress (Frontend)
- [ ] React dashboard with Recharts visualizations
- [ ] Drag-and-drop statement upload
- [ ] Transaction list with filters
- [ ] Budget goal manager
- [ ] Category breakdown charts
- [ ] Manual CSV column mapper

---

## 🛠️ Troubleshooting

### Ollama Connection Issues

**Error:** `Ollama API error: Connection refused`

**Solution:**
1. Ensure Ollama is running:
   ```bash
   ollama serve
   ```
2. Verify the model is downloaded:
   ```bash
   ollama pull llama3
   ```

### Gemini API Errors

**Error:** `Gemini API key not configured`

**Solution:**
1. Check your `.env` file has a valid key
2. Get a free API key from: https://makersuite.google.com/app/apikey
3. Restart the backend server after updating `.env`

### Database Issues

**Error:** `Table doesn't exist`

**Solution:**
The database auto-initializes on first run. If you encounter issues:
```bash
# Delete the database and restart
rm data/finance.db
# Restart the backend - tables will be recreated
```

---

## 📖 API Endpoints Overview

### Statements
- `POST /api/statements/upload` - Upload bank statement
- `POST /api/statements/upload-with-mapping` - Upload with manual column mapping
- `GET /api/statements/preview/{file_id}` - Preview CSV for mapping

### Transactions
- `GET /api/transactions/` - List transactions (with filters)
- `GET /api/transactions/{id}` - Get single transaction
- `DELETE /api/transactions/{id}` - Delete transaction
- `GET /api/transactions/summary/by-category` - Category totals

### Categories
- `GET /api/categories/` - List all categories
- `POST /api/categories/` - Create category
- `PATCH /api/categories/{id}` - Update category

### Budget Goals
- `GET /api/goals/` - List goals
- `POST /api/goals/` - Create goal
- `PATCH /api/goals/{id}` - Update goal
- `POST /api/goals/{id}/add-amount` - Add progress to goal
- `POST /api/goals/allocate` - Split amount across goals
- `DELETE /api/goals/{id}` - Delete goal

### Financial Insights
- `GET /api/insights/budget-analysis` - Full budget analysis + LLM advice
- `GET /api/insights/monthly-trend` - Spending trends over time
- `GET /api/insights/category-breakdown` - Category pie chart data
- `GET /api/insights/spending-overview` - Dashboard overview

---

##🎯 Next Steps

1. ✅ **Backend is ready!** Start the API server
2. 🚧 **Frontend coming next** - React dashboard with visualizations
3. 📊 **Test with real data** - Upload your bank statements
4. 🔒 **Monitor the logs** - Watch the sanitization process in action

---

## 🤝 Contributing

This is a privacy-first application. When contributing:
- Ensure NO PII reaches cloud APIs
- Always use the sanitizer before external calls
- Add tests for new bank templates
- Document security implications

---

## 📄 License

[Your License Here]

---

**Questions?** Check the API docs at `http://localhost:8000/docs` or review the code comments - every security checkpoint is clearly marked with 🔒 emoji!
