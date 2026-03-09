import requests
import os
import sys
import time

# Configuration
API_URL = "http://localhost:8000"
TEST_PDF = "test.pdf"

def print_result(step, success, message=""):
    status = "✅ PASSED" if success else "❌ FAILED"
    print(f"{step:.<40} {status}")
    if not success and message:
        print(f"   Error: {message}")

def run_e2e():
    print("\n" + "="*60)
    print("           FinanceFlow Stateless E2E Tester")
    print("="*60 + "\n")

    # Step 1: Health Check
    try:
        response = requests.get(f"{API_URL}/")
        health = response.status_code == 200
        print_result("1. API Health Check", health)
    except Exception as e:
        print_result("1. API Health Check", False, str(e))
        return

    # Step 2: Verify Default Categories
    try:
        response = requests.get(f"{API_URL}/api/categories/")
        has_categories = len(response.json()) > 0
        print_result("2. Default Categories Check", has_categories)
    except Exception as e:
        print_result("2. Default Categories Check", False, str(e))

    # Step 3: Test Upload Resilience (Invalid Date)
    try:
        response = requests.get(f"{API_URL}/api/transactions/?start_date=invalid-format")
        resilience = response.status_code == 400
        print_result("3. API Data Resilience (Bad Date)", resilience)
    except Exception as e:
        print_result("3. API Data Resilience (Bad Date)", False, str(e))

    # Step 4: Create a Goal
    goal_id = None
    try:
        response = requests.post(f"{API_URL}/api/goals/", json={
            "name": "E2E Test Goal",
            "target_amount": 5000,
            "icon": "🧪"
        })
        success = response.status_code == 200
        if success:
            goal_id = response.json().get("id")
        print_result("4. Create Goal", success)
    except Exception as e:
        print_result("4. Create Goal", False, str(e))

    # Step 5: Test Negative Goal Prevention
    try:
        response = requests.patch(f"{API_URL}/api/goals/{goal_id}", json={
            "target_amount": -100
        })
        prevented = response.status_code == 400
        print_result("5. Negative Value Prevention", prevented)
    except Exception as e:
        print_result("5. Negative Value Prevention", False, str(e))

    # Step 6: Summary Verification
    try:
        response = requests.get(f"{API_URL}/api/insights/spending-overview")
        success = response.status_code == 200
        print_result("6. Dashboard Data Retrieval", success)
    except Exception as e:
        print_result("6. Dashboard Data Retrieval", False, str(e))

    print("\n" + "="*60)
    print("                E2E Test Complete")
    print("="*60 + "\n")

if __name__ == "__main__":
    # Ensure backend is running before starting
    print("⏳ Waiting for backend to be ready...")
    for _ in range(5):
        try:
            requests.get(API_URL)
            break
        except:
            time.sleep(2)
    
    run_e2e()
