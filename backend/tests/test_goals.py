import pytest

def test_create_goal_invalid_amount(client):
    """Test creating a goal with invalid amount."""
    response = client.post("/api/goals/", json={
        "name": "Save for Car",
        "target_amount": -1000
    })
    # Pydantic might catch this if we added ge=0, but otherwise our custom check should
    assert response.status_code == 400

def test_add_negative_amount_to_goal(client):
    """Test adding negative amount to a goal."""
    # First create a goal
    client.post("/api/goals/", json={
        "name": "Emergency Fund",
        "target_amount": 50000
    })
    
    # Try to add negative amount
    response = client.post("/api/goals/1/add-amount?amount=-500")
    assert response.status_code == 400
    assert "positive" in response.json()["detail"]

def test_update_goal_negative_target(client):
    """Test updating goal to negative target."""
    client.post("/api/goals/", json={
        "name": "Vacation",
        "target_amount": 10000
    })
    
    response = client.patch("/api/goals/1", json={
        "target_amount": -5000
    })
    assert response.status_code == 400
    assert "target amount must be positive" in response.json()["detail"].lower()
