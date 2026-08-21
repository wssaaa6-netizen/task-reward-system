import pytest
import uuid
from httpx import AsyncClient
from app.core.config import settings
from app.services.wallet_service import WalletService

@pytest.mark.asyncio
async def test_health_root(client: AsyncClient):
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["demo_mode"] is True

@pytest.mark.asyncio
async def test_auth_registration_and_login(client: AsyncClient):
    unique_email = f"testuser_{uuid.uuid4().hex[:6]}@example.com"
    reg_payload = {
        "full_name": "Test User",
        "email": unique_email,
        "mobile": "9876543210",
        "password": "Password@123",
        "confirm_password": "Password@123",
    }
    # 1. Register
    reg_res = await client.post("/api/auth/register", json=reg_payload)
    assert reg_res.status_code == 200
    reg_data = reg_res.json()
    assert reg_data["success"] is True
    assert "access_token" in reg_data["data"]
    token = reg_data["data"]["access_token"]
    assert reg_data["data"]["user"]["points"] >= 50  # Welcome bonus credited!

    # 2. Prevent duplicate email registration
    dup_res = await client.post("/api/auth/register", json=reg_payload)
    assert dup_res.status_code == 400

    # 3. Login
    login_res = await client.post("/api/auth/login", json={
        "email": unique_email,
        "password": "Password@123"
    })
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert login_data["success"] is True
    assert "access_token" in login_data["data"]

    # 4. Profile /me with Bearer token
    headers = {"Authorization": f"Bearer {token}"}
    me_res = await client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["data"]["email"] == unique_email

@pytest.mark.asyncio
async def test_task_list_and_completion(client: AsyncClient):
    email = f"taskuser_{uuid.uuid4().hex[:6]}@example.com"
    reg = await client.post("/api/auth/register", json={
        "full_name": "Task Runner",
        "email": email,
        "password": "Password@123",
        "confirm_password": "Password@123"
    })
    token = reg.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch daily summary
    summary_res = await client.get("/api/tasks/daily-summary", headers=headers)
    assert summary_res.status_code == 200
    assert "today_available_points" in summary_res.json()["data"]

    # Fetch tasks
    tasks_res = await client.get("/api/tasks", headers=headers)
    assert tasks_res.status_code == 200
    tasks = tasks_res.json()["data"]
    assert len(tasks) >= 20

    # Submit task with option index 0
    target_task = tasks[0]
    sub_res = await client.post("/api/tasks/submit", headers=headers, json={
        "task_id": target_task["id"],
        "selected_option_index": 0,
        "text_proof": "def calculate_total(a, b): return a + b",
        "text_answer": "explain def 64 proton"
    })
    # If option index was 0 and it succeeded or we pass the right answer
    if sub_res.status_code != 200:
        # Retry with matching parameters
        sub_res = await client.post("/api/tasks/submit", headers=headers, json={
            "task_id": target_task["id"],
            "selected_option_index": 0,
            "text_proof": "Completed",
            "text_answer": "explain"
        })
    assert sub_res.status_code == 200
    assert sub_res.json()["success"] is True

    # Check that duplicate completion is blocked
    dup_sub = await client.post("/api/tasks/submit", headers=headers, json={
        "task_id": target_task["id"],
        "selected_option_index": 0,
        "text_proof": "Duplicate submission attempt."
    })
    assert dup_sub.status_code == 400
    assert "already completed" in dup_sub.json()["message"].lower()

@pytest.mark.asyncio
async def test_quiz_engine_and_scoring(client: AsyncClient):
    email = f"quizuser_{uuid.uuid4().hex[:6]}@example.com"
    reg = await client.post("/api/auth/register", json={
        "full_name": "Quiz Player",
        "email": email,
        "password": "Password@123",
        "confirm_password": "Password@123"
    })
    token = reg.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # List quizzes
    q_list_res = await client.get("/api/quizzes", headers=headers)
    assert q_list_res.status_code == 200
    quizzes = q_list_res.json()["data"]
    assert len(quizzes) > 0
    target_quiz = quizzes[0]

    # Get quiz for play - verify answers are NOT exposed
    play_res = await client.get(f"/api/quizzes/{target_quiz['id']}/play", headers=headers)
    assert play_res.status_code == 200
    play_data = play_res.json()["data"]
    assert "questions" in play_data
    for q in play_data["questions"]:
        assert "correct_option_index" not in q  # Obfuscated
        assert "explanation" not in q

    # Submit quiz (first attempt)
    answers = [{"question_id": q["id"], "selected_option_index": 0} for q in play_data["questions"]]
    submit_res = await client.post("/api/quizzes/submit", headers=headers, json={
        "quiz_id": target_quiz["id"],
        "time_taken_seconds": 30,
        "answers": answers
    })
    assert submit_res.status_code == 200
    result = submit_res.json()["data"]
    assert "score" in result
    assert "accuracy_percentage" in result
    assert "question_reviews" in result

    # Submit again - verify response format
    submit2_res = await client.post("/api/quizzes/submit", headers=headers, json={
        "quiz_id": target_quiz["id"],
        "time_taken_seconds": 25,
        "answers": answers
    })
    assert submit2_res.status_code == 200
    result2 = submit2_res.json()["data"]
    assert "question_reviews" in result2

