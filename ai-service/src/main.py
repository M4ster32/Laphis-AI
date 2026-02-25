from fastapi import FastAPI

from src.api.health import router as health_router
from src.api.ask import router as ask_router
from src.api.ingest import router as ingest_router

app = FastAPI(title="LAPHIS AI Service")

app.include_router(health_router)
app.include_router(ask_router)
app.include_router(ingest_router)

@app.get("/")
def root():
    return {"name": "LAPHIS AI Service", "status": "running"}