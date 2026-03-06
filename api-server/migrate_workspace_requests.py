"""
Run this script to add workspace_id column and make collection_id nullable
on the saved_requests table.

Usage: python migrate_workspace_requests.py
"""
import asyncio
from sqlalchemy import text
from app.core.database import engine

async def migrate():
    async with engine.begin() as conn:
        # Check if workspace_id column already exists
        result = await conn.execute(text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name='saved_requests' AND column_name='workspace_id'"
        ))
        if result.fetchone():
            print("workspace_id column already exists, skipping.")
            return

        print("Adding workspace_id column to saved_requests...")
        await conn.execute(text(
            "ALTER TABLE saved_requests ADD COLUMN workspace_id INTEGER REFERENCES workspaces(id)"
        ))

        print("Making collection_id nullable...")
        await conn.execute(text(
            "ALTER TABLE saved_requests ALTER COLUMN collection_id DROP NOT NULL"
        ))

        print("Migration complete!")

if __name__ == "__main__":
    asyncio.run(migrate())