@pytest.mark.asyncio
async def test_daily_streak_claim(client: AsyncClient):
    email = f"streakuser_{uuid.uuid4().hex[:6]}@example.com"
    reg = await client.post("/api/auth/register", json={
        "full_name": "Streak Master",
        "email": email,
        "password": "Password@123",
        "confirm_password": "Password@123"
    })
    token = reg.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Claim daily streak
    claim_res = await client.post("/api/streak/claim", headers=headers)
    assert claim_res.status_code == 200
    claim_data = claim_res.json()["data"]
    assert claim_data["streak_count"] >= 1
    assert claim_data["points_awarded"] > 0

    # Second claim on same day should be rejected
    second_claim = await client.post("/api/streak/claim", headers=headers)
    assert second_claim.status_code == 400

@pytest.mark.asyncio
async def test_wallet_ledger_and_redemption(client: AsyncClient):
    email = f"redeemuser_{uuid.uuid4().hex[:6]}@example.com"
    reg = await client.post("/api/auth/register", json={
        "full_name": "Redeem User",
        "email": email,
        "password": "Password@123",
        "confirm_password": "Password@123"
    })
    token = reg.json()["data"]["access_token"]
    user_id = reg.json()["data"]["user"]["id"]
    headers = {"Authorization": f"Bearer {token}"}

    # Add points directly to user's wallet to test redemption
    await WalletService.add_points(
        user_id=user_id,
        amount=2000,
        tx_type="BONUS",
        description="Test Credit for Redemption",
        ref_type="test"
    )

    # Verify wallet balance
    wallet_res = await client.get("/api/wallet", headers=headers)
    assert wallet_res.status_code == 200
    wallet = wallet_res.json()["data"]
    assert wallet["available_points"] >= 2000

    # Check rewards catalog
    rewards_res = await client.get("/api/rewards", headers=headers)
    assert rewards_res.status_code == 200
    rewards = rewards_res.json()["data"]
    recharge_rew = next((r for r in rewards if r["type"] == "MOBILE_RECHARGE"), rewards[0])

    # Redeem reward
    redeem_res = await client.post("/api/redemptions", headers=headers, json={
        "reward_id": recharge_rew["id"],
        "mobile_number": "9876543210",
        "operator": "Airtel",
        "circle": "Delhi"
    })
    assert redeem_res.status_code == 200
    redeem_data = redeem_res.json()["data"]
    assert redeem_data["is_demo"] is True
    assert "DEMO" in redeem_data["demo_disclaimer"]

    # Verify transaction in wallet history
    history_res = await client.get("/api/wallet/transactions", headers=headers)
    assert history_res.status_code == 200
    history = history_res.json()["data"]["items"]
    assert any(tx["type"] == "REDEEM" for tx in history)

@pytest.mark.asyncio
async def test_withdrawal_flow_with_masking(client: AsyncClient):
    email = f"withdraw_{uuid.uuid4().hex[:6]}@example.com"
    reg = await client.post("/api/auth/register", json={
        "full_name": "Withdrawal Tester",
        "email": email,
        "password": "Password@123",
        "confirm_password": "Password@123"
    })
    token = reg.json()["data"]["access_token"]
    user_id = reg.json()["data"]["user"]["id"]
    headers = {"Authorization": f"Bearer {token}"}

    # Credit sufficient points for minimum withdrawal (5000 points)
    await WalletService.add_points(
        user_id=user_id,
        amount=10000,
        tx_type="BONUS",
        description="Funds for Withdrawal Test",
        ref_type="test"
    )

    # Submit bank withdrawal request
    with_res = await client.post("/api/withdrawals", headers=headers, json={
        "method": "BANK_TRANSFER",
        "points": 5000,
        "account_holder_name": "John Doe",
        "account_number": "123456789012",
        "ifsc_code": "HDFC0001234",
        "bank_name": "HDFC Bank"
    })
    assert with_res.status_code == 200
    with_data = with_res.json()["data"]
    assert with_data["is_demo"] is True
    # Verify account number is masked in the response
    assert "123456789012" not in with_data["destination_display"]
    assert "9012" in with_data["destination_display"]

@pytest.mark.asyncio
async def test_referral_signup_bonus(client: AsyncClient):
    # 1. Register Referrer
    referrer_email = f"referrer_{uuid.uuid4().hex[:6]}@example.com"
    ref_reg = await client.post("/api/auth/register", json={
        "full_name": "Referrer User",
        "email": referrer_email,
        "password": "Password@123",
        "confirm_password": "Password@123"
    })
    ref_code = ref_reg.json()["data"]["user"]["referral_code"]
    referrer_id = ref_reg.json()["data"]["user"]["id"]
    assert ref_code.startswith("T2C-")

    # 2. Register Referee using referrer's code
    referee_email = f"referee_{uuid.uuid4().hex[:6]}@example.com"
    referee_reg = await client.post("/api/auth/register", json={
        "full_name": "Referee User",
        "email": referee_email,
        "password": "Password@123",
        "confirm_password": "Password@123",
        "referral_code": ref_code
    })
    assert referee_reg.status_code == 200
    referee_token = referee_reg.json()["data"]["access_token"]

    # Check referee profile has referred_by set
    referee_me = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {referee_token}"})
    assert referee_me.json()["data"]["referred_by"] == referrer_id

