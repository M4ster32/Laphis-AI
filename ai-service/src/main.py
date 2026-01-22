from fastapi import FastAPI

app = FastAPI(title="LAPHIS AI Service")

@app.get("/")
def health():
    return {
        "status": "ok",
        "service": "LAPHIS AI",
        "message": "Backend a correr"
    }
