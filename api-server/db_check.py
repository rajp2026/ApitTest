import asyncio
from sqlalchemy import text
from database import engine

async def check():
    async with engine.connect() as conn:
        result = await conn.execute(text('SELECT count(*) FROM workspaces'))
        count = result.scalar()
        print(f"Total Workspaces: {count}")
        
        result = await conn.execute(text('SELECT id, name FROM workspaces'))
        rows = result.fetchall()
        for row in rows:
            print(f"ID: {row[0]}, Name: {row[1]}")

if __name__ == "__main__":
    asyncio.run(check())
