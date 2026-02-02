"""
AI Client Integration Layer

Provides clients for:
1. Ollama (Local) - Merchant enrichment AND transaction categorization (CURRENTLY ACTIVE)
2. Google Gemini (Cloud) - COMMENTED OUT - Enable when you have an API key

🔒 SECURITY CRITICAL:
- Currently 100% local processing via Ollama
- Gemini code preserved but commented out for future use
- To enable Gemini: Uncomment GeminiClient class and update batch_processor.py
"""

import os
import json
from typing import List, Dict, Optional
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


# ============================================================================
# GEMINI CLIENT (COMMENTED OUT - ENABLE WHEN YOU HAVE API KEY)
# ============================================================================
# Uncomment this entire section when you want to use Gemini for merchant enrichment
# Don't forget to also update batch_processor.py to use GeminiClient instead of OllamaClient

# class GeminiClient:
#     """
#     Google Gemini API client for merchant name enrichment.
#     
#     🔒 SECURITY POLICY:
#     - ONLY sanitized transaction descriptions allowed
#     - NO raw transaction data
#     - NO amounts, dates, or account information
#     """
#     
#     def __init__(self, api_key: Optional[str] = None):
#         self.api_key = api_key or os.getenv('GEMINI_API_KEY')
#         
#         if not self.api_key or self.api_key == 'your_gemini_api_key_here':
#             raise ValueError(
#                 "Gemini API key not configured. "
#                 "Please set GEMINI_API_KEY in your .env file. "
#                 "Get your free API key from: https://makersuite.google.com/app/apikey"
#             )
#         
#         self.base_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
#     
#     async def enrich_merchant_batch(self, sanitized_descriptions: List[str]) -> List[Dict[str, str]]:
#         """
#         🔒 SECURITY CHECKPOINT: Only sanitized strings allowed! 🔒
#         
#         Extract clean merchant names and business types from sanitized descriptions.
#         
#         Args:
#             sanitized_descriptions: List of PII-free transaction descriptions
#                 Example: ["PAYPAL NETFLIX COM", "AMAZON PAY INDIA", "SWIGGY"]
#         
#         Returns:
#             List of dicts with merchant info:
#             [
#                 {"merchant": "Netflix", "business_type": "Streaming Service"},
#                 {"merchant": "Amazon", "business_type": "E-commerce"},
#                 {"merchant": "Swiggy", "business_type": "Food Delivery"}
#             ]
#         """
#         
#         # Validation: Ensure strings appear sanitized
#         for desc in sanitized_descriptions:
#             if self._looks_unsafe(desc):
#                 raise ValueError(
#                     f"🚨 SECURITY ALERT: Potentially unsafe data detected: {desc[:50]}... "
#                     f"All descriptions MUST be sanitized before calling this function!"
#                 )
#         
#         prompt = self._build_enrichment_prompt(sanitized_descriptions)
#         
#         try:
#             response = requests.post(
#                 f"{self.base_url}?key={self.api_key}",
#                 json={
#                     "contents": [{
#                         "parts": [{"text": prompt}]
#                     }],
#                     "generationConfig": {
#                         "temperature": 0.1,  # Low temperature for consistency
#                         "maxOutputTokens": 2048
#                     }
#                 },
#                 headers={"Content-Type": "application/json"},
#                 timeout=30
#             )
#             
#             response.raise_for_status()
#             result = response.json()
#             
#             # Extract generated text
#             generated_text = result['candidates'][0]['content']['parts'][0]['text']
#             
#             # Parse JSON response
#             return self._parse_enrichment_response(generated_text, len(sanitized_descriptions))
#         
#         except Exception as e:
#             print(f"Gemini API error: {e}")
#             # Return fallback data
#             return [{"merchant": desc[:30], "business_type": "Unknown"} for desc in sanitized_descriptions]
#     
#     def _looks_unsafe(self, text: str) -> bool:
#         """Check if text contains patterns that suggest it wasn't sanitized."""
#         import re
#         
#         unsafe_patterns = [
#             r'\d{1,2}[-/]\d{1,2}[-/]\d{2,4}',  # Dates
#             r'\d{3}[-\.\s]?\d{3}[-\.\s]?\d{4}',  # Phone numbers
#             r'\b(ACCT|A/C|XXXX)\s*\*?\d+',  # Account numbers
#             r'\b(REF|TXN|IMPS|NEFT)[:\s]*[A-Z0-9]+',  # Transaction IDs
#         ]
#         
#         for pattern in unsafe_patterns:
#             if re.search(pattern, text):
#                 return True
#         
#         return False
#     
#     def _build_enrichment_prompt(self, sanitized_descriptions: List[str]) -> str:
#         """Build prompt for merchant enrichment."""
#         
#         descriptions_list = "\n".join([f"{i+1}. {desc}" for i, desc in enumerate(sanitized_descriptions)])
#         
#         return f"""You are a financial transaction analyzer. For each transaction description below, identify:
# 1. The clean, official merchant/company name
# 2. The business type/category
# 
# Transaction descriptions (sanitized):
# {descriptions_list}
# 
# Return ONLY a JSON array with exactly {len(sanitized_descriptions)} objects, one for each description in order.
# Each object should have exactly these fields:
# - "merchant": The clean merchant name (e.g., "Netflix", "Amazon", "Swiggy")
# - "business_type": The type of business (e.g., "Streaming Service", "E-commerce", "Food Delivery")
# 
# Example output format:
# [
#   {{"merchant": "Netflix", "business_type": "Streaming Service"}},
#   {{"merchant": "Amazon", "business_type": "E-commerce"}}
# ]
# 
# Return ONLY the JSON array, no additional text."""
#     
#     def _parse_enrichment_response(self, response_text: str, expected_count: int) -> List[Dict[str, str]]:
#         """Parse Gemini's JSON response."""
#         try:
#             # Extract JSON from response (handle markdown code blocks)
#             json_text = response_text.strip()
#             
#             if '```json' in json_text:
#                 json_text = json_text.split('```json')[1].split('```')[0].strip()
#             elif '```' in json_text:
#                 json_text = json_text.split('```')[1].split('```')[0].strip()
#             
#             data = json.loads(json_text)
#             
#             # Ensure we have the right number of results
#             if len(data) != expected_count:
#                 # Pad with unknowns
#                 while len(data) < expected_count:
#                     data.append({"merchant": "Unknown", "business_type": "Unknown"})
#             
#             return data[:expected_count]
#         
#         except Exception as e:
#             print(f"Failed to parse Gemini response: {e}")
#             return [{"merchant": "Unknown", "business_type": "Unknown"} for _ in range(expected_count)]

