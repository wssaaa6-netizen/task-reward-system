"""Database package initialization"""
from .mongodb import (
    db,
    connect_to_mongo,
    close_mongo_connection,
    get_database,
    create_indexes,
)

__all__ = [
    "db",
    "connect_to_mongo",
    "close_mongo_connection",
    "get_database",
    "create_indexes",
]
