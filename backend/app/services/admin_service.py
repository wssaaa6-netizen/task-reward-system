import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List
from app.database.mongodb import get_database
from app.schemas.admin import AdminStatsResponse
from app.services.settings_service import SettingsService

logger = logging.getLogger("task2cash.services.admin")

class AdminService:
    @staticmethod
    async def get_dashboard_stats() -> AdminStatsResponse:
        db = get_database()
        now = datetime.now(timezone.utc)
        one_day_ago = now - timedelta(days=1)

        total_users = await db.users.count_documents({"role": "USER"})
        active_users = await db.users.count_documents({"role": "USER", "updated_at": {"$gte": one_day_ago}})
        tasks_count = await db.task_submissions.count_documents({})
        quizzes_count = await db.quiz_attempts.count_documents({})

        # Sum total points earned and redeemed across all wallets
        wallet_pipeline = [
            {
                "$group": {
                    "_id": None,
                    "total_earned": {"$sum": "$total_earned"},
                    "total_spent": {"$sum": "$total_spent"}
                }
            }
        ]
        wallet_agg = await db.wallets.aggregate(wallet_pipeline).to_list(1)
        pts_distributed = wallet_agg[0]["total_earned"] if wallet_agg else 0
        pts_redeemed = wallet_agg[0]["total_spent"] if wallet_agg else 0

        settings = await SettingsService.get_settings()
        conversion_rate = settings.conversion_rate
        demo_inr_redeemed = round(pts_redeemed / conversion_rate, 2) if conversion_rate > 0 else 0.0

        pending_wd = await db.withdrawals.count_documents({"status": "PENDING"})
        fraud_alerts = await db.fraud_events.count_documents({"status": "FLAGGED"})

        # Build 7-day trend arrays
        days = []
        user_growth = []
        points_flow = []

        for i in range(6, -1, -1):
            day_start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc) - timedelta(days=i)
            day_end = day_start + timedelta(days=1)
            day_label = day_start.strftime("%b %d")

            # Count users created by that day
            u_count = await db.users.count_documents({"role": "USER", "created_at": {"$lt": day_end}})
            user_growth.append({"date": day_label, "users": u_count})

            # Points earned vs redeemed on that day
            earn_agg = await db.point_transactions.aggregate([
                {"$match": {"type": {"$in": ["EARN", "BONUS"]}, "created_at": {"$gte": day_start, "$lt": day_end}}},
                {"$group": {"_id": None, "pts": {"$sum": "$amount"}}}
            ]).to_list(1)
            pts_in = earn_agg[0]["pts"] if earn_agg else 0

            spend_agg = await db.point_transactions.aggregate([
                {"$match": {"type": "REDEEM", "created_at": {"$gte": day_start, "$lt": day_end}}},
                {"$group": {"_id": None, "pts": {"$sum": "$amount"}}}
            ]).to_list(1)
            pts_out = abs(spend_agg[0]["pts"]) if spend_agg else 0

            points_flow.append({
                "date": day_label,
                "earned": pts_in,
                "redeemed": pts_out
            })

        # Redemptions breakdown by type
        redemp_pipeline = [
            {"$group": {"_id": "$reward_type", "count": {"$sum": 1}, "points": {"$sum": "$points_spent"}}}
        ]
        redemp_agg = await db.redemptions.aggregate(redemp_pipeline).to_list(20)
        redemptions_by_type = [
            {"type": r["_id"] or "Other", "count": r["count"], "points": r["points"]}
            for r in redemp_agg
        ]

        # Recent transaction logs for activity feed
        recent_txs = await db.point_transactions.find({}).sort("created_at", -1).limit(10).to_list(10)
        recent_logs = []
        for tx in recent_txs:
            recent_logs.append({
                "id": str(tx["_id"]),
                "description": tx.get("description", "Points event"),
                "amount": tx.get("amount", 0),
                "type": tx.get("type", "EARN"),
                "timestamp": tx.get("created_at").isoformat() if tx.get("created_at") else None
            })

        return AdminStatsResponse(
            total_users=total_users,
            active_users_24h=active_users,
            tasks_completed=tasks_count,
            quizzes_completed=quizzes_count,
            points_distributed=pts_distributed,
            points_redeemed=pts_redeemed,
            demo_inr_redeemed=demo_inr_redeemed,
            pending_withdrawals_count=pending_wd,
            fraud_alerts_count=fraud_alerts,
            conversion_rate=conversion_rate,
            user_growth=user_growth,
            points_flow=points_flow,
            redemptions_by_type=redemptions_by_type,
            recent_activity_logs=recent_logs
        )
