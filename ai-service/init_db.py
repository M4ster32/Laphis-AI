#!/usr/bin/env python
"""Initialize database with all tables"""
from src.core.db import Base, engine

# Create all tables
Base.metadata.create_all(bind=engine)
print("Database initialized successfully!")
print("Tables created:")
for table in Base.metadata.tables:
    print(f"  - {table}")
