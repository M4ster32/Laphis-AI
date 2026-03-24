#!/usr/bin/env python
import sys
import os

# Add the ai-service directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ai-service'))

from src.main import app
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=False
    )
