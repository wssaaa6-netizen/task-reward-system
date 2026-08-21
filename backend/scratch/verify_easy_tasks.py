import asyncio
import httpx
import uuid
import sys

BASE_URL = "http://127.0.0.1:8000"

async def main():
    print("=== STARTING FULL END-TO-END VERIFICATION OF EASY TASKS UPGRADE ===")
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
        # 1. Health check
        res = await client.get("/")
        assert res.status_code == 200, "Backend health check failed"
        print("[PASS] 1. Backend server is alive and responding.")

        # 2. Register fresh demo test user
        email = f"task_test_{uuid.uuid4().hex[:6]}@example.com"
        reg_res = await client.post("/api/auth/register", json={
            "full_name": "Easy Task Tester",
            "email": email,
            "password": "Password@123",
            "confirm_password": "Password@123"
        })
        assert reg_res.status_code == 200, f"Register failed: {reg_res.text}"
        data = reg_res.json()["data"]
        token = data["access_token"]
        user_id = data["user"]["id"]
        headers = {"Authorization": f"Bearer {token}"}
        print(f"[PASS] 2. Registered new user: {email} (Initial balance: 50 pts welcome bonus)")

        # 3. Check Daily Summary endpoint
        summary_res = await client.get("/api/tasks/daily-summary", headers=headers)
        assert summary_res.status_code == 200, "Daily summary failed"
        summary_data = summary_res.json()["data"]
        assert summary_data["total_active_tasks"] >= 20, "Expected >= 20 tasks"
        assert summary_data["today_available_points"] > 1000, "Expected > 1000 available points"
        assert summary_data["daily_bonus_target"] == 3
        assert summary_data["daily_bonus_points"] == 300
        print(f"[PASS] 3. Daily summary verified: {summary_data['total_active_tasks']} active tasks, {summary_data['today_available_points']} available points.")

        # 4. Fetch all tasks
        tasks_res = await client.get("/api/tasks", headers=headers)
        assert tasks_res.status_code == 200
        tasks = tasks_res.json()["data"]
        assert len(tasks) >= 20, f"Found only {len(tasks)} tasks"
        print(f"[PASS] 4. Retrieved {len(tasks)} tasks from /api/tasks.")

        # 5. Check easy tasks categories
        easy_tasks = [t for t in tasks if t["difficulty"] == "Easy"]
        assert len(easy_tasks) >= 15, f"Expected >= 15 easy tasks, found {len(easy_tasks)}"
        print(f"[PASS] 5. Verified {len(easy_tasks)} tasks with 'Easy' difficulty badge.")

        # 6. Complete Easy Task 1 (General Knowledge Question: Pacific Ocean -> option index 2)
        task_1 = next((t for t in tasks if "General Knowledge" in t["title"]), tasks[0])
        sub_1 = await client.post("/api/tasks/submit", headers=headers, json={
            "task_id": task_1["id"],
            "selected_option_index": 2
        })
        assert sub_1.status_code == 200, f"Task 1 submission failed: {sub_1.text}"
        sub_1_data = sub_1.json()["data"]
        assert sub_1_data["points_awarded"] == task_1["points"]
        print(f"[PASS] 6. Completed Task 1 ('{task_1['title']}'): +{task_1['points']} points awarded. New balance: {sub_1_data['new_wallet_balance']} pts.")

        # 7. Anti-abuse: Attempt duplicate completion on Task 1
        dup_sub = await client.post("/api/tasks/submit", headers=headers, json={
            "task_id": task_1["id"],
            "selected_option_index": 2
        })
        assert dup_sub.status_code == 400, "Expected duplicate completion to be rejected"
        print("[PASS] 7. Duplicate completion correctly rejected with 400 Bad Request.")

        # 8. Complete Easy Task 2 (True/False: True -> option index 0)
        task_2 = next((t for t in tasks if "True/False" in t["title"]), tasks[1])
        sub_2 = await client.post("/api/tasks/submit", headers=headers, json={
            "task_id": task_2["id"],
            "selected_option_index": 0
        })
        assert sub_2.status_code == 200, f"Task 2 submission failed: {sub_2.text}"
        print(f"[PASS] 8. Completed Task 2 ('{task_2['title']}'): +{task_2['points']} points awarded. Daily count: 2/3.")

        # 9. Complete Easy Task 3 (Tech Facts / Reading Confirm) -> Triggers 3-Task Daily Bonus (+300 pts)
        task_3 = next((t for t in tasks if "3 New Technology Facts" in t["title"] or "Learning" in t["title"]), tasks[2])
        sub_3 = await client.post("/api/tasks/submit", headers=headers, json={
            "task_id": task_3["id"],
            "reading_time_seconds": 15
        })
        assert sub_3.status_code == 200, f"Task 3 submission failed: {sub_3.text}"
        sub_3_data = sub_3.json()["data"]
        assert sub_3_data["daily_bonus_awarded"] == 300, f"Expected 300 daily bonus, got {sub_3_data['daily_bonus_awarded']}"
        print(f"[PASS] 9. Completed Task 3 ('{task_3['title']}'): Daily count reached 3! DAILY BONUS AWARDED: +{sub_3_data['daily_bonus_awarded']} pts.")

        # 10. Verify wallet and transaction ledger
        wallet_res = await client.get("/api/wallet", headers=headers)
        assert wallet_res.status_code == 200
        wallet_data = wallet_res.json()["data"]
        expected_min_points = 50 + task_1["points"] + task_2["points"] + task_3["points"] + 300
        assert wallet_data["available_points"] >= expected_min_points, f"Expected >= {expected_min_points}, got {wallet_data['available_points']}"
        print(f"[PASS] 10. Verified Wallet balance: {wallet_data['available_points']} points (demo cash value: INR {wallet_data['demo_inr_value']:.2f}).")

        # 11. Verify Point Transactions Ledger
        tx_res = await client.get("/api/wallet/transactions", headers=headers)
        assert tx_res.status_code == 200
        txs = tx_res.json()["data"]["items"]
        assert len(txs) >= 5, f"Expected >= 5 transactions, found {len(txs)}"
        has_daily_bonus_tx = any("Daily 3-Task Bonus" in tx["description"] for tx in txs)
        assert has_daily_bonus_tx, "Daily 3-Task Bonus transaction not recorded in ledger"
        print("[PASS] 11. Point transactions ledger verified with explicit Daily 3-Task Bonus entry.")

        # 12. Verify Daily Streak Escalation (Day 1: +50 pts)
        streak_claim = await client.post("/api/streak/claim", headers=headers)
        assert streak_claim.status_code == 200
        assert streak_claim.json()["data"]["points_awarded"] == 50
        print("[PASS] 12. Claimed Daily Streak Day 1 (+50 points).")

        # 13. Verify duplicate streak claim rejected
        dup_streak = await client.post("/api/streak/claim", headers=headers)
        assert dup_streak.status_code == 400
        print("[PASS] 13. Duplicate streak claim correctly blocked for today.")

        print("\n========================================================")
        print("ALL 13 END-TO-END VERIFICATION CHECKS PASSED WITH 100% SUCCESS!")
        print("========================================================")

if __name__ == "__main__":
    asyncio.run(main())