# ============================================================================
# END OF COMMENTED GEMINI CODE
# ============================================================================



class OllamaClient:
    """
    Ollama (Local AI) client for transaction categorization.
    
    Runs completely locally - safe to send full transaction context including amounts.
    """
    
    def __init__(self, host: Optional[str] = None, model: Optional[str] = None):
        self.host = host or os.getenv('OLLAMA_HOST', 'http://localhost:11434')
        self.model = model or os.getenv('OLLAMA_MODEL', 'llama3')
    
    async def enrich_merchant_batch(self, sanitized_descriptions: List[str]) -> List[Dict[str, str]]:
        """
        💻 LOCAL MERCHANT ENRICHMENT (using Ollama)
        
        Extract clean merchant names and business types from sanitized descriptions.
        Runs completely locally - no data sent to cloud.
        
        Args:
            sanitized_descriptions: List of PII-free transaction descriptions
                Example: ["PAYPAL NETFLIX COM", "AMAZON PAY INDIA", "SWIGGY"]
        
        Returns:
            List of dicts with merchant info:
            [
                {"merchant": "Netflix", "business_type": "Streaming Service"},
                {"merchant": "Amazon", "business_type": "E-commerce"},
                {"merchant": "Swiggy", "business_type": "Food Delivery"}
            ]
        """
        
        prompt = self._build_merchant_prompt(sanitized_descriptions)
        
        try:
            response = requests.post(
                f"{self.host}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.1
                    }
                },
                timeout=90  # Longer timeout for merchant identification
            )
            
            response.raise_for_status()
            result = response.json()
            
            # Parse response
            merchants = self._parse_merchant_response(result['response'], len(sanitized_descriptions))
            
            return merchants
        
        except Exception as e:
            print(f"Ollama merchant enrichment error: {e}")
            print(f"Make sure Ollama is running: {self.host}")
            
            # Fallback: Use sanitized string as merchant name
            return [
                {
                    "merchant": desc[:30].title(),
                    "business_type": "Unknown"
                }
                for desc in sanitized_descriptions
            ]
    
    def _build_merchant_prompt(self, sanitized_descriptions: List[str]) -> str:
        """Build prompt for merchant identification."""
        
        descriptions_list = "\n".join([f"{i+1}. {desc}" for i, desc in enumerate(sanitized_descriptions)])
        
        return f"""You are a financial transaction analyzer. For each transaction description below, identify:
1. The clean, official merchant/company name
2. The business type/category

Transaction descriptions (already sanitized/cleaned):
{descriptions_list}

Return ONLY a JSON array with exactly {len(sanitized_descriptions)} objects, one for each description in order.
Each object should have exactly these fields:
- "merchant": The clean merchant name (e.g., "Netflix", "Amazon", "Swiggy")
- "business_type": The type of business (e.g., "Streaming Service", "E-commerce", "Food Delivery")

Example output format:
[
  {{"merchant": "Netflix", "business_type": "Streaming Service"}},
  {{"merchant": "Amazon", "business_type": "E-commerce"}}
]

Return ONLY the JSON array, no explanations or additional text."""
    
    def _parse_merchant_response(self, response_text: str, expected_count: int) -> List[Dict[str, str]]:
        """Parse Ollama's merchant identification response."""
        try:
            # Extract JSON from response
            json_text = response_text.strip()
            
            if '```json' in json_text:
                json_text = json_text.split('```json')[1].split('```')[0].strip()
            elif '```' in json_text:
                json_text = json_text.split('```')[1].split('```')[0].strip()
            
            # Find JSON array
            start = json_text.find('[')
            end = json_text.rfind(']')
            
            if start != -1 and end != -1:
                json_text = json_text[start:end+1]
            
            data = json.loads(json_text)
            
            # Ensure we have the right number of results
            while len(data) < expected_count:
                data.append({"merchant": "Unknown", "business_type": "Unknown"})
            
            return data[:expected_count]
        
        except Exception as e:
            print(f"Failed to parse Ollama merchant response: {e}")
            return [{"merchant": "Unknown", "business_type": "Unknown"} for _ in range(expected_count)]
    
    async def categorize_transactions_batch(
        self,
        merchants: List[str],
        amounts: List[float],
        business_types: List[str]
    ) -> List[str]:
        """
        Categorize transactions using the 50/30/20 rule locally.
        
        Categories:
        - Needs: Essential expenses (housing, utilities, groceries, insurance, healthcare)
        - Wants: Non-essential expenses (entertainment, dining out, subscriptions, shopping)
        - Savings: Transfers to savings, investments
        - Debt: Loan payments, credit card payments
        
        Args:
            merchants: List of merchant names
            amounts: List of transaction amounts (negative for debits)
            business_types: List of business types from Gemini
        
        Returns:
            List of category strings (same order as input)
        """
        
        prompt = self._build_categorization_prompt(merchants, amounts, business_types)
        
        try:
            response = requests.post(
                f"{self.host}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.1
                    }
                },
                timeout=60
            )
            
            response.raise_for_status()
            result = response.json()
            
            # Parse response
            categories = self._parse_categorization_response(result['response'], len(merchants))
            
            return categories
        
        except Exception as e:
            print(f"Ollama API error: {e}")
            print(f"Make sure Ollama is running: {self.host}")
            print(f"Install Ollama from: https://ollama.ai")
            
            # Fallback: Basic rule-based categorization
            return self._fallback_categorization(merchants, business_types)
    
    def _build_categorization_prompt(
        self,
        merchants: List[str],
        amounts: List[float],
        business_types: List[str]
    ) -> str:
        """Build prompt for categorization."""
        
        transactions_text = "\n".join([
            f"{i+1}. Merchant: {merchants[i]}, Amount: ₹{abs(amounts[i]):.2f}, Type: {business_types[i]}"
            for i in range(len(merchants))
        ])
        
        return f"""Categorize each transaction into ONE of these categories based on the 50/30/20 budgeting rule:

Categories:
- Needs: Essential expenses like housing/rent, utilities (electricity, water, internet), groceries, insurance, healthcare, transportation (fuel, public transport)
- Wants: Non-essential expenses like entertainment (Netflix, movies), dining out, food delivery, shopping, hobbies, subscriptions
- Savings: Transfers to savings accounts, investments, mutual funds
- Debt: Loan payments (EMI), credit card payments

Transactions:
{transactions_text}

Return ONLY a JSON array with exactly {len(merchants)} category names in the same order, like:
["Needs", "Wants", "Wants", "Needs"]

Return ONLY the JSON array, no explanations."""
    
    def _parse_categorization_response(self, response_text: str, expected_count: int) -> List[str]:
        """Parse Ollama's categorization response."""
        try:
            # Extract JSON from response
            json_text = response_text.strip()
            
            if '```json' in json_text:
                json_text = json_text.split('```json')[1].split('```')[0].strip()
            elif '```' in json_text:
                json_text = json_text.split('```')[1].split('```')[0].strip()
            
            # Find JSON array
            start = json_text.find('[')
            end = json_text.rfind(']')
            
            if start != -1 and end != -1:
                json_text = json_text[start:end+1]
            
            categories = json.loads(json_text)
            
            # Validate categories
            valid_categories = ['Needs', 'Wants', 'Savings', 'Debt']
            categories = [cat if cat in valid_categories else 'Wants' for cat in categories]
            
            # Ensure correct length
            while len(categories) < expected_count:
                categories.append('Wants')
            
            return categories[:expected_count]
        
        except Exception as e:
            print(f"Failed to parse Ollama response: {e}")
            return self._fallback_categorization([], [])
    
    def _fallback_categorization(self, merchants: List[str], business_types: List[str]) -> List[str]:
        """Basic rule-based fallback categorization."""
        
        categories = []
        
        for i in range(len(merchants) if merchants else len(business_types)):
            merchant = merchants[i].lower() if i < len(merchants) else ""
            biz_type = business_types[i].lower() if i < len(business_types) else ""
            
            # Simple keyword matching
            if any(word in merchant or word in biz_type for word in ['grocery', 'food', 'utility', 'insurance', 'fuel', 'medical', 'rent']):
                categories.append('Needs')
            elif any(word in merchant or word in biz_type for word in ['saving', 'investment', 'mutual fund', 'deposit']):
                categories.append('Savings')
            elif any(word in merchant or word in biz_type for word in ['loan', 'emi', 'credit card', 'debt']):
                categories.append('Debt')
            else:
                categories.append('Wants')
        
        return categories
    
    async def get_financial_advice(
        self,
        category_totals: Dict[str, float],
        total_income: float,
        savings_rate: float
    ) -> str:
        """
        Generate financial advice based on spending patterns.
        
        🔒 NOTE: Python does ALL calculations. LLM only provides commentary.
        
        Args:
            category_totals: Dict like {"Needs": 15000, "Wants": 8000, "Savings": 2000}
            total_income: Total income for the period
            savings_rate: Calculated savings rate percentage
        
        Returns:
            Human-readable financial advice
        """
        
        # Calculate actual percentages
        total_spent = sum(category_totals.values())
        percentages = {
            cat: (amount / total_income * 100) if total_income > 0 else 0
            for cat, amount in category_totals.items()
        }
        
        prompt = f"""You are a personal finance advisor. Analyze this spending pattern and provide advice:

Monthly Income: ₹{total_income:,.2f}
Total Spent: ₹{total_spent:,.2f}
Savings Rate: {savings_rate:.1f}%

Spending Breakdown:
- Needs: ₹{category_totals.get('Needs', 0):,.2f} ({percentages.get('Needs', 0):.1f}% of income)
- Wants: ₹{category_totals.get('Wants', 0):,.2f} ({percentages.get('Wants', 0):.1f}% of income)
- Savings: ₹{category_totals.get('Savings', 0):,.2f} ({percentages.get('Savings', 0):.1f}% of income)
- Debt: ₹{category_totals.get('Debt', 0):,.2f} ({percentages.get('Debt', 0):.1f}% of income)

The 50/30/20 rule recommends:
- 50% on Needs
- 30% on Wants
- 20% on Savings

Provide 2-3 sentences of actionable advice comparing their spending to the 50/30/20 rule."""
        
        try:
            response = requests.post(
                f"{self.host}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False
                },
                timeout=30
            )
            
            response.raise_for_status()
            result = response.json()
            
            return result['response'].strip()
        
        except Exception as e:
            print(f"Ollama error generating advice: {e}")
            return "Unable to generate financial advice. Please ensure Ollama is running."


# 🔒 SECURITY VALIDATION FUNCTIONS 🔒

def validate_gemini_input(descriptions: List[str]) -> bool:
    """
    Validate that data being sent to Gemini is properly sanitized.
    
    Raises ValueError if unsafe data detected.
    """
    client = GeminiClient()
    
    for desc in descriptions:
        if client._looks_unsafe(desc):
            raise ValueError(
                f"🚨 SECURITY VIOLATION: Unsafe data detected before Gemini API call: {desc[:50]}"
            )
    
    return True
