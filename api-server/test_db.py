import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from config import settings

DATABASE_URL = settings.DATABASE_URL

async def test_connection():
    engine = create_async_engine(DATABASE_URL)
    try:
        async with engine.connect() as conn:
            print("Connection successful!")
    except Exception as e:
        print(f"Connection failed: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(test_connection())
