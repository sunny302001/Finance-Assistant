import pytest

def test_health_check(client):
    """Test that the API is running."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "running"

def test_safe_date_parsing_invalid_format(client):
    """Test that invalid date format returns 400, not 500."""
    # Transactions route with bad date
    response = client.get("/api/transactions/?start_date=not-a-date")
    assert response.status_code == 400
    assert "Invalid date format" in response.json()["detail"]

def test_budget_analysis_missing_income(client):
    """Test that budget analysis works with default income 0."""
    response = client.get("/api/insights/budget-analysis")
    # Should not crash even if income is missing
    assert response.status_code == 200
    assert response.json()["total_income"] == 0
    assert "category_totals" in response.json()

def test_spending_overview_invalid_dates(client):
    """Test spending overview with invalid dates."""
    response = client.get("/api/insights/spending-overview?start_date=2024-13-45")
    assert response.status_code == 400
    assert "Invalid date format" in response.json()["detail"]