@pytest.mark.asyncio
async def test_fraud_logging_and_admin_portal(client: AsyncClient):
    # 1. Login as Admin
    admin_login = await client.post("/api/auth/login", json={
        "email": settings.ADMIN_EMAIL,
        "password": settings.ADMIN_PASSWORD
    })
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["data"]["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Inspect Admin stats and settings
    stats_res = await client.get("/api/admin/stats", headers=admin_headers)
    assert stats_res.status_code == 200
    assert "total_users" in stats_res.json()["data"]

    settings_res = await client.get("/api/settings/public")
    assert settings_res.status_code == 200
    assert settings_res.json()["data"]["conversion_rate"] > 0

    admin_settings_res = await client.get("/api/admin/settings", headers=admin_headers)
    assert admin_settings_res.status_code == 200
    assert admin_settings_res.json()["data"]["conversion_rate"] > 0

    # 3. Check fraud events endpoint
    fraud_res = await client.get("/api/admin/fraud", headers=admin_headers)
    assert fraud_res.status_code == 200
    assert isinstance(fraud_res.json()["data"], list)

    # 4. Verify regular user cannot access admin routes
    norm_email = f"regular_{uuid.uuid4().hex[:6]}@example.com"
    norm_reg = await client.post("/api/auth/register", json={
        "full_name": "Regular User",
        "email": norm_email,
        "password": "Password@123",
        "confirm_password": "Password@123"
    })
    norm_token = norm_reg.json()["data"]["access_token"]
    norm_headers = {"Authorization": f"Bearer {norm_token}"}

    forbidden_res = await client.get("/api/admin/stats", headers=norm_headers)
    assert forbidden_res.status_code == 403

@pytest.mark.asyncio
async def test_daily_bonus_and_streak_upgrades(client: AsyncClient):
    email = f"streakbonus_{uuid.uuid4().hex[:6]}@example.com"
    reg = await client.post("/api/auth/register", json={
        "full_name": "Bonus Seeker",
        "email": email,
        "password": "Password@123",
        "confirm_password": "Password@123"
    })
    token = reg.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Test Streak Day 1 Reward is +50 points
    streak_claim = await client.post("/api/streak/claim", headers=headers)
    assert streak_claim.status_code == 200
    assert streak_claim.json()["data"]["points_awarded"] == 50

    # Test Duplicate Streak Claim is blocked
    dup_streak = await client.post("/api/streak/claim", headers=headers)
    assert dup_streak.status_code == 400

    # Test Daily Summary
    summary = await client.get("/api/tasks/daily-summary", headers=headers)
    assert summary.status_code == 200
    assert summary.json()["data"]["daily_bonus_target"] == 3
    assert summary.json()["data"]["daily_bonus_points"] == 300

@pytest.mark.asyncio
async def test_openapi_security_scheme_and_bearer_auth(client: AsyncClient):
    # 1. Verify OpenAPI schema configuration
    openapi_res = await client.get("/api/openapi.json")
    assert openapi_res.status_code == 200
    openapi = openapi_res.json()
    
    security_schemes = openapi.get("components", {}).get("securitySchemes", {})
    assert "HTTPBearer" in security_schemes
    assert security_schemes["HTTPBearer"]["type"] == "http"
    assert security_schemes["HTTPBearer"]["scheme"] == "bearer"
    assert security_schemes["HTTPBearer"]["bearerFormat"] == "JWT"
    assert "OAuth2PasswordBearer" not in security_schemes

    # Verify protected routes specify the HTTPBearer security requirement
    auth_me_schema = openapi["paths"]["/api/auth/me"]["get"]
    assert auth_me_schema.get("security") == [{"HTTPBearer": []}]

    # 2. Verify unauthorized request fails with 401
    unauth_res = await client.get("/api/auth/me")
    assert unauth_res.status_code == 401
    assert unauth_res.headers.get("www-authenticate") == "Bearer"

    # 3. Verify invalid token request fails with 401
    invalid_res = await client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.token.value"})
    assert invalid_res.status_code == 401

    # 4. Verify login via JSON and accessing /api/auth/me with Bearer token
    email = f"swagger_auth_{uuid.uuid4().hex[:6]}@example.com"
    reg_res = await client.post("/api/auth/register", json={
        "full_name": "Swagger User",
        "email": email,
        "password": "Password@123",
        "confirm_password": "Password@123"
    })
    assert reg_res.status_code == 200

    login_res = await client.post("/api/auth/login", json={
        "email": email,
        "password": "Password@123"
    })
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert login_data["success"] is True
    access_token = login_data["data"]["access_token"]

    me_res = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {access_token}"})
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["success"] is True
    assert me_data["data"]["email"] == email


