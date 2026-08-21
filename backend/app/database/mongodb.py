import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING, IndexModel
from app.core.config import settings

logger = logging.getLogger("task2cash.database")

class Database:
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None

db = Database()

async def connect_to_mongo():
    """Establish async MongoDB connection."""
    logger.info("Connecting to MongoDB at %s...", settings.MONGO_URI)
    db.client = AsyncIOMotorClient(
        settings.MONGO_URI,
        maxPoolSize=50,
        minPoolSize=10,
        serverSelectionTimeoutMS=5000
    )
    db.db = db.client[settings.DB_NAME]
    try:
        # Ping server to confirm connection
        await db.client.admin.command('ping')
        logger.info("Successfully connected to MongoDB database '%s'", settings.DB_NAME)
        await create_indexes()
    except Exception as e:
        logger.error("Failed to connect to MongoDB: %s", e)
        raise e

async def close_mongo_connection():
    """Close async MongoDB connection."""
    if db.client:
        logger.info("Closing MongoDB connection...")
        db.client.close()
        logger.info("MongoDB connection closed.")

def get_database() -> AsyncIOMotorDatabase:
    """Return the database instance."""
    return db.db

async def create_indexes():
    """Create essential indexes for performance and data integrity."""
    database = db.db
    if database is None:
        return

    try:
        # Users indexes
        await database.users.create_indexes([
            IndexModel([("email", ASCENDING)], unique=True),
            IndexModel([("referral_code", ASCENDING)], unique=True, sparse=True),
            IndexModel([("mobile", ASCENDING)], sparse=True),
            IndexModel([("role", ASCENDING)]),
            IndexModel([("created_at", DESCENDING)]),
        ])

        # Wallets index
        await database.wallets.create_indexes([
            IndexModel([("user_id", ASCENDING)], unique=True),
        ])

        # Point Transactions indexes
        await database.point_transactions.create_indexes([
            IndexModel([("user_id", ASCENDING), ("created_at", DESCENDING)]),
            IndexModel([("type", ASCENDING)]),
            IndexModel([("reference_id", ASCENDING)], sparse=True),
        ])

        # Tasks indexes
        await database.tasks.create_indexes([
            IndexModel([("status", ASCENDING)]),
            IndexModel([("category", ASCENDING)]),
            IndexModel([("difficulty", ASCENDING)]),
            IndexModel([("created_at", DESCENDING)]),
        ])

        # Task Submissions index
        await database.task_submissions.create_indexes([
            IndexModel([("user_id", ASCENDING), ("task_id", ASCENDING)]),
            IndexModel([("status", ASCENDING)]),
            IndexModel([("created_at", DESCENDING)]),
        ])

        # Quizzes indexes
        await database.quizzes.create_indexes([
            IndexModel([("status", ASCENDING)]),
            IndexModel([("category", ASCENDING)]),
            IndexModel([("difficulty", ASCENDING)]),
            IndexModel([("created_at", DESCENDING)]),
        ])

        # Quiz Attempts indexes
        await database.quiz_attempts.create_indexes([
            IndexModel([("user_id", ASCENDING), ("quiz_id", ASCENDING)]),
            IndexModel([("created_at", DESCENDING)]),
        ])

        # Daily Streaks index
        await database.daily_streaks.create_indexes([
            IndexModel([("user_id", ASCENDING)], unique=True),
        ])

        # Rewards indexes
        await database.rewards.create_indexes([
            IndexModel([("status", ASCENDING)]),
            IndexModel([("type", ASCENDING)]),
            IndexModel([("required_points", ASCENDING)]),
        ])

        # Redemptions indexes
        await database.redemptions.create_indexes([
            IndexModel([("user_id", ASCENDING), ("created_at", DESCENDING)]),
            IndexModel([("status", ASCENDING)]),
            IndexModel([("transaction_id", ASCENDING)], unique=True),
        ])

        # Withdrawals indexes
        await database.withdrawals.create_indexes([
            IndexModel([("user_id", ASCENDING), ("created_at", DESCENDING)]),
            IndexModel([("status", ASCENDING)]),
            IndexModel([("created_at", DESCENDING)]),
        ])

        # Referrals indexes
        await database.referrals.create_indexes([
            IndexModel([("referrer_id", ASCENDING)]),
            IndexModel([("referee_id", ASCENDING)], unique=True),
            IndexModel([("status", ASCENDING)]),
        ])

        # User Achievements indexes
        await database.user_achievements.create_indexes([
            IndexModel([("user_id", ASCENDING), ("achievement_code", ASCENDING)], unique=True),
        ])

        # Notifications indexes
        await database.notifications.create_indexes([
            IndexModel([("user_id", ASCENDING), ("created_at", DESCENDING)]),
            IndexModel([("user_id", ASCENDING), ("is_read", ASCENDING)]),
        ])

        # Fraud Events indexes
        await database.fraud_events.create_indexes([
            IndexModel([("user_id", ASCENDING), ("created_at", DESCENDING)]),
            IndexModel([("risk_level", ASCENDING)]),
            IndexModel([("status", ASCENDING)]),
        ])

        # System Settings index
        await database.system_settings.create_indexes([
            IndexModel([("key", ASCENDING)], unique=True),
        ])

        # Admin Logs index
        await database.admin_logs.create_indexes([
            IndexModel([("created_at", DESCENDING)]),
            IndexModel([("admin_id", ASCENDING)]),
        ])

        logger.info("MongoDB indexes verified and created successfully.")
    except Exception as e:
        logger.warning("Error creating MongoDB indexes (may already exist): %s", e)
